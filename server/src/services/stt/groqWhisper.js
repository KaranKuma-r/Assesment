import Groq, { toFile } from 'groq-sdk';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

let groqClient = null;

function getClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.groqApiKey });
  }
  return groqClient;
}

export async function transcribeWithGroq(audioBuffer, languageHint) {
  try {
    const client = getClient();
    const file = await toFile(audioBuffer, 'audio.webm', { type: 'audio/webm' });

    logger.voice('Transcribing with Groq Whisper...', { bytes: audioBuffer.length });

    const params = {
      file,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      temperature: 0.1,
      prompt: 'AuraHealth medical intake conversation in English or Hindi / Hinglish.',
    };

    if (languageHint && languageHint !== 'auto') {
      params.language = languageHint === 'hi' ? 'hi' : 'en';
    }

    const response = await client.audio.transcriptions.create(params);
    const text = response.text ? response.text.trim() : '';
    
    // Normalize language to English or Hindi only
    let detectedLang = response.language || languageHint;
    if (detectedLang !== 'hi' && detectedLang !== 'en') {
      detectedLang = languageHint === 'hi' ? 'hi' : 'en';
    }

    return { text, language: detectedLang };
  } catch (error) {
    logger.error('Groq Whisper error:', error.message);
    throw error;
  }
}
