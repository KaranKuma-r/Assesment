import axios from 'axios';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

export async function synthesizeWithSarvam(text, language = 'hi', speaker = 'anushka') {
  try {
    if (!config.sarvamApiKey) {
      throw new Error('Sarvam API key is not configured');
    }

    // Supported female/male speakers for bulbul:v2
    const validSpeakers = ['anushka', 'priya', 'neha', 'pooja', 'simran', 'kavya', 'manisha', 'vidya', 'arya', 'aditya', 'rahul', 'rohan', 'amit', 'dev'];
    let chosenSpeaker = speaker || config.sarvamVoice || 'anushka';
    if (!validSpeakers.includes(chosenSpeaker)) {
      chosenSpeaker = 'anushka';
    }

    logger.voice('Synthesizing speech with Sarvam AI Bulbul TTS...', { speaker: chosenSpeaker, language });

    const langCode = language === 'hi' ? 'hi-IN' : 'en-IN';
    const response = await axios.post(
      'https://api.sarvam.ai/text-to-speech',
      {
        inputs: [text],
        target_language_code: langCode,
        speaker: chosenSpeaker,
        pitch: 0,
        pace: 1.05,
        loudness: 1.2,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: 'bulbul:v2'
      },
      {
        headers: {
          'api-subscription-key': config.sarvamApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );

    const base64Audio = response.data?.audios?.[0];
    if (!base64Audio) {
      throw new Error('Sarvam TTS returned empty audio payload');
    }

    return Buffer.from(base64Audio, 'base64');
  } catch (error) {
    logger.error('Sarvam TTS error:', error.response?.data || error.message);
    throw error;
  }
}
