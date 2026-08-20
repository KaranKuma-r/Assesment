import OpenAI from 'openai';
import { config } from '../../config.js';
import { bufferToFileLike } from '../../utils/audioUtils.js';
import { logger } from '../../utils/logger.js';

let openaiClient = null;

function getClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openaiClient;
}

export async function transcribeWithOpenAI(audioBuffer, languageHint) {
  try {
    const client = getClient();
    const file = await bufferToFileLike(audioBuffer, 'audio.webm', 'audio/webm');

    logger.voice('Transcribing with OpenAI Whisper...', { bytes: audioBuffer.length });

    const params = {
      file,
      model: 'whisper-1',
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
    logger.error('OpenAI Whisper error:', error.message);
    throw error;
  }
}
