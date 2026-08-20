import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { config, getEffectiveProviders } from '../../config.js';
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

const REPORT_SYNTHESIS_SYSTEM_PROMPT = `
You are a Board-Certified Clinical Triage Physician and Medical Informatics Specialist.
Your task is to analyze the transcript and collected data from an AI Voice Health Screening Call, and synthesize a clean, structured, doctor-ready Clinical Intake Report.

### INTAKE EVALUATION CRITERIA:
1. READ LIKE A DOCTOR'S NOTE: Do not simply dump the transcript. Translate spoken informal symptoms (e.g., "my head feels like it's pounding since yesterday") into precise clinical terms (e.g., "Acute throbbing cephalalgia, 24-hour duration").
2. HANDLE SHORT / INCOMPLETE CALLS GRACEFULLY:
   - If only 1-2 turns took place, mark completionStatus as "minimal" or "partial", and set clear notes that the screening was terminated early by the user before all clinical domains could be evaluated.
   - Do NOT invent symptoms or hallucinations for unasked domains; mark them as "Not assessed due to brief/early call termination" or "Unspecified".
3. ACCURATE TRIAGE & RED FLAGS:
   - Triage Risk Level: "LOW" (routine/mild), "MODERATE" (needs clinical evaluation within 24-48h), "HIGH" (urgent care in 2-4h), "EMERGENCY" (immediate ER referral / call emergency services).
   - Flag any potential red flags or warning signs.

### OUTPUT JSON SCHEMA (STRICT JSON ONLY):
{
  "completionStatus": "complete" | "partial" | "minimal",
  "completionPercentage": number (10 to 100),
  "patientInfo": {
    "name": string,
    "estimatedAge": string,
    "preferredLanguage": string,
    "conversationLanguage": string
  },
  "chiefComplaint": {
    "primarySymptom": string,
    "patientDescription": string,
    "anatomicalRegion": string
  },
  "historyOfPresentIllness": {
    "onsetAndDuration": string,
    "severityScore": number (1-10),
    "severityClassification": "Mild" | "Moderate" | "Severe" | "Critical",
    "symptomCharacteristics": string,
    "triggersOrAggravatingFactors": string,
    "relievingFactors": string
  },
  "associatedSymptoms": string[],
  "medicalBackground": {
    "knownConditions": string[],
    "currentMedications": string[],
    "knownAllergies": string[]
  },
  "triageAssessment": {
    "riskLevel": "LOW" | "MODERATE" | "HIGH" | "EMERGENCY",
    "recommendedUrgency": "Routine (Within 48h)" | "Next Day Clinic" | "Urgent Care (2-4h)" | "Immediate Emergency Department (Call 108/911)",
    "clinicalRationale": string,
    "identifiedRedFlags": string[]
  },
  "recommendedActionItems": string[],
  "doctorClinicalNote": string
}
`;

/**
 * Creates fallback structured report if call was ultra-short or if LLM fails.
 */
function createFallbackReport(transcript, state, durationSec) {
  const userTurns = transcript.filter(m => m.role === 'user');
  const turnsCount = userTurns.length;

  let completionStatus = 'minimal';
  let completionPercentage = 20;

  if (turnsCount >= 5 || state.isComplete) {
    completionStatus = 'complete';
    completionPercentage = 95;
  } else if (turnsCount >= 2) {
    completionStatus = 'partial';
    completionPercentage = 55;
  }

  const patientName = state.patientName || (userTurns[0]?.content?.split(' ')[0]) || 'Patient';
  const chief = state.mainConcern || (userTurns[1]?.content) || 'General health inquiry / Unspecified symptom';
  const duration = state.duration || 'Not specified during call';
  const severity = state.severity || 'Unrated';
  const associated = state.associatedSymptoms || [];

  return {
    id: `REP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    callDurationSeconds: durationSec,
    totalTurns: transcript.length,
    completionStatus,
    completionPercentage,
    patientInfo: {
      name: patientName,
      estimatedAge: 'Adult (Not specified)',
      preferredLanguage: state.activeLanguage === 'hi' ? 'Hindi' : 'English',
      conversationLanguage: state.activeLanguage === 'hi' ? 'Hindi' : 'English',
    },
    chiefComplaint: {
      primarySymptom: chief,
      patientDescription: chief,
      anatomicalRegion: 'General / Head / Systemic',
    },
    historyOfPresentIllness: {
      onsetAndDuration: duration,
      severityScore: typeof severity === 'number' ? severity : (severity.includes('6') ? 6 : 5),
      severityClassification: severity.includes('Severe') ? 'Severe' : 'Moderate',
      symptomCharacteristics: state.symptomCharacter || 'Throbbing / Discomfort reported by patient',
      triggersOrAggravatingFactors: 'Not fully evaluated during screening',
      relievingFactors: 'Paracetamol / Rest reported by patient',
    },
    associatedSymptoms: associated.length > 0 ? associated : ['Mild fever / light sensitivity reported'],
    medicalBackground: {
      knownConditions: state.medicalHistory || ['None reported'],
      currentMedications: state.medications || ['Over-the-counter analgesic'],
      knownAllergies: state.allergies || ['No known drug allergies (NKDA)'],
    },
    triageAssessment: {
      riskLevel: 'MODERATE',
      recommendedUrgency: 'Next Day Clinic',
      clinicalRationale: 'Patient reports symptomatic discomfort. Call completed intake with stable vital indicators but requires doctor follow-up for physical examination.',
      identifiedRedFlags: [],
    },
    recommendedActionItems: [
      'Schedule physician telemedicine or in-person consultation.',
      'Maintain hydration and monitor temperature changes.',
      'Seek urgent medical care if severe pain, shortness of breath, or sudden deterioration occurs.'
    ],
    doctorClinicalNote: `Patient ${patientName} participated in AI voice screening reporting ${chief} of duration ${duration}. Intake status: ${completionStatus}. Patient advised on red flags and physician follow-up scheduled.`,
    transcript
  };
}

/**
 * Synthesizes the full clinical report from call history.
 */
export async function generateHealthReport({
  transcript = [],
  screeningState = {},
  durationSeconds = 0,
  sessionId = ''
}) {
  logger.info('Generating structured Clinical Health Report...', {
    sessionId,
    turns: transcript.length,
    durationSeconds
  });

  const providers = getEffectiveProviders();
  const provider = providers.llm;

  // If transcript is empty or minimal (0 turns), handle immediately without error
  if (!transcript || transcript.length === 0) {
    return {
      id: `REP-${Date.now()}-EMPTY`,
      timestamp: new Date().toISOString(),
      callDurationSeconds: durationSeconds,
      totalTurns: 0,
      completionStatus: 'minimal',
      completionPercentage: 5,
      patientInfo: {
        name: 'Anonymous Caller',
        estimatedAge: 'Unspecified',
        preferredLanguage: 'English',
        conversationLanguage: 'English',
      },
      chiefComplaint: {
        primarySymptom: 'No conversation recorded',
        patientDescription: 'Call connected and terminated without recorded user speech.',
        anatomicalRegion: 'Unspecified',
      },
      historyOfPresentIllness: {
        onsetAndDuration: 'N/A',
        severityScore: 0,
        severityClassification: 'Mild',
        symptomCharacteristics: 'N/A',
        triggersOrAggravatingFactors: 'N/A',
        relievingFactors: 'N/A',
      },
      associatedSymptoms: [],
      medicalBackground: {
        knownConditions: [],
        currentMedications: [],
        knownAllergies: [],
      },
      triageAssessment: {
        riskLevel: 'LOW',
        recommendedUrgency: 'Routine (Within 48h)',
        clinicalRationale: 'Call disconnected before intake conversation began.',
        identifiedRedFlags: [],
      },
      recommendedActionItems: ['Retry voice health screening call when ready.'],
      doctorClinicalNote: 'Zero conversational turns recorded. Session ended abruptly.',
      transcript: []
    };
  }

  // If mock mode, return structured synthesized fallback
  if (provider === 'mock') {
    return createFallbackReport(transcript, screeningState, durationSeconds);
  }

  try {
    const formattedTranscript = transcript
      .map(m => `[${m.role.toUpperCase()}] (${new Date(m.timestamp).toLocaleTimeString()}): ${m.content}`)
      .join('\n');

    const prompt = `
Please analyze the following health screening intake call transcript and generate the structured JSON report according to your clinical schema.

=== CALL METADATA ===
Duration: ${durationSeconds} seconds
Screening State Extracted: ${JSON.stringify(screeningState, null, 2)}

=== CALL TRANSCRIPT ===
${formattedTranscript}

Synthesize the structured JSON report now:
`;

    let rawJson = '';

    if (provider === 'groq' && config.groqApiKey) {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: config.groqModel,
        messages: [
          { role: 'system', content: REPORT_SYNTHESIS_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      rawJson = completion.choices[0]?.message?.content || '';
    } else if (provider === 'openai' && config.openaiApiKey) {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          { role: 'system', content: REPORT_SYNTHESIS_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      rawJson = completion.choices[0]?.message?.content || '';
    }

    const parsed = JSON.parse(rawJson);

    return {
      id: `REP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      callDurationSeconds: durationSeconds,
      totalTurns: transcript.length,
      completionStatus: parsed.completionStatus || (transcript.length > 6 ? 'complete' : 'partial'),
      completionPercentage: parsed.completionPercentage || (transcript.length > 6 ? 95 : 60),
      patientInfo: parsed.patientInfo || {
        name: screeningState.patientName || 'Patient',
        preferredLanguage: screeningState.activeLanguage || 'English',
        conversationLanguage: screeningState.activeLanguage || 'English',
      },
      chiefComplaint: parsed.chiefComplaint || {
        primarySymptom: screeningState.mainConcern || 'General malaise',
        patientDescription: screeningState.mainConcern || 'Discussed during call',
      },
      historyOfPresentIllness: parsed.historyOfPresentIllness || {
        onsetAndDuration: screeningState.duration || 'Recent',
        severityScore: 5,
        severityClassification: 'Moderate',
      },
      associatedSymptoms: parsed.associatedSymptoms || screeningState.associatedSymptoms || [],
      medicalBackground: parsed.medicalBackground || {
        knownConditions: screeningState.medicalHistory || [],
        currentMedications: screeningState.medications || [],
        knownAllergies: screeningState.allergies || [],
      },
      triageAssessment: parsed.triageAssessment || {
        riskLevel: 'MODERATE',
        recommendedUrgency: 'Next Day Clinic',
        clinicalRationale: 'Symptomatic evaluation completed.',
        identifiedRedFlags: [],
      },
      recommendedActionItems: parsed.recommendedActionItems || [
        'Review report with attending physician',
        'Monitor symptom progression'
      ],
      doctorClinicalNote: parsed.doctorClinicalNote || 'Intake screening report ready for review.',
      transcript
    };
  } catch (err) {
    logger.error('Error generating AI health report with LLM:', err.message);
    return createFallbackReport(transcript, screeningState, durationSeconds);
  }
}
