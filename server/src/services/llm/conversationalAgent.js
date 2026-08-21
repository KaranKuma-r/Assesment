import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { config, getEffectiveProviders } from '../../config.js';
import { SYSTEM_PROMPT, GREETING_PROMPTS, SILENCE_FALLBACK_PROMPTS } from './prompts.js';
import { detectLanguage } from './languageDetector.js';
import { logger } from '../../utils/logger.js';

let openaiClient = null;
let groqClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openaiClient;
}

function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.groqApiKey });
  }
  return groqClient;
}

/**
 * Extracts live clinical state from user utterances in real-time.
 */
export function extractClinicalEntities(userText, currentState = {}) {
  const text = (userText || '').trim();
  const extracted = {};

  // 1. Patient Name
  if (!currentState.patientName) {
    const nameMatch = text.match(/(?:my name is|i am|i'm|this is|call me|मेरा नाम|नाम है)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i);
    if (nameMatch && nameMatch[1]) {
      extracted.patientName = nameMatch[1].replace(/[.,!]/g, '').trim();
    } else if (text.split(' ').length <= 3 && !text.match(/pain|ache|fever|sick|hello|hi|help|nothing|none/i)) {
      extracted.patientName = text.replace(/[.,!]/g, '').trim();
    }
  }

  // 2. Severity Score (1-10)
  const sevMatch = text.match(/\b([1-9]|10)\s*(?:\/\s*10|out of\s*10)\b/i)
    || text.match(/(?:severity|pain\s+(?:is|was)|rate(?:\s+(?:it|the pain))?\s+(?:as|at))\s*(?:a|an)?\s*([1-9]|10)\b/i);
  if (sevMatch) {
    extracted.severity = `${sevMatch[1] || sevMatch[2]}/10`;
  }

  // 3. Duration & Onset
  const durMatch = text.match(/((?:since|for|about|around|last)\s+(?:\d+\s+)?(?:hours?|days?|weeks?|months?|minutes?|yesterday|morning|night)|(?:कल|सुबह|शाम|रात)\s+से|\d+\s+(?:दिन|घंटे|हफ्ते)\s+से)/i);
  if (durMatch) {
    extracted.duration = durMatch[1];
  }

  // 4. Chief Complaint & Symptoms
  const symptoms = [
    'stomach ache', 'stomach pain', 'headache', 'chest pain', 'back pain',
    'fever', 'cough', 'cold', 'sore throat', 'nausea', 'vomiting', 'dizziness',
    'body ache', 'shortness of breath', 'joint pain', 'knee pain',
    'सिरदर्द', 'पेट दर्द', 'बुखार', 'छाती में दर्द', 'खांसी', 'चक्कर'
  ];
  for (const s of symptoms) {
    if (text.toLowerCase().includes(s.toLowerCase())) {
      if (!currentState.mainConcern) {
        extracted.mainConcern = s;
      }
      break;
    }
  }

  return extracted;
}

/**
 * Parses assistant output into 100% clean spoken text (removes any accidental JSON/markdown).
 */
export function parseAgentResponse(rawText) {
  let spokenText = (rawText || '').trim();

  // Strip any JSON code blocks
  spokenText = spokenText.replace(/```(?:json)?[\s\S]*?```/g, '').trim();
  
  // Strip raw JSON objects if model dumped any
  spokenText = spokenText.replace(/\{[\s\S]*?"(?:extracted|stage|patientName)"[\s\S]*?\}/g, '').trim();

  // Clean markdown asterisks, hashes, backticks, quotes
  spokenText = spokenText
    .replace(/^["']|["']$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`+/g, '')
    .trim();

  return { spokenText, metadata: null };
}

function createMockConversation(currentState, extracted, language) {
  const state = { ...currentState, ...extracted };
  const prompts = language === 'hi'
    ? {
        main_concern: 'धन्यवाद। आज आप किस मुख्य स्वास्थ्य समस्या या लक्षण के बारे में बात करना चाहते हैं?',
        duration: 'समझ गई। यह कब शुरू हुआ और कितने समय से हो रहा है?',
        severity: 'अभी 1 से 10 के पैमाने पर इसकी तीव्रता कितनी है?',
        associated_symptoms: 'क्या बुखार, मतली, सांस लेने में तकलीफ या चक्कर जैसे कोई और लक्षण हैं?',
        medical_history: 'क्या आपको कोई बीमारी, चल रही दवा या एलर्जी है?',
        complete: 'धन्यवाद। इस स्क्रीनिंग के लिए जरूरी जानकारी मिल गई है। आप तैयार हों तो कॉल समाप्त कर सकते हैं।',
      }
    : {
        main_concern: 'Thank you. What is the main health concern or symptom you would like to discuss today?',
        duration: 'I understand. When did this start, and how long has it been going on?',
        severity: 'On a scale of 1 to 10, how severe is it right now?',
        associated_symptoms: 'Are you having any other symptoms, such as fever, nausea, breathing difficulty, or dizziness?',
        medical_history: 'Do you have any relevant medical conditions, medicines, or allergies?',
        complete: 'Thank you. I have the key details for this screening. You can end the call whenever you are ready.',
      };
  let stage;
  if (!state.mainConcern) stage = 'main_concern';
  else if (!state.duration) stage = 'duration';
  else if (!state.severity) stage = 'severity';
  else if (currentState.stage !== 'associated_symptoms') stage = 'associated_symptoms';
  else if (currentState.stage !== 'medical_history') stage = 'medical_history';
  else stage = 'complete';
  return { spokenText: prompts[stage], metadata: { stage, isComplete: stage === 'complete', language, extracted }, language };
}

function isGenericHealthStatement(text, currentState, extracted) {
  if (currentState.mainConcern || extracted.mainConcern) return false;
  const value = text.trim().toLowerCase();
  return /\b(?:not feeling well|feeling unwell|health is bad|health isn't good|health is not good|feel sick)\b/i.test(value)
    || /(?:तबीयत\s*(?:बहुत\s*)?खराब|स्वास्थ्य\s*(?:ठीक\s*)?नहीं|अच्छा\s*नहीं\s*लग\s*रहा|बीमार\s*महसूस)/.test(text)
    || /\b(?:meri|mera|mujhe)\s+(?:tabiyat|sehat|health)\s+(?:kharab|theek nahi|acchi nahi)\b/i.test(value);
}

function hasEmergencyRedFlag(text) {
  const value = text.toLowerCase();
  return /(?:crushing chest pain|severe chest pain|cannot breathe|can't breathe|severe trouble breathing|unconscious|passed out|one-sided weakness|face drooping|slurred speech|severe bleeding)/.test(value)
    || /(?:सीने में बहुत तेज दर्द|सांस नहीं ले पा|बेहोश|चेहरा टेढ़ा|बोलने में दिक्कत|बहुत ज्यादा खून)/.test(text);
}

function isConversationExitIntent(text) {
  const value = text.trim().toLowerCase();
  return /\b(?:bye|bye bye|goodbye|i don't want to talk|i do not want to talk|don't want to continue|do not want to continue|no more questions)\b/.test(value)
    || /(?:मुझे\s*(?:कुछ\s*)?बात\s*नहीं करनी|बात नहीं करनी|अब नहीं बात करनी|चलो बाय|फिर मिलेंगे|अलविदा)/.test(text);
}

/**
 * Generates initial greeting message when call starts.
 */
export function getInitialGreeting(preferredLanguage = 'en') {
  const lang = preferredLanguage === 'hi' ? 'hi' : 'en';
  return {
    spokenText: GREETING_PROMPTS[lang] || GREETING_PROMPTS.en,
    language: lang,
    stage: 'greeting',
    metadata: {
      stage: 'greeting',
      isComplete: false,
      language: lang,
      extracted: {}
    }
  };
}

/**
 * Main function: Process user speech / text turn and generate adaptive AI voice response.
 */
export async function processConversationTurn({
  userText,
  transcript = [],
  currentState = {},
  isSilence = false,
  languageMode = 'auto'
}) {
  const currentLang = currentState.activeLanguage || (languageMode === 'hi' ? 'hi' : 'en');

  // Handle silence or empty transcript
  if (isSilence || !userText || userText.trim().length === 0) {
    const fallbackText = SILENCE_FALLBACK_PROMPTS[currentLang] || SILENCE_FALLBACK_PROMPTS.en;
    return {
      spokenText: fallbackText,
      metadata: { stage: currentState.stage || 'greeting', isComplete: false },
      language: currentLang
    };
  }

  // Detect language if auto-detect enabled
  const detectedLang = languageMode === 'auto' ? detectLanguage(userText, currentLang) : languageMode;
  const providers = getEffectiveProviders();
  const provider = providers.llm;
  const extractedNow = extractClinicalEntities(userText, currentState);

  if (hasEmergencyRedFlag(userText)) {
    return {
      spokenText: detectedLang === 'hi'
        ? 'ये गंभीर लक्षण हो सकते हैं। कृपया अभी 112 पर कॉल करें या तुरंत नज़दीकी आपातकालीन विभाग जाएँ।'
        : 'These may be serious symptoms. Please call emergency services now or go to the nearest emergency department immediately.',
      metadata: {
        stage: 'emergency_escalation',
        isComplete: false,
        language: detectedLang,
        extracted: extractedNow,
      },
      language: detectedLang,
    };
  }

  if (isConversationExitIntent(userText)) {
    return {
      spokenText: detectedLang === 'hi'
        ? 'ठीक है। अपना ध्यान रखें। जब आप तैयार हों, कॉल समाप्त कर दें।'
        : 'Okay. Please take care. End the call whenever you are ready.',
      metadata: {
        stage: 'ended_by_user',
        isComplete: true,
        language: detectedLang,
        extracted: extractedNow,
      },
      language: detectedLang,
    };
  }

  // Prevent the model from guessing a symptom from a vague "I feel unwell" statement.
  if (isGenericHealthStatement(userText, currentState, extractedNow)) {
    return {
      spokenText: detectedLang === 'hi'
        ? 'मुझे अफ़सोस है कि आप ठीक महसूस नहीं कर रहे हैं। आपको किस तरह की तकलीफ हो रही है?'
        : "I'm sorry you're not feeling well. What kind of discomfort are you having?",
      metadata: {
        stage: 'main_concern',
        isComplete: false,
        language: detectedLang,
        extracted: extractedNow,
      },
      language: detectedLang,
    };
  }

  // Credential-free mode remains usable for demos by advancing through missing intake fields.
  if (provider === 'mock') {
    return createMockConversation(currentState, extractedNow, detectedLang);
  }

  try {
    // Build chat history for LLM
    const latestTranscriptMessage = transcript[transcript.length - 1];
    const history = latestTranscriptMessage?.role === 'user' && latestTranscriptMessage.content === userText
      ? transcript.slice(0, -1)
      : transcript;
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: userText }
    ];

    let rawResponse = '';

    if (provider === 'groq' && config.groqApiKey) {
      const groq = getGroqClient();
      logger.info('Calling Groq LLM (Llama-3.3-70B)...');
      const completion = await groq.chat.completions.create({
        model: config.groqModel,
        messages,
        temperature: 0.3,
        max_tokens: 300,
      });
      rawResponse = completion.choices[0]?.message?.content || '';
    } else if (provider === 'openai' && config.openaiApiKey) {
      const openai = getOpenAIClient();
      logger.info('Calling OpenAI LLM (gpt-4o-mini)...');
      const completion = await openai.chat.completions.create({
        model: config.openaiModel,
        messages,
        temperature: 0.3,
        max_tokens: 300,
      });
      rawResponse = completion.choices[0]?.message?.content || '';
    }

    const { spokenText } = parseAgentResponse(rawResponse);
    return {
      spokenText: spokenText || (detectedLang === 'hi' ? "कृपया थोड़ा और विस्तार से बता सकते हैं?" : "Could you tell me a little more about that?"),
      metadata: {
        stage: currentState.stage || 'in_progress',
        isComplete: false,
        language: detectedLang,
        extracted: extractedNow
      },
      language: detectedLang
    };
  } catch (error) {
    logger.error('LLM API error during conversation turn:', error.message);
    
    // Dynamic context-aware response without hardcoded fake names or symptoms
    const patientName = currentState.patientName || '';
    const namePrefix = patientName ? `${patientName}, ` : '';
    const dynamicFallback = detectedLang === 'hi'
      ? `धन्यवाद ${namePrefix}। क्या आप अपने स्वास्थ्य या लक्षण के बारे में थोड़ा और बता सकते हैं?`
      : `Thank you ${namePrefix}. Could you please tell me more about what symptoms you are experiencing?`;

    return {
      spokenText: dynamicFallback,
      metadata: {
        stage: currentState.stage || 'main_concern',
        isComplete: false,
        language: detectedLang,
        extracted: {
          patientName: currentState.patientName || null,
          ...extractedNow
        }
      },
      language: detectedLang
    };
  }
}
