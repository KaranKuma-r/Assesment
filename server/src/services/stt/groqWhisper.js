import Groq from 'groq-sdk';
import { config } from '../../config.js';
import { bufferToFileLike } from '../../utils/audioUtils.js';
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
    const file = await bufferToFileLike(audioBuffer, 'audio.webm', 'audio/webm');

    logger.voice('Transcribing with Groq Whisper...', { bytes: audioBuffer.length });

    const params = {
      file,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      temperature: 0.1,
    };

    if (languageHint && languageHint !== 'auto') {
      params.language = languageHint;
    }

    const response = await client.audio.transcriptions.create(params);
    const text = response.text ? response.text.trim() : '';
    const detectedLang = response.language || languageHint;

    return { text, language: detectedLang };
  } catch (error) {
    logger.error('Groq Whisper error:', error.message);
    throw error;
  }
}
