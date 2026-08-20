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
 * Parses assistant output into spoken text and extracted JSON metadata.
 */
export function parseAgentResponse(rawText) {
  let spokenText = rawText;
  let metadata = null;

  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      metadata = JSON.parse(jsonMatch[1]);
      spokenText = rawText.replace(/```json[\s\S]*?```/g, '').trim();
    } catch (e) {
      logger.warn('Failed to parse metadata JSON from agent response:', e.message);
    }
  }

  // Clean up any stray markdown characters from spoken text
  spokenText = spokenText
    .replace(/^["']|["']$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s+/g, '')
    .trim();

  return { spokenText, metadata };
}

/**
 * Generates the greeting message when call starts.
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
 * Generates simulated agent response when zero API keys are present (Mock Mode).
 */
function generateMockResponse(transcript, currentState, userMessage) {
  const lang = detectLanguage(userMessage, currentState.activeLanguage || 'en');
  const turns = transcript.filter(m => m.role === 'user').length;

  const mockStepsEn = [
    {
      spokenText: "Thank you, Rahul. Could you tell me what primary health concern or symptom brings you in today?",
      stage: "main_concern",
      extracted: { patientName: "Rahul" }
    },
    {
      spokenText: "I'm sorry you're experiencing a headache and fever. How many days has this been going on?",
      stage: "duration",
      extracted: { mainConcern: "Headache and mild fever" }
    },
    {
      spokenText: "On a scale of 1 to 10, with 10 being the most severe, how intense is the pain right now?",
      stage: "severity",
      extracted: { duration: "Since yesterday (approx 24 hours)" }
    },
    {
      spokenText: "Got it. Are you experiencing any other symptoms, such as nausea, dizziness, or body chills?",
      stage: "associated_symptoms",
      extracted: { severity: "6/10 (Moderate to Severe)", symptomCharacter: "Throbbing temples" }
    },
    {
      spokenText: "Thank you. Do you have any known medical conditions or allergies to medications?",
      stage: "history_and_safety",
      extracted: { associatedSymptoms: ["Nausea", "Light sensitivity"] }
    },
    {
      spokenText: "Thank you so much for sharing these details. I have prepared your intake summary for the physician.",
      stage: "wrap_up",
      isComplete: true,
      extracted: { medicalHistory: ["None reported"], allergies: ["No known allergies"] }
    }
  ];

  const mockStepsHi = [
    {
      spokenText: "धन्यवाद राहुल जी। कृपया बताइए कि आज आपको क्या मुख्य तकलीफ़ या लक्षण महसूस हो रहे हैं?",
      stage: "main_concern",
      extracted: { patientName: "Rahul" }
    },
    {
      spokenText: "सिरदर्द और बुखार के बारे में सुनकर दुःख हुआ। यह तकलीफ़ आपको कब से हो रही है?",
      stage: "duration",
      extracted: { mainConcern: "सिरदर्द और हल्का बुखार" }
    },
    {
      spokenText: "1 से 10 के पैमाने पर, आप इस दर्द को कितना गंभीर बताएंगे?",
      stage: "severity",
      extracted: { duration: "कल से (लगभग 24 घंटे)" }
    },
    {
      spokenText: "समझ गई। क्या आपको कोई अन्य लक्षण जैसे चक्कर आना, उल्टी या ठंड लगना भी महसूस हो रहा है?",
      stage: "associated_symptoms",
      extracted: { severity: "6/10 (मध्यम-तीव्र)", symptomCharacter: "माथे में धड़कन जैसा दर्द" }
    },
    {
      spokenText: "धन्यवाद। क्या आपको कोई पुरानी बीमारी या किसी दवाई से एलर्जी है?",
      stage: "history_and_safety",
      extracted: { associatedSymptoms: ["जी मिचलाना", "रोशनी से परेशानी"] }
    },
    {
      spokenText: "जानकारी साझा करने के लिए बहुत धन्यवाद। मैंने आपकी प्रारंभिक स्वास्थ्य रिपोर्ट तैयार कर ली है जो डॉक्टर के पास भेज दी गई है।",
      stage: "wrap_up",
      isComplete: true,
      extracted: { medicalHistory: ["कोई नहीं"], allergies: ["कोई एलर्जी नहीं"] }
    }
  ];

  const steps = lang === 'hi' ? mockStepsHi : mockStepsEn;
  const stepIndex = Math.min(turns - 1, steps.length - 1);
  const currentStep = steps[stepIndex] || steps[steps.length - 1];

  return {
    spokenText: currentStep.spokenText,
    metadata: {
      extracted: currentStep.extracted || {},
      stage: currentStep.stage || 'in_progress',
      isComplete: currentStep.isComplete || false,
      language: lang
    },
    language: lang
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

  if (provider === 'mock') {
    return generateMockResponse(transcript, { ...currentState, activeLanguage: detectedLang }, userText);
  }

  try {
    // Build chat history for LLM
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...transcript.map(m => ({
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

    const { spokenText, metadata } = parseAgentResponse(rawResponse);

    return {
      spokenText: spokenText || (detectedLang === 'hi' ? "कृपया थोड़ा और विस्तार से बता सकते हैं?" : "Could you tell me a little more about that?"),
      metadata: metadata || { stage: 'in_progress', isComplete: false },
      language: metadata?.language || detectedLang
    };
  } catch (error) {
    logger.error('LLM API error during conversation turn:', error.message);
    // Fallback to mock logic if network or rate limit happens
    logger.warn('Falling back to mock conversational turn due to error.');
    return generateMockResponse(transcript, { ...currentState, activeLanguage: detectedLang }, userText);
  }
}
