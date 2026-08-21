# AuraHealth AI

Real-time, turn-based voice health-screening demo built with React, Node.js, Express, and WebSockets. The agent conducts a basic intake in English or Hindi/Hinglish and generates a structured report when the call ends.

> This is a pre-consultation intake demo, not medical advice or an emergency service. For urgent symptoms, contact local emergency services or a licensed clinician.

## What it does

- Starts and ends a voice screening call over WebSockets.
- Captures each user turn with `MediaRecorder`, transcribes it, sends it to an LLM, and plays the generated response using TTS.
- Supports hands-free voice activity detection (VAD) and a hold-to-talk mode.
- Supports English, Hindi, and basic Hinglish detection.
- Keeps session transcript and extracted screening state.
- Handles silence, typed fallback messages, partial calls, and stale TTS audio after an interruption.
- Creates a structured health report with a transcript, triage summary, copy action, and PDF export.

## Architecture

```text
React client
  MediaRecorder / browser speech recognition / VAD
        | WebSocket turn messages
        v
Node.js server
  STT -> LLM conversation manager -> TTS
        |
        v
Structured health report
```

The interaction is intentionally turn-based: user speaks -> audio is processed -> the AI replies with audio. This keeps the implementation reliable for a take-home while still using real-time-oriented WebSocket transport.

## Requirements

- Node.js 18 or later
- npm 9 or later
- A modern Chromium-based browser for microphone access and optional browser speech-recognition fallback
- At least one STT provider key for reliable server-side voice transcription
- At least one LLM provider key for adaptive AI responses
- A TTS key is recommended; an internet-dependent Google Translate TTS fallback is available

## Setup

Install all dependencies from the project root:

```bash
npm run install:all
```

Create a local environment file by copying the root template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then add the API keys you intend to use to `.env`. Do not commit this file.

Start the app:

```bash
npm run dev
```

Open `http://localhost:5173`. The Node/WebSocket server runs on `http://localhost:5000` and `ws://localhost:5000/ws`.

For a separately hosted backend, set the client build variable before building:

```env
VITE_WS_URL=wss://your-api-domain.example/ws
```

Build the client for production:

```bash
npm run build
```

## API keys and provider configuration

Only add keys for providers you use. The server chooses configured providers automatically unless overridden.

| Purpose | Recommended key | Environment variable | Notes |
| --- | --- | --- | --- |
| Speech-to-text and LLM | Groq | `GROQ_API_KEY` | Recommended single-key path. Uses Groq Whisper for STT and the configured Groq model for conversation/report generation. |
| Speech-to-text, LLM, and TTS | OpenAI | `OPENAI_API_KEY` | Can provide Whisper STT, GPT conversation/report generation, and OpenAI TTS. |
| Hindi/Hinglish STT and TTS | Sarvam | `SARVAM_API_KEY` | Recommended for Indian-language speech. Sarvam TTS is preferred for Hindi responses. |
| Optional model override | - | `GROQ_MODEL`, `OPENAI_MODEL` | Defaults are defined in `.env.example`. |
| Optional voice override | - | `OPENAI_VOICE`, `SARVAM_VOICE` | Select a provider-supported voice. |

### Recommended minimal configuration

For the most reliable English demo, paste a valid Groq key into `.env`:

```env
GROQ_API_KEY=gsk_your_groq_key_here
```

For a Hindi/Hinglish demo, add Sarvam as well:

```env
GROQ_API_KEY=gsk_your_groq_key_here
SARVAM_API_KEY=your_sarvam_key_here
```

For an OpenAI-only configuration:

```env
OPENAI_API_KEY=sk-your_openai_key_here
```

Never paste API keys into the README, frontend code, or a public GitHub repository. Keep them only in the ignored `.env` file.

### Provider overrides

Normally, leave these blank:

```env
STT_PROVIDER=
LLM_PROVIDER=
TTS_PROVIDER=
```

To force a configured provider, set one of:

```env
STT_PROVIDER=groq
LLM_PROVIDER=groq
TTS_PROVIDER=sarvam
```

Supported values are `groq`, `openai`, `sarvam` where applicable, and `mock` for the deterministic LLM demo flow.

### No-LLM-key demo mode

If no LLM key is configured, the app uses a deterministic, stateful intake sequence that advances through the screening fields. For microphone transcription, configure Groq, OpenAI, or Sarvam. In supported browsers, browser speech recognition can provide live text as a fallback.

## Call flow

1. Select language mode and either Hands-Free or Push to Talk.
2. Select **Start Voice Screening Call** and grant microphone permission.
3. Answer the agent's questions one turn at a time.
4. Use **Hold to Talk** in push-to-talk mode, or pause after speaking in hands-free mode.
5. Use the text input if transcription is unclear.
6. Select **End Call** to generate the structured health report.

## Failure handling

| Scenario | Behavior |
| --- | --- |
| Silence or unusable audio | The agent asks the user to repeat the turn without clearing intake state. |
| Provider failure | STT tries other configured providers. TTS falls back to Google Translate TTS when internet access is available. |
| User interrupts response | Client playback stops immediately; a late TTS result is discarded instead of being played. |
| Short call | A minimal/partial report is created without inventing missing information. |
| No microphone | The call still opens in text-only mode; use the Type response option to continue. |

## Project structure

```text
client/                 React + Vite frontend
  src/hooks/useVoiceCall.js       WebSocket, recording, playback, and call state
  src/components/                 Call interface and report UI
server/                 Express + WebSocket backend
  src/websocket/callHandler.js    Per-session turn coordinator
  src/services/stt/               Groq, OpenAI, and Sarvam transcription
  src/services/llm/               Conversation state and report generation
  src/services/tts/               OpenAI, Sarvam, and Google fallback synthesis
.env.example            Environment-variable template
```

## Limitations and next steps

- This is a turn-based WebSocket voice experience, not full-duplex WebRTC.
- TTS fallback depends on external internet access.
- The screening is not a diagnosis and should not be used for emergency triage.
- Production work would add authenticated sessions, encrypted data storage, deterministic emergency escalation, robust medical safety review, and WebRTC media transport.

## Tech stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, `ws`
- AI providers: Groq, OpenAI, Sarvam; Google Translate TTS fallback
