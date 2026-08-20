# 🩺 AuraHealth AI — Conversational Voice Health Screening & Intake

> **Real-time, bilingual Voice-AI health screening agent built with JavaScript, React, and Node.js.**  
> Conducts an adaptive clinical intake conversation, detects language seamlessly (English / Hindi / Hinglish), handles speech barge-in (interruptions), and synthesizes a structured doctor-ready clinical report with automated triage risk scoring.

---

## 📄 Architecture & Workflow PDF Document
A complete **multi-page Architectural & Workflow Specification PDF** has been generated and included in this repository:
- **Root Location:** [`HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf`](./HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf)
- **Docs Location:** [`docs/HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf`](./docs/HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf)
- **Regenerate Anytime:** `npm run generate-pdf`

---

## 🌟 Key Features

### 1. 🎙️ The Live Voice Call
- **Real-Time WebSocket Streaming:** Bi-directional binary and Base64 audio streaming over `ws://localhost:5000/ws` — no monolithic batch uploads.
- **Adaptive Clinical Turn-Taking:** The AI greets the patient, asks **one screening question at a time** (Name → Chief Complaint → Onset & Duration → Severity 1-10 → Associated Symptoms → Medical History & Allergies), clarifies vague responses, and maintains context across turns.
- **Bilingual & Language Switching:** Operates in **English** and **Hindi (हिन्दी / Hinglish)** with real-time language detection and mid-conversation language switching.
- **Push-to-Talk & Hands-Free VAD Modes:** Users can either hold the microphone button / keyboard <kbd>Spacebar</kbd>, or use automatic voice activity detection (VAD) with silence threshold detection.
- **Barge-In (Interruption Handling):** If the user begins speaking while the AI is talking, active audio playback is stopped instantly and the server aborts pending speech synthesis.

### 2. ⚡ The Low-Latency Speech Pipeline
- **Speech-to-Text (STT):** Pluggable providers: **Groq Whisper** (`whisper-large-v3`, ~150ms latency), **OpenAI Whisper** (`whisper-1`), **Sarvam AI Saarika** (`saarika:v2` for Indian languages), and intelligent fallback STT.
- **Language Model (LLM):** **Groq Llama 3.3 70B Versatile** or **OpenAI GPT-4o-mini** with clinical voice intake prompt constraints (<30 words/turn, empathetic acknowledgement, hidden JSON entity extraction).
- **Text-to-Speech (TTS):** **OpenAI Neural TTS** (`nova`/`alloy`), **Sarvam AI Bulbul** (`ananya` Hindi voice), and **Google TTS Engine** (built-in free zero-key streaming fallback).

### 3. 📋 Structured Clinical Health Report
- **Physician-Ready Synthesis:** Translates spoken informal dialogue into formal medical terminology (e.g. *"head feels pounding"* → *"Acute throbbing cephalalgia"*).
- **Automated Triage Risk Level:** Evaluates patient symptoms into **LOW**, **MODERATE**, **HIGH**, or **EMERGENCY** with urgency level and clinical rationale.
- **Graceful Incomplete Call Handling:** If a call is terminated after 1-2 turns, the system marks the report status as `partial` or `minimal` without crashing or displaying garbage data.
- **Export Capabilities:** One-click **PDF Download** (using `jsPDF`), **Copy Clinical Summary**, and full audited conversation transcript inspection.

---

## 🏛️ System Architecture

```
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
```

---

## 📁 Source Code Structure (`src`)

```
D:\Tech Assessment 02
├── client/                               # Frontend: React + Vite + TailwindCSS (Pure JavaScript)
│   ├── index.html                        # HTML entry point
│   ├── package.json                      # React, Tailwind, Lucide-React, jsPDF
│   ├── vite.config.js                    # Vite bundler with API and WebSocket proxies
│   ├── tailwind.config.js                # Custom medical theme colors & animations
│   ├── src/
│   │   ├── main.jsx                      # React root entry
│   │   ├── App.jsx                       # Master view coordinator (PreCall -> Call -> Report)
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Header, WS connection badge, language selector
│   │   │   ├── PreCallScreen.jsx         # Landing screen, mode toggle (PTT / VAD), disclaimer
│   │   │   ├── CallInterface.jsx         # Active call room, visualizer orb, spacebar listener
│   │   │   ├── AudioOrb.jsx              # Central glowing visualizer & Web Audio canvas
│   │   │   ├── LiveClinicalState.jsx     # Live real-time extracted clinical entities side card
│   │   │   ├── LiveTranscript.jsx        # Full turn-by-turn chat transcript with timestamps
│   │   │   ├── HealthReport.jsx          # Doctor-ready triage summary, vitals, SBAR note, PDF export
│   │   │   └── SettingsModal.jsx         # Telemetry modal showing active STT/LLM/TTS providers
│   │   ├── hooks/
│   │   │   ├── useVoiceCall.js           # Core hook: WebSockets, MediaRecorder, Audio queue
│   │   │   ├── useAudioVisualizer.js     # Web Audio API AnalyserNode & canvas renderer
│   │   │   └── useVAD.js                 # RMS energy-based voice activity detector
│   │   ├── utils/
│   │   │   └── pdfExport.js              # Client-side jsPDF medical summary generator
│   │   └── styles/
│   │       └── index.css                 # Glassmorphic classes, custom scrollbars, animations
│
├── server/                               # Backend: Node.js + Express + WebSockets (Pure JavaScript)
│   ├── package.json                      # Express, ws, openai, groq-sdk, axios, form-data
│   ├── .env.example                      # Environment variables template
│   └── src/
│       ├── server.js                     # Express HTTP + WebSocket server & REST endpoints
│       ├── config.js                     # Provider auto-detection, models, voices, environment
│       ├── websocket/
│       │   └── callHandler.js            # WS session manager, audio streaming, barge-in, turns
│       ├── services/
│       │   ├── stt/                      # Speech-To-Text Subsystem
│       │   │   ├── index.js              # Unified STT router with multi-provider fallback
│       │   │   ├── groqWhisper.js        # Ultra-fast Groq Whisper-large-v3
│       │   │   ├── openaiWhisper.js      # OpenAI Whisper transcription
│       │   │   ├── sarvamSTT.js          # Sarvam AI Saarika Hindi STT
│       │   │   └── mockSTT.js            # Intelligent fallback for zero-key developer testing
│       │   ├── llm/                      # Language Model & Clinical Intelligence
│       │   │   ├── prompts.js            # Voice-first clinical intake system prompt & guidelines
│       │   │   ├── conversationalAgent.js# Adaptive multi-turn dialogue manager & state extractor
│       │   │   ├── reportGenerator.js    # Post-call Clinical Summary & Triage Engine (SBAR)
│       │   │   └── languageDetector.js   # Devanagari Hindi & Roman Hinglish detector
│       │   └── tts/                      # Text-To-Speech Subsystem
│       │       ├── index.js              # Unified TTS router & Base64 encoder
│       │       ├── openaiTTS.js          # OpenAI Nova/Alloy neural voice
│       │       ├── sarvamTTS.js          # Sarvam AI Bulbul Hindi voice
│       │       └── googleTTS.js          # Google TTS engine (zero-key streaming fallback)
│       └── utils/
│           ├── audioUtils.js             # Buffer conversions, AudioBufferManager, Base64 helpers
│           └── logger.js                 # Formatted color console logger
│
├── docs/                                 # Documentation & PDF Generator
│   ├── generate-pdf.js                   # High-res PDF generation engine using PDFKit
│   └── HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x tested and recommended)
- **npm**: v9.0.0 or higher

### 1. Install Dependencies
Run the unified installer from the project root:
```bash
npm run install:all
```
*(Or run `npm install` inside root, `server/`, and `client/` directories).*

---

### 2. Configure Environment Variables (Optional)
Copy `.env.example` in `server/` to `server/.env`:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your API keys:
```env
PORT=5000

# Recommended for ultra-fast STT & LLM (~150ms)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Alternative STT, LLM & TTS
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_VOICE=nova

# Indian Languages Hindi/Hinglish STT & TTS
SARVAM_API_KEY=...
SARVAM_VOICE=ananya

# Default Language Mode (auto, en, hi)
DEFAULT_LANGUAGE=auto
```

> **💡 Zero-Key Demonstration Mode:** If no API keys are provided in `.env`, the server automatically activates its **Intelligent Zero-Key Fallback Mode** (Google TTS streaming + simulated clinical dialogue engine), allowing full functionality testing out of the box!

---

### 3. Run Development Server
Start both the Node.js backend (`:5000`) and Vite React frontend (`:5173`) concurrently:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

---

### 4. Build for Production
To compile and bundle both the backend and client:
```bash
npm run build
```

---

## 🛡️ Failure Handling & Edge Case Matrix

| Scenario | System Detection | Recovery Strategy |
| :--- | :--- | :--- |
| **Silence / Background Noise** | Audio buffer < 400 bytes or empty transcript | AI gives polite verbal prompt: *"I didn't quite catch that. Could you please repeat?"* without losing stage context. |
| **Barge-In (Interruption)** | User speaks while AI audio is playing | Client immediately halts HTML5 audio, purges playback queue, and sends `barge_in` event to abort server synthesis. |
| **Mid-Call Language Switch** | User switches between English and Hindi/Hinglish | Language detector identifies script or phonetic keywords, adapts `activeLanguage`, and responds in the new language. |
| **Short / Incomplete Call** | User ends call after only 1 exchange | Report generator marks status as `partial` or `minimal`, avoids hallucinations, and summarizes only stated parameters. |
| **API Provider Outage** | Rate limit or timeout on primary provider | Automatic fallback chain: Groq → OpenAI → Google TTS / Mock fallback. |
| **Microphone Restricted** | Browser permission blocked | UI displays notification banner + activates interactive text fallback drawer. |

---

## 🩺 Clinical Triage Report Output Schema

When a call completes, the system generates a structured JSON summary conforming to this clinical schema:

```json
{
  "completionStatus": "complete",
  "completionPercentage": 95,
  "patientInfo": {
    "name": "Rahul Sharma",
    "estimatedAge": "Adult",
    "preferredLanguage": "English",
    "conversationLanguage": "English"
  },
  "chiefComplaint": {
    "primarySymptom": "Acute throbbing headache and mild fever",
    "patientDescription": "Bad headache and fever since yesterday",
    "anatomicalRegion": "Cranial / Temporal"
  },
  "historyOfPresentIllness": {
    "onsetAndDuration": "24 hours (since yesterday)",
    "severityScore": 6,
    "severityClassification": "Moderate",
    "symptomCharacteristics": "Throbbing sensation in temples with mild nausea and photophobia",
    "relievingFactors": "Paracetamol provided partial relief"
  },
  "associatedSymptoms": ["Mild fever", "Nausea", "Light sensitivity"],
  "medicalBackground": {
    "knownConditions": ["None reported"],
    "currentMedications": ["Paracetamol OTC"],
    "knownAllergies": ["No known drug allergies (NKDA)"]
  },
  "triageAssessment": {
    "riskLevel": "MODERATE",
    "recommendedUrgency": "Next Day Clinic",
    "clinicalRationale": "Patient reports acute headache with systemic symptoms (fever, photophobia). Stable vital presentation but requires in-person clinical exam to exclude secondary headache etiologies.",
    "identifiedRedFlags": []
  },
  "recommendedActionItems": [
    "Schedule physician consultation within 24-48 hours.",
    "Maintain adequate oral hydration and rest in a dim environment.",
    "Seek immediate emergency care if neck stiffness, high fever (>103°F), or neurological deficits develop."
  ],
  "doctorClinicalNote": "SBAR Summary: Patient Rahul Sharma presents for pre-consultation voice triage reporting a 24-hour history of moderate throbbing headache (6/10) with low-grade fever and photophobia. Relieved partially by OTC analgesics. No reported prior comorbidities. Triage level: Moderate. Scheduled for physician evaluation."
}
```

---

## 🧪 Submission Evaluation Checklist

- [x] **The Call Works:** Real-time bi-directional voice interaction over WebSockets with live visualizer orb.
- [x] **Tech Stack:** 100% JavaScript (React + Vite frontend, Node.js backend).
- [x] **Pipeline Architecture:** Modular STT (Groq Whisper / OpenAI Whisper / Sarvam) → LLM (Llama 3.3 / GPT-4o-mini) → TTS (OpenAI / Sarvam / Google).
- [x] **Conversation State:** Tracks patient name, chief complaint, duration, severity, and associated symptoms across multi-turn exchanges.
- [x] **Bilingual Support:** Full English & Hindi / Hinglish voice dialogue with real-time auto-detection.
- [x] **Barge-In Handling:** Instant speech interruption.
- [x] **Structured Health Report:** Doctor-ready triage synthesis with SBAR note, PDF export, and graceful handling of short calls.
- [x] **Comprehensive PDF:** Architectural and workflow PDF documentation generated (`HEALTH_VOICE_AI_ARCHITECTURE_AND_WORKFLOW.pdf`).

---

## 📜 License
MIT License. Created for the Technical Assessment.
