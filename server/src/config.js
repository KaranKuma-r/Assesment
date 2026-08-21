import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root, server directory, and current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),

  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  sarvamApiKey: process.env.SARVAM_API_KEY || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',

  // Provider Selection
  sttProvider: process.env.STT_PROVIDER || '',
  llmProvider: process.env.LLM_PROVIDER || '',
  ttsProvider: process.env.TTS_PROVIDER || '',

  // Models
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // Voice configurations
  openaiVoice: process.env.OPENAI_VOICE || 'nova', // alloy, nova, shimmer, echo
  sarvamVoice: process.env.SARVAM_VOICE || 'anushka', // anushka, priya, neha, pooja, simran

  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'auto', // 'auto' | 'en' | 'hi'
  
  // Audio parameters
  maxTurnSeconds: 45,
  silenceThresholdMs: 2200,
};

export function getEffectiveProviders() {
  const hasGroq = Boolean(config.groqApiKey && config.groqApiKey.trim().length > 5);
  const hasOpenAI = Boolean(config.openaiApiKey && config.openaiApiKey.trim().length > 5);
  const hasSarvam = Boolean(config.sarvamApiKey && config.sarvamApiKey.trim().length > 5);

  let stt = config.sttProvider;
  if (!stt) {
    if (hasGroq) stt = 'groq';
    else if (hasOpenAI) stt = 'openai';
    else if (hasSarvam) stt = 'sarvam';
    else stt = 'mock';
  }

  let llm = config.llmProvider;
  if (!llm) {
    if (hasGroq) llm = 'groq';
    else if (hasOpenAI) llm = 'openai';
    else llm = 'mock';
  }

  let tts = config.ttsProvider;
  if (!tts) {
    if (hasOpenAI) tts = 'openai';
    else if (hasSarvam) tts = 'sarvam';
    else tts = 'google';
  }

  return {
    stt,
    llm,
    tts,
    hasGroq,
    hasOpenAI,
    hasSarvam,
  };
}
