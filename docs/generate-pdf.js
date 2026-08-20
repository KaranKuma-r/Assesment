import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Ensure docs directory exists
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs', { recursive: true });
}

const outputPath = path.resolve('HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf');
const docsOutputPath = path.resolve('docs', 'HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Primary Palette
const PRIMARY = '#0f766e'; // teal-700
const ACCENT = '#14b8a6';  // teal-500
const DARK = '#0f172a';    // navy-900
const MUTED = '#475569';   // slate-600
const LIGHT_BG = '#f8fafc';// slate-50
const BORDER_COLOR = '#cbd5e1';

function drawHeader(title, subtitle) {
  doc.rect(45, doc.y, 505, 3).fill(ACCENT);
  doc.moveDown(0.3);
  doc.fillColor(DARK).fontSize(18).font('Helvetica-Bold').text(title);
  if (subtitle) {
    doc.fillColor(MUTED).fontSize(10).font('Helvetica').text(subtitle);
  }
  doc.moveDown(0.8);
}

function drawSection(title) {
  doc.moveDown(0.6);
  doc.rect(45, doc.y, 4, 14).fill(PRIMARY);
  doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold').text(`   ${title}`);
  doc.moveDown(0.4);
}

function drawSubSection(title) {
  doc.moveDown(0.3);
  doc.fillColor(DARK).fontSize(10.5).font('Helvetica-Bold').text(title);
  doc.moveDown(0.2);
}

function drawParagraph(text) {
  doc.fillColor(MUTED).fontSize(9.2).font('Helvetica').text(text, { align: 'justify', lineGap: 2.5 });
  doc.moveDown(0.4);
}

function drawBullet(title, text) {
  doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(`• ${title}: `, { continued: true });
  doc.fillColor(MUTED).font('Helvetica').text(text, { lineGap: 2 });
  doc.moveDown(0.25);
}

function drawCodeBlock(codeText) {
  const currentY = doc.y;
  const lines = codeText.split('\n');
  const height = lines.length * 10 + 12;

  // Check if fits on page
  if (doc.y + height > 750) {
    doc.addPage();
  }

  doc.rect(45, doc.y, 505, height).fillAndStroke('#0f172a', '#334155');
  doc.fillColor('#38bdf8').fontSize(7.8).font('Courier').text(codeText, 52, doc.y + 6, {
    width: 490,
    lineGap: 1.5,
  });
  doc.y = currentY + height + 6;
  doc.moveDown(0.4);
}

// ================= PAGE 1: COVER & EXECUTIVE SUMMARY =================
drawHeader(
  'AuraHealth AI — System Architecture & Workflow Specification',
  'Conversational Voice-First Health Screening Intake Agent with Structured Clinical Summaries'
);

drawSection('1. Executive Summary & Problem Scope');
drawParagraph(
  'AuraHealth AI is a production-grade conversational Voice-AI health screening application built completely in JavaScript (React frontend + Node.js backend). The platform enables patients to have an adaptive, real-time voice conversation with a clinical AI intake agent. The AI collects essential screening parameters (identity, chief complaint, symptom onset/duration, pain severity on 1-10 scale, associated symptoms, medical history, and allergies), responds empathetically in spoken audio, and automatically synthesizes a doctor-ready Structured Clinical Health Report with automated triage risk classification (Low, Moderate, High, Emergency) upon call completion.'
);

drawSubSection('Core Engineering Pillars:');
drawBullet('Full-Duplex Real-Time Transport', 'WebSockets (ws) streaming binary and Base64 audio chunks bidirectionally, avoiding monolithic batch file uploads.');
drawBullet('Bilingual Speech Engine', 'Native support for English and Hindi with automatic language detection, phonetic Hinglish transliteration understanding, and mid-call language switching.');
drawBullet('Adaptive Multi-Turn State Management', 'Dialogue manager tracks clinical stages, asks single targeted questions, clarifies vague answers, and preserves conversational context across turns.');
drawBullet('Low-Latency Speech Pipeline', 'Pluggable STT (Groq Whisper ~150ms / OpenAI Whisper / Sarvam Saarika) -> LLM (Llama 3.3 70B / GPT-4o-mini) -> TTS (OpenAI / Sarvam Bulbul / Google streaming fallback).');
drawBullet('Graceful Fallback & Resilience', 'Zero-key simulation mode, silent/inaudible audio recovery prompts, barge-in speech interruption, and graceful short-call summary handling.');

drawSection('2. High-Level System Architecture Diagram');
const archDiagram = `
 +---------------------------------------------------------------------------------------+
 |                                  CLIENT LAYER (React + Vite)                          |
 |  +--------------------+  +----------------------+  +-------------------------------+  |
 |  |  PreCallScreen     |  |  Live CallInterface  |  |  Structured HealthReport      |  |
 |  |  (Config & CTA)    |  |  (Audio Orb & State) |  |  (Triage & PDF Export)        |  |
 |  +--------------------+  +----------------------+  +-------------------------------+  |
 |        |                             |                                 ^              |
 |        v                             v                                 |              |
 |  +---------------------------------------------------------------------------------+  |
 |  | useVoiceCall Hook: MediaRecorder -> Web Audio Analyser -> WebSocket Client (ws) |  |
 +---------------------------------------------------------------------------------------+
                                        |  WebSocket Stream (ws://localhost:5000/ws)
                                        v
 +---------------------------------------------------------------------------------------+
 |                                 BACKEND LAYER (Node.js Server)                        |
 |  +---------------------------------------------------------------------------------+  |
 |  | callHandler.js: Session Manager, AudioBufferManager, Turn Coordinator, Barge-In |  |
 |  +---------------------------------------------------------------------------------+  |
 |        |                              |                                |              |
 |        v                              v                                v              |
 |  +--------------------+    +----------------------+    +---------------------------+  |
 |  |  STT Pipeline      |    |  LLM Dialog & State  |    |  TTS Pipeline             |  |
 |  |  - Groq Whisper    | -> |  - Llama 3.3 70B     | -> |  - OpenAI TTS (Nova)      |  |
 |  |  - OpenAI Whisper  |    |  - GPT-4o-mini       |    |  - Sarvam Bulbul (Hindi)  |  |
 |  |  - Sarvam Saarika  |    |  - State Extractor   |    |  - Google TTS (Zero-Key)  |  |
 |  +--------------------+    +----------------------+    +---------------------------+  |
 |                                       | (On Call End)                                 |
 |                                       v                                               |
 |                    +--------------------------------------+                           |
 |                    | reportGenerator.js: Clinical SBAR    |                           |
 |                    | Triage Engine (Low/Mod/High/Emerg)   |                           |
 |                    +--------------------------------------+                           |
 +---------------------------------------------------------------------------------------+
`;
drawCodeBlock(archDiagram);

// ================= PAGE 2: SOURCE STRUCTURE =================
doc.addPage();
drawHeader('Complete Source Code Structure', 'Clean Separation of Concerns across Client and Server');

drawSection('3. Project Directory Tree');
const srcTree = `
D:\\Tech Assessment 02
├── client/                               # Frontend: React + Vite + TailwindCSS (JavaScript)
│   ├── index.html                        # HTML entry point with Plus Jakarta Sans & JetBrains fonts
│   ├── package.json                      # React, Tailwind, Lucide-React, jsPDF dependencies
│   ├── vite.config.js                    # Vite bundler config with API/WS proxies
│   ├── tailwind.config.js                # Custom medical theme colors & pulse animations
│   ├── src/
│   │   ├── main.jsx                      # React 18 root mounting
│   │   ├── App.jsx                       # Master screen router & state coordinator
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Header brand, connection status pill, language dropdown
│   │   │   ├── PreCallScreen.jsx         # Landing screen, mode selector (Push-to-Talk / VAD), disclaimer
│   │   │   ├── CallInterface.jsx         # Live call room, spacebar listener, barge-in, text fallback
│   │   │   ├── AudioOrb.jsx              # Central glowing visualizer orb, canvas frequency visualizer
│   │   │   ├── LiveClinicalState.jsx     # Live real-time extracted clinical entities side card
│   │   │   ├── LiveTranscript.jsx        # Full turn-by-turn chat transcript with timestamps
│   │   │   ├── HealthReport.jsx          # Doctor-ready triage summary, vitals, SBAR note, copy & PDF
│   │   │   └── SettingsModal.jsx         # Telemetry modal for active STT/LLM/TTS providers
│   │   ├── hooks/
│   │   │   ├── useVoiceCall.js           # Core hook: WebSockets, MediaRecorder, Audio playback queue
│   │   │   ├── useAudioVisualizer.js     # Web Audio API AnalyserNode & canvas renderer
│   │   │   └── useVAD.js                 # RMS energy-based voice activity detector for hands-free mode
│   │   ├── utils/
│   │   │   └── pdfExport.js              # Client-side jsPDF medical summary generator
│   │   └── styles/
│   │       └── index.css                 # Tailwind directives, glassmorphic card classes, animations
│
├── server/                               # Backend: Node.js + Express + WebSockets (JavaScript)
│   ├── package.json                      # Express, ws, openai, groq-sdk, axios, form-data
│   ├── .env.example                      # Environment variable templates
│   └── src/
│       ├── server.js                     # Express HTTP + WebSocket server setup & REST endpoints
│       ├── config.js                     # Provider auto-detection, models, voices, environment keys
│       ├── websocket/
│       │   └── callHandler.js            # WebSocket session manager, audio streaming, barge-in, turns
│       ├── services/
│       │   ├── stt/                      # Speech-To-Text Subsystem
│       │   │   ├── index.js              # Unified STT router with multi-provider fallback
│       │   │   ├── groqWhisper.js        # Ultra-low latency Groq Whisper-large-v3
│       │   │   ├── openaiWhisper.js      # OpenAI Whisper-1 transcription
│       │   │   ├── sarvamSTT.js          # Sarvam AI Saarika Hindi STT
│       │   │   └── mockSTT.js            # Intelligent clinical fallback for zero-key developer testing
│       │   ├── llm/                      # Language Model & Clinical Intelligence
│       │   │   ├── prompts.js            # Voice-first clinical intake system prompt & guidelines
│       │   │   ├── conversationalAgent.js# Adaptive multi-turn dialogue manager & state extractor
│       │   │   ├── reportGenerator.js    # Post-call Clinical Summary & Triage Engine (SBAR)
│       │   │   └── languageDetector.js   # Devanagari Hindi & Roman Hinglish detector
│       │   └── tts/                      # Text-To-Speech Subsystem
│       │       ├── index.js              # Unified TTS router & Base64 encoder
│       │       ├── openaiTTS.js          # OpenAI Nova/Alloy neural voice
│       │       ├── sarvamTTS.js          # Sarvam AI Bulbul Hindi voice
│       │       └── googleTTS.js          # Google TTS engine (zero-key high fidelity fallback)
│       └── utils/
│           ├── audioUtils.js             # Buffer conversions, AudioBufferManager, Base64 helpers
│           └── logger.js                 # Formatted color console logger
│
├── docs/                                 # Documentation & Architecture Assets
│   └── generate-pdf.js                   # High-resolution PDF generation engine
└── README.md                             # Comprehensive project documentation & evaluation guide
`;
drawCodeBlock(srcTree);

// ================= PAGE 3: WORKFLOW EXPLANATION =================
doc.addPage();
drawHeader('End-to-End Workflow & Pipeline Execution', 'Step-by-Step Trajectory from "Start Call" to Clinical Report');

drawSection('4. Detailed Step-by-Step Workflow');

drawSubSection('Step 1: Session Initialization & Greeting');
drawParagraph(
  'When the user clicks "Start Health Screening Call", the client requests microphone permissions and initiates a WebSocket connection (ws://localhost:5000/ws). Upon connection ACK, the server triggers the callHandler, instantiates a session state object, generates an empathetic bilingual greeting (English or Hindi based on languageMode), synthesizes the greeting audio via TTS, and streams it to the client. The client AudioOrb illuminates with teal pulse rings as the AI introduces itself.'
);

drawSubSection('Step 2: User Speech Ingest & Voice Activity');
drawParagraph(
  'The user speaks either via Push-to-Talk (holding the ergonomic button or keyboard Spacebar) or via Hands-Free VAD (where RMS energy detection detects speech onset). Audio chunks are captured in 250ms increments via MediaRecorder (audio/webm;codecs=opus) and transmitted over the WebSocket. The client canvas visualizer dynamically mirrors the audio waveform.'
);

drawSubSection('Step 3: Speech-to-Text (STT) Processing & Silence Handling');
drawParagraph(
  'When the user finishes speaking, the client emits an "audio_turn_end" event. The server AudioBufferManager concatenates the chunks and dispatches them to the STT router. If the audio is silent or below threshold (<400 bytes), the system responds with a gentle clarification prompt ("I didn\'t quite catch that. Could you please repeat?"). If speech is present, Groq Whisper / OpenAI Whisper / Sarvam Saarika transcribes the speech with high accuracy.'
);

drawSubSection('Step 4: Language Detection & Bilingual Switching');
drawParagraph(
  'The languageDetector inspects the transcribed text for Devanagari characters or Romanized Hinglish vocabulary (e.g. "sir dard", "bukhar", "takleef"). If the user switches from English to Hindi or vice versa, the session activeLanguage seamlessly adapts, ensuring the AI responds in the patient\'s chosen tongue.'
);

drawSubSection('Step 5: Conversational LLM Turn & State Extraction');
drawParagraph(
  'The conversationalAgent formats the conversation history and passes it to the LLM (Llama 3.3 70B or GPT-4o-mini). The prompt enforces strict voice guidelines: 1-2 concise sentences (<30 words), asking exactly ONE question at a time, acknowledging discomfort with clinical empathy, and probing for clarifications when answers are vague. A hidden JSON metadata block extracts clinical entities (e.g. patientName, mainConcern, duration, severity, associatedSymptoms) and broadcasts a "state_update" to populate the UI in real time.'
);

drawSubSection('Step 6: Text-to-Speech (TTS) Synthesis & Streaming');
drawParagraph(
  'The spoken response text is synthesized by the TTS engine (OpenAI Nova, Sarvam Bulbul, or Google streaming) into MP3 audio and pushed back over the WebSocket. The client queues and plays the audio while pulsing the visualizer orb.'
);

drawSubSection('Step 7: Real-Time Barge-In (Interruption Handling)');
drawParagraph(
  'If the user starts speaking while the AI is talking, a "barge_in" event is emitted. The client immediately pauses active HTML5 audio playback, clears the audio queue, and notifies the server to abort pending TTS streams, creating a natural, fluid conversation.'
);

drawSubSection('Step 8: Call Termination & Graceful Clinical Report Synthesis');
drawParagraph(
  'When the user clicks "End Call" (or the AI reaches natural wrap-up), the server dispatches a "report_generating" event. The reportGenerator analyzes the full transcript and extracted entities, translating informal dialogue into medical terms, calculating a triage risk level (Low, Moderate, High, Emergency), formulating physician SBAR clinical notes, and listing actionable doctor recommendations. Short or incomplete calls are handled gracefully without crashing, correctly marking the completion status as "partial" or "minimal".'
);

// ================= PAGE 4: PIPELINE MATRIX & RESILIENCE =================
doc.addPage();
drawHeader('Pipeline Architecture & Failure Resilience Matrix', 'Multi-Provider Redundancy and Error Recovery Mechanisms');

drawSection('5. Multi-Provider AI Pipeline Matrix');

drawSubSection('Speech-To-Text (STT) Layer:');
drawBullet('Groq Whisper (whisper-large-v3)', 'Primary ultra-fast STT providing sub-200ms turnaround for seamless real-time turn-taking.');
drawBullet('OpenAI Whisper (whisper-1)', 'High-accuracy fallback supporting over 90 languages.');
drawBullet('Sarvam AI Saarika (saarika:v2)', 'Specialized Indian language STT tailored for Hindi and regional dialects.');
drawBullet('Zero-Key Mock STT', 'Intelligent simulated clinical dialogue turns for instant developer verification without requiring external API keys.');

drawSubSection('Large Language Model (LLM) Layer:');
drawBullet('Groq Llama 3.3 70B Versatile', 'Ultra-low-latency reasoning model for adaptive clinical dialogue and state extraction.');
drawBullet('OpenAI GPT-4o-mini', 'High-accuracy conversational intake and structured JSON clinical report generation.');

drawSubSection('Text-To-Speech (TTS) Layer:');
drawBullet('OpenAI TTS (tts-1 / Nova)', 'Natural conversational prosody with clear medical delivery.');
drawBullet('Sarvam AI Bulbul (bulbul:v1 / Ananya)', 'Authentic Indian English and Hindi voice synthesis.');
drawBullet('Google TTS Engine', 'Free, zero-key streaming TTS fallback ensuring audio always plays on any environment.');

drawSection('6. Edge Case & Failure Resilience Matrix');

const resilienceTable = `
 +-----------------------+----------------------------------+------------------------------------+
 | Failure / Edge Case   | System Behavior                  | Recovery Strategy                  |
 +-----------------------+----------------------------------+------------------------------------+
 | Silence / Inaudible   | Empty audio buffer detected      | Polite verbal re-prompt; no state  |
 | background noise      | (<400 bytes)                     | corruption; preserves turn order   |
 +-----------------------+----------------------------------+------------------------------------+
 | External API Outage   | Network or rate limit exception  | Auto-fallback chain: Groq ->       |
 | (STT / LLM / TTS)     | caught in service layer          | OpenAI -> Google / Mock fallback   |
 +-----------------------+----------------------------------+------------------------------------+
 | User Barge-In         | User speaks while AI audio is    | Client pauses Audio element; clears|
 | (Interruption)        | actively playing                 | queue; server resets stream flag   |
 +-----------------------+----------------------------------+------------------------------------+
 | Language Switch       | User speaks Hindi mid-call       | Regex & Hinglish keyword detector  |
 | Mid-Conversation      | after starting in English        | updates activeLanguage instantly   |
 +-----------------------+----------------------------------+------------------------------------+
 | Short / Incomplete    | User disconnects or ends call    | Graceful synthesis: marks intake   |
 | Call (<2 turns)       | after only 1 exchange            | as "partial/minimal"; never crashes|
 +-----------------------+----------------------------------+------------------------------------+
 | Mic Permission Denied | Browser blocks microphone        | Clear UI error banner + full text  |
 |                       | access                           | fallback keyboard drawer available |
 +-----------------------+----------------------------------+------------------------------------+
`;
drawCodeBlock(resilienceTable);

drawSection('7. Quick Setup & Execution Guide');
drawBullet('1. Install Dependencies', 'Run "npm run install:all" (or "npm install" in root, server, and client).');
drawBullet('2. Configure Environment', 'Copy server/.env.example to server/.env and add GROQ_API_KEY or OPENAI_API_KEY (optional: zero-key mode works out of the box).');
drawBullet('3. Run Development Server', 'Run "npm run dev" to launch both Backend (:5000) and React Frontend (:5173).');
drawBullet('4. Generate PDF Report', 'Run "npm run generate-pdf" to rebuild this architectural documentation PDF.');

// Finalize Document
doc.end();

writeStream.on('finish', () => {
  // Also copy to docs directory
  fs.copyFileSync(outputPath, docsOutputPath);
  console.log(`✅ Architecture and Workflow PDF successfully generated at:\n   1. ${outputPath}\n   2. ${docsOutputPath}`);
});
