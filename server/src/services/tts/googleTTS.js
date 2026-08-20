import axios from 'axios';
import { logger } from '../../utils/logger.js';

export async function synthesizeWithGoogle(text, language = 'en') {
  try {
    const langCode = language === 'hi' ? 'hi' : 'en';
    const cleanText = text.replace(/[\n\r]+/g, ' ').slice(0, 300); // chunk max 300 chars for safety

    logger.voice('Synthesizing speech with Google TTS engine...', { langCode, length: cleanText.length });

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${langCode}&client=tw-ob`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    return Buffer.from(response.data);
  } catch (error) {
    logger.error('Google TTS synthesis error:', error.message);
    throw error;
  }
}
