import axios from 'axios';
import FormData from 'form-data';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

export async function transcribeWithSarvam(audioBuffer, languageHint = 'hi') {
  try {
    if (!config.sarvamApiKey) {
      throw new Error('Sarvam API key is not configured');
    }

    logger.voice('Transcribing with Sarvam AI Saarika STT...', { bytes: audioBuffer.length });

    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });

    const langCode = languageHint === 'en' ? 'en-IN' : 'hi-IN';
    form.append('language_code', langCode);
    form.append('model', 'saarika:v2');

    const response = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
      headers: {
        'api-subscription-key': config.sarvamApiKey,
        ...form.getHeaders(),
      },
      timeout: 10000,
    });

    const text = response.data?.transcript?.trim() || '';
    const detectedLang = response.data?.language_code?.startsWith('hi') ? 'hi' : 'en';

    return { text, language: detectedLang };
  } catch (error) {
    logger.error('Sarvam STT error:', error.response?.data || error.message);
    throw error;
  }
}
