import { config, getEffectiveProviders } from '../../config.js';
import { synthesizeWithOpenAI } from './openaiTTS.js';
import { synthesizeWithSarvam } from './sarvamTTS.js';
import { synthesizeWithGoogle } from './googleTTS.js';
import { bufferToBase64 } from '../../utils/audioUtils.js';
import { logger } from '../../utils/logger.js';

export async function synthesizeSpeech(text, language = 'en', voice) {
  if (!text || text.trim().length === 0) {
    return { audioBuffer: null, audioBase64: null };
  }

  const providers = getEffectiveProviders();
  let provider = providers.tts;

  // If Hindi requested and Sarvam is configured, prioritize Sarvam for native Indian prosody
  if (language === 'hi' && config.sarvamApiKey) {
    provider = 'sarvam';
  }

  logger.info(`TTS requested using provider: [${provider}], language: [${language}]`);

  let audioBuffer = null;

  try {
    if (provider === 'sarvam' && config.sarvamApiKey) {
      audioBuffer = await synthesizeWithSarvam(text, language, voice || config.sarvamVoice);
    } else if (provider === 'openai' && config.openaiApiKey) {
      audioBuffer = await synthesizeWithOpenAI(text, voice || config.openaiVoice);
    } else {
      audioBuffer = await synthesizeWithGoogle(text, language);
    }
  } catch (primaryErr) {
    logger.warn(`Primary TTS provider [${provider}] failed: ${primaryErr.message}. Attempting fallback...`);

    // Fallback 1: Google TTS (Always available, no keys needed)
    try {
      audioBuffer = await synthesizeWithGoogle(text, language);
    } catch (fallbackErr) {
      logger.error('Fallback to Google TTS failed:', fallbackErr.message);

      // Fallback 2: OpenAI TTS if available
      if (config.openaiApiKey && provider !== 'openai') {
        try {
          audioBuffer = await synthesizeWithOpenAI(text, voice || config.openaiVoice);
        } catch (e) {
          logger.error('Fallback to OpenAI TTS failed:', e.message);
        }
      }
    }
  }

  const audioBase64 = audioBuffer ? bufferToBase64(audioBuffer, 'audio/mp3') : null;

  return {
    audioBuffer,
    audioBase64,
    provider,
    language
  };
}
