import { logger } from '../../utils/logger.js';

const SAMPLE_UTTERANCES = {
  en: [
    "Hello doctor, my name is Rahul Sharma.",
    "I have had a bad headache and mild fever since yesterday.",
    "The pain is about 6 out of 10, mostly in my temples.",
    "It feels throbbing, and I also feel a bit nauseous and sensitive to light.",
    "I took some paracetamol, which helped a little bit.",
    "No other chronic health conditions, and no allergies that I know of.",
    "Thank you so much doctor for the guidance."
  ],
  hi: [
    "नमस्ते, मेरा नाम राहुल है।",
    "मुझे कल रात से तेज सिरदर्द और हल्का बुखार महसूस हो रहा है।",
    "दर्द 10 में से लगभग 6 है, खासकर माथे के दोनों तरफ।",
    "धड़कने जैसा दर्द है और थोड़ा जी मिचला रहा है।",
    "मैंने एक पैरासिटामोल ली थी जिससे थोड़ा आराम मिला।",
    "कोई पुरानी बीमारी या एलर्जी नहीं है।",
    "बहुत-बहुत धन्यवाद डॉक्टर साहब।"
  ]
};

export async function transcribeWithMock(audioBuffer, languageHint = 'en', turnIndex = 0) {
  logger.info('Using Mock STT (Zero-key simulation mode)...', { bytes: audioBuffer.length, turnIndex });
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  const lang = languageHint === 'hi' ? 'hi' : 'en';
  const utterances = SAMPLE_UTTERANCES[lang] || SAMPLE_UTTERANCES.en;
  const index = Math.min(turnIndex, utterances.length - 1);
  const text = utterances[index];
  
  return {
    text,
    language: lang,
    confidence: 0.95
  };
}
