import http from 'http';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { WebSocketServer } from 'ws';
import { config, getEffectiveProviders } from './config.js';
import { setupWebSocket, sessionStore } from './websocket/callHandler.js';
import { transcribeAudio } from './services/stt/index.js';
import { synthesizeSpeech } from './services/tts/index.js';
import { logger } from './utils/logger.js';

const app = express();
const server = http.createServer(app);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeSessions: sessionStore.size,
  });
});

// 2. Configuration & Pipeline Status
app.get('/api/config', (req, res) => {
  const providers = getEffectiveProviders();
  res.json({
    providers,
    models: {
      groqModel: config.groqModel,
      openaiModel: config.openaiModel,
      openaiVoice: config.openaiVoice,
      sarvamVoice: config.sarvamVoice,
    },
    defaultLanguage: config.defaultLanguage,
    supportedLanguages: [
      { code: 'auto', label: 'Auto Detect (Hindi / English / Hinglish)' },
      { code: 'en', label: 'English (US / Global)' },
      { code: 'hi', label: 'Hindi (हिन्दी / Hinglish)' },
    ],
  });
});

// 3. Get Report by Session ID
app.get('/api/report/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionStore.get(sessionId);

  if (!session || !session.report) {
    return res.status(404).json({ error: 'Report not found for this session ID' });
  }

  res.json({ report: session.report });
});

// 4. Standalone STT Transcription Endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Audio file buffer is required' });
    }
    const languageHint = req.body.language || 'auto';
    const result = await transcribeAudio(req.file.buffer, languageHint);
    res.json(result);
  } catch (error) {
    logger.error('Transcribe endpoint error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 5. Standalone TTS Synthesis Endpoint
app.post('/api/synthesize', async (req, res) => {
  try {
    const { text, language = 'en', voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }
    const result = await synthesizeSpeech(text, language, voice);
    res.json({
      audioBase64: result.audioBase64,
      provider: result.provider,
      language: result.language,
    });
  } catch (error) {
    logger.error('Synthesize endpoint error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Initialize WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

server.listen(config.port, () => {
  const providers = getEffectiveProviders();
  logger.success(`🚀 AuraHealth AI Voice Server running on port http://localhost:${config.port}`);
  logger.info(`🔌 WebSocket Server endpoint active on ws://localhost:${config.port}/ws`);
  logger.info(`🎙️ STT Engine: [${providers.stt}] | 🧠 LLM Engine: [${providers.llm}] | 🔊 TTS Engine: [${providers.tts}]`);
  if (!providers.hasGroq && !providers.hasOpenAI && !providers.hasSarvam) {
    logger.warn('💡 No API keys detected in .env. Running in Zero-Key Smart Simulation & Fallback Mode.');
  }
});
