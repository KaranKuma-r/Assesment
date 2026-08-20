import OpenAI from 'openai';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

let openaiClient = null;

function getClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openaiClient;
}

export async function synthesizeWithOpenAI(text, voice = 'nova') {
  try {
    const client = getClient();
    logger.voice('Synthesizing speech with OpenAI TTS...', { voice, textLen: text.length });

    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice || config.openaiVoice,
      input: text,
      response_format: 'mp3',
      speed: 1.05,
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error('OpenAI TTS error:', error.message);
    throw error;
  }
}
