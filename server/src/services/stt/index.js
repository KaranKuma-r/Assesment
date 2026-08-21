import { config, getEffectiveProviders } from '../../config.js';
import { transcribeWithOpenAI } from './openaiWhisper.js';
import { transcribeWithGroq } from './groqWhisper.js';
import { transcribeWithSarvam } from './sarvamSTT.js';
import { logger } from '../../utils/logger.js';

export async function transcribeAudio(audioBuffer, languageHint = 'auto', turnIndex = 0) {
  if (!audioBuffer || audioBuffer.length < 500) {
    logger.warn('Audio buffer too small or silent. Skipping transcription.');
    return { text: '', language: languageHint === 'auto' ? 'en' : languageHint, isSilent: true };
  }

  const providers = getEffectiveProviders();
  const provider = providers.stt;
  logger.info(`STT requested using provider: [${provider}], languageHint: [${languageHint}]`);

  const lang = languageHint === 'auto' ? undefined : languageHint;

  try {
    if (provider === 'groq' && config.groqApiKey) {
      return await transcribeWithGroq(audioBuffer, lang);
    } else if (provider === 'openai' && config.openaiApiKey) {
      return await transcribeWithOpenAI(audioBuffer, lang);
    } else if (provider === 'sarvam' && config.sarvamApiKey) {
      return await transcribeWithSarvam(audioBuffer, lang);
    } else {
      return { text: '', language: languageHint === 'auto' ? 'en' : languageHint, isSilent: true };
    }
  } catch (primaryError) {
    logger.warn(`Primary STT provider [${provider}] failed: ${primaryError.message}. Attempting fallback...`);

    // Fallback chain
    if (provider !== 'groq' && config.groqApiKey) {
      try {
        return await transcribeWithGroq(audioBuffer, lang);
      } catch (e) {
        logger.error('Fallback to Groq STT failed:', e.message);
      }
    }

    if (provider !== 'sarvam' && config.sarvamApiKey) {
      try {
        return await transcribeWithSarvam(audioBuffer, lang);
      } catch (e) {
        logger.error('Fallback to Sarvam STT failed:', e.message);
      }
    }

    if (provider !== 'openai' && config.openaiApiKey) {
      try {
        return await transcribeWithOpenAI(audioBuffer, lang);
      } catch (e) {
        logger.error('Fallback to OpenAI STT failed:', e.message);
      }
    }

    logger.warn('All external STT providers failed or unavailable.');
    return { text: '', language: languageHint === 'auto' ? 'en' : languageHint, isSilent: true };
  }
}
