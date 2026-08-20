const HINDI_DEVANAGARI_REGEX = /[\u0900-\u097F]/;

const HINGLISH_KEYWORDS = [
  'namaste', 'namaskar', 'mujhe', 'mera', 'meri', 'dard', 'bukhar', 'khansi',
  'zukam', 'pet', 'sar', 'sir', 'hai', 'hain', 'ho', 'raha', 'rahi', 'kya',
  'doctor', 'sahab', 'theek', 'nahi', 'kripya', 'shukriya', 'dhanyawad',
  'dawa', 'dawakhana', 'takleef', 'pareshani', 'chakkar', 'ulti', 'kamzor'
];

export function detectLanguage(text, currentLang = 'en') {
  if (!text || typeof text !== 'string') return currentLang;

  const trimmed = text.trim();
  if (!trimmed) return currentLang;

  // 1. Check Devanagari script
  if (HINDI_DEVANAGARI_REGEX.test(trimmed)) {
    return 'hi';
  }

  // 2. Check Romanized Hindi (Hinglish)
  const lower = trimmed.toLowerCase();
  const words = lower.split(/[\s,.'!?-]+/);
  let hinglishCount = 0;

  for (const word of words) {
    if (HINGLISH_KEYWORDS.includes(word)) {
      hinglishCount++;
    }
  }

  // If 2 or more Hinglish words or >25% of words are Hinglish
  if (hinglishCount >= 2 || (words.length > 0 && hinglishCount / words.length >= 0.25)) {
    return 'hi';
  }

  return 'en';
}
