import { transcribeAudio } from '../services/stt/index.js';
import { processConversationTurn, getInitialGreeting } from '../services/llm/conversationalAgent.js';
import { generateHealthReport } from '../services/llm/reportGenerator.js';
import { synthesizeSpeech } from '../services/tts/index.js';
import { AudioBufferManager, base64ToBuffer } from '../utils/audioUtils.js';
import { logger } from '../utils/logger.js';

// In-memory store for session reports and active sessions
export const sessionStore = new Map();

function createInitialScreeningState(language = 'en') {
  return {
    patientName: '',
    mainConcern: '',
    duration: '',
    severity: '',
    symptomCharacter: '',
    associatedSymptoms: [],
    medicalHistory: [],
    allergies: [],
    medications: [],
    activeLanguage: language,
    stage: 'greeting',
    isComplete: false,
    turnCount: 0,
  };
}

export function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    const sessionId = `CALL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    logger.info(`WebSocket client connected. Assigned sessionId: [${sessionId}]`);

    const session = {
      sessionId,
      ws,
      startTime: Date.now(),
      languageMode: 'auto',
      activeLanguage: 'en',
      stage: 'greeting',
      turnCount: 0,
      transcript: [],
      state: createInitialScreeningState(),
      audioManager: new AudioBufferManager(),
      isProcessing: false,
      isAgentSpeaking: false,
      speechGenerationId: 0,
    };

    sessionStore.set(sessionId, session);

    // Send initial connection ACK
    sendWsMessage(ws, 'pong', { sessionId, message: 'Connected to AuraHealth Voice Server' });

    ws.on('message', async (data) => {
      try {
        let msg = null;

        // Check if raw binary audio chunk or JSON message
        if (Buffer.isBuffer(data) && !data.toString('utf-8').startsWith('{')) {
          session.audioManager.append(data);
          return;
        }

        try {
          msg = JSON.parse(data.toString('utf-8'));
        } catch (e) {
          // If binary audio was sent as binary string
          if (Buffer.isBuffer(data)) {
            session.audioManager.append(data);
            return;
          }
          throw e;
        }

        await handleClientMessage(session, msg);
      } catch (err) {
        logger.error(`Error processing WebSocket message for session [${sessionId}]:`, err.message);
        sendWsMessage(ws, 'error', { message: err.message });
      }
    });

    ws.on('close', async () => {
      logger.info(`WebSocket client disconnected for session: [${sessionId}]`);
      if (session.transcript.length > 0 && !session.report) {
        const durationSec = Math.round((Date.now() - session.startTime) / 1000);
        try {
          const report = await generateHealthReport({
            transcript: session.transcript,
            screeningState: session.state,
            durationSeconds: durationSec,
            sessionId: session.sessionId
          });
          session.report = report;
        } catch (e) {
          logger.error('Error auto-generating report on disconnect:', e.message);
        }
      }
    });

    ws.on('error', (err) => {
      logger.error(`WebSocket error in session [${sessionId}]:`, err.message);
    });
  });
}

function sendWsMessage(ws, type, payload = {}, sessionId = '') {
  if (ws && ws.readyState === 1) { // 1 = OPEN
    ws.send(JSON.stringify({ type, payload, sessionId }));
  }
}

// Browser speech recognition can occasionally hear speaker echo or background noise
// as a short acknowledgement (for example, "thank you"). Do not use those strings as
// a fallback user turn when server-side STT did not produce meaningful speech.
function isMeaningfulLiveText(text) {
  const normalized = (text || '').trim().toLowerCase().replace(/[.!?,]+$/g, '');
  if (!normalized) return false;
  const acknowledgements = new Set([
    'thank you', 'thanks', 'thankyou', 'ok', 'okay', 'hmm', 'hm', 'yeah', 'yes',
    'haan', 'han', 'ji', 'theek hai', 'achha', 'accha', 'ठीक है', 'हाँ', 'हां', 'जी'
  ]);
  return !acknowledgements.has(normalized);
}

function isMeaningfulUserTurn(text) {
  const normalized = (text || '').trim().toLowerCase().replace(/[.!?,]+$/g, '');
  if (!normalized) return false;
  return !/^(?:thank you(?: for watching)?|thanks|thankyou|ok|okay|hmm|hm|yeah|yes|haan|han|ji|theek hai|achha|accha|ठीक है|हाँ|हां|जी)$/.test(normalized);
}

async function handleClientMessage(session, msg) {
  const { ws, sessionId } = session;
  const { type, payload } = msg;

  switch (type) {
    case 'start_call': {
      logger.info(`Starting call session [${sessionId}] with language mode: [${payload?.languageMode || 'auto'}]`);
      session.startTime = Date.now();
      session.languageMode = payload?.languageMode || 'auto';
      session.activeLanguage = session.languageMode === 'hi' ? 'hi' : 'en';
      session.transcript = [];
      session.audioManager.clear();
      session.state = createInitialScreeningState(session.activeLanguage);
      session.isProcessing = false;
      session.isAgentSpeaking = false;

      // Generate Greeting
      const greeting = getInitialGreeting(session.activeLanguage);
      const greetingMessage = {
        id: `msg-${Date.now()}-0`,
        role: 'assistant',
        content: greeting.spokenText,
        timestamp: Date.now(),
        language: greeting.language,
      };

      session.transcript.push(greetingMessage);
      session.state.stage = greeting.stage;
      session.state.activeLanguage = greeting.language;

      sendWsMessage(ws, 'call_started', {
        sessionId,
        language: session.activeLanguage,
        stage: session.state.stage,
      });

      sendWsMessage(ws, 'transcript_update', {
        message: greetingMessage,
        fullTranscript: session.transcript,
      });

      sendWsMessage(ws, 'state_update', { state: session.state });

      // Synthesize Greeting Audio
      sendWsMessage(ws, 'agent_speaking_start', { text: greeting.spokenText });
      session.isAgentSpeaking = true;
      const greetingSpeechId = ++session.speechGenerationId;

      try {
        const { audioBase64 } = await synthesizeSpeech(greeting.spokenText, greeting.language);
        if (audioBase64 && greetingSpeechId === session.speechGenerationId && session.isAgentSpeaking) {
          sendWsMessage(ws, 'audio_chunk', {
            audioBase64,
            mimeType: 'audio/mp3',
            messageId: greetingMessage.id
          });
        }
      } catch (ttsErr) {
        logger.error('Failed to synthesize greeting TTS:', ttsErr.message);
      } finally {
        if (greetingSpeechId === session.speechGenerationId) {
          sendWsMessage(ws, 'agent_speaking_end', {});
          session.isAgentSpeaking = false;
        }
      }
      break;
    }

    case 'audio_chunk': {
      // Audio chunk received in base64 payload
      if (payload?.audioBase64) {
        const buffer = base64ToBuffer(payload.audioBase64);
        session.audioManager.append(buffer);
      }
      break;
    }

    case 'barge_in': {
      logger.voice(`Barge-in received for session [${sessionId}]. Interrupting AI speech.`);
      session.isAgentSpeaking = false;
      session.speechGenerationId += 1;
      session.isProcessing = false;
      sendWsMessage(ws, 'agent_speaking_end', { interrupted: true });
      break;
    }

    case 'audio_turn_end': {
      if (session.isProcessing) {
        logger.warn('Turn processing already in progress. Ignoring duplicate turn.');
        return;
      }
      if (session.state.isComplete) {
        logger.info(`Ignoring audio after completed call [${sessionId}]`);
        sendWsMessage(ws, 'turn_ignored', { reason: 'call_complete' });
        return;
      }

      session.isProcessing = true;
      sendWsMessage(ws, 'agent_thinking', { status: 'transcribing' });

      try {
        // If complete turn audio was sent directly in payload, use it directly
        let audioBuffer = null;
        if (payload?.audioBase64) {
          const directBuffer = base64ToBuffer(payload.audioBase64);
          if (directBuffer && directBuffer.length > 0) {
            audioBuffer = directBuffer;
          }
        }

        if (!audioBuffer || audioBuffer.length === 0) {
          audioBuffer = session.audioManager.getCombinedBuffer();
        }
        session.audioManager.clear();

        const userTurnIndex = session.transcript.filter(m => m.role === 'user').length;
        
        // 1. Transcribe Audio via server STT
        const { text, language: detectedLang, isSilent } = await transcribeAudio(
          audioBuffer,
          session.languageMode,
          userTurnIndex
        );

        // Fallback to client-recognized liveText if audio STT produced empty or silence
        let finalUserText = '';
        if (text && isMeaningfulUserTurn(text)) {
          finalUserText = text.trim();
        } else if (isMeaningfulUserTurn(payload?.liveText)) {
          finalUserText = payload.liveText.trim();
          logger.info(`Using client-side speech recognition text: "${finalUserText}"`);
        }

        // Ignore acknowledgement-only audio instead of adding it to the clinical transcript.
        if (!finalUserText && ((text && text.trim()) || (payload?.liveText && payload.liveText.trim()))) {
          sendWsMessage(ws, 'turn_ignored', { reason: 'acknowledgement' });
          return;
        }

        let isFinalSilent = !finalUserText || isSilent;

        logger.voice(`Processed user speech: "${finalUserText}" (Detected lang: ${detectedLang || session.activeLanguage}, isSilent: ${isFinalSilent})`);

        if (detectedLang) {
          session.activeLanguage = detectedLang;
          session.state.activeLanguage = detectedLang;
        }

        // Send user transcript message
        if (finalUserText && finalUserText.length > 0) {
          const userMsg = {
            id: `msg-${Date.now()}-u`,
            role: 'user',
            content: finalUserText,
            timestamp: Date.now(),
            language: session.activeLanguage,
          };
          session.transcript.push(userMsg);
          sendWsMessage(ws, 'transcript_update', {
            message: userMsg,
            fullTranscript: session.transcript,
          });
        }

        sendWsMessage(ws, 'agent_thinking', { status: 'generating_response' });

        // 2. Generate Adaptive LLM Response
        const turnResult = await processConversationTurn({
          userText: finalUserText,
          transcript: session.transcript,
          currentState: session.state,
          isSilence: isFinalSilent,
          languageMode: session.languageMode,
        });

        const { spokenText, metadata, language: agentLang } = turnResult;

        // Merge extracted clinical entities into state
        if (metadata?.extracted) {
          session.state = {
            ...session.state,
            ...metadata.extracted,
            associatedSymptoms: Array.from(new Set([
              ...(session.state.associatedSymptoms || []),
              ...(metadata.extracted.associatedSymptoms || [])
            ])),
            medicalHistory: Array.from(new Set([
              ...(session.state.medicalHistory || []),
              ...(metadata.extracted.medicalHistory || [])
            ])),
            allergies: Array.from(new Set([
              ...(session.state.allergies || []),
              ...(metadata.extracted.allergies || [])
            ])),
          };
        }

        if (metadata?.stage) session.state.stage = metadata.stage;
        if (metadata?.isComplete) session.state.isComplete = true;
        session.state.turnCount = session.transcript.filter(m => m.role === 'user').length;

        // Assistant Message
        const assistantMsg = {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: spokenText,
          timestamp: Date.now(),
          language: agentLang || session.activeLanguage,
        };

        session.transcript.push(assistantMsg);

        sendWsMessage(ws, 'transcript_update', {
          message: assistantMsg,
          fullTranscript: session.transcript,
        });

        sendWsMessage(ws, 'state_update', { state: session.state });

        // 3. Synthesize Speech & Stream Audio
        sendWsMessage(ws, 'agent_speaking_start', { text: spokenText });
        session.isAgentSpeaking = true;
        const speechGenerationId = ++session.speechGenerationId;

        const { audioBase64 } = await synthesizeSpeech(spokenText, agentLang || session.activeLanguage);

        if (audioBase64 && speechGenerationId === session.speechGenerationId && session.isAgentSpeaking) {
          sendWsMessage(ws, 'audio_chunk', {
            audioBase64,
            mimeType: 'audio/mp3',
            messageId: assistantMsg.id
          });
        }

        if (speechGenerationId === session.speechGenerationId) {
          sendWsMessage(ws, 'agent_speaking_end', {});
          session.isAgentSpeaking = false;
        }

        // Mark intake as ready for completion when patient finishes questions
        if (session.state.isComplete) {
          logger.info(`Intake completed naturally for session [${sessionId}]. Awaiting user to click End Call.`);
        }
      } catch (err) {
        logger.error(`Error in conversation turn for [${sessionId}]:`, err.message);
        sendWsMessage(ws, 'error', { message: 'Sorry, I had a brief issue processing your response. Please speak again.' });
      } finally {
        session.isProcessing = false;
      }
      break;
    }

    case 'text_turn': {
      // Text fallback mode
      const userText = payload?.text || '';
      if (!isMeaningfulUserTurn(userText)) {
        sendWsMessage(ws, 'turn_ignored', { reason: 'acknowledgement' });
        return;
      }
      if (session.state.isComplete) {
        sendWsMessage(ws, 'turn_ignored', { reason: 'call_complete' });
        return;
      }

      session.isProcessing = true;
      sendWsMessage(ws, 'agent_thinking', { status: 'generating_response' });

      try {
        const userMsg = {
          id: `msg-${Date.now()}-u`,
          role: 'user',
          content: userText,
          timestamp: Date.now(),
          language: session.activeLanguage,
        };

        session.transcript.push(userMsg);
        sendWsMessage(ws, 'transcript_update', {
          message: userMsg,
          fullTranscript: session.transcript,
        });

        const turnResult = await processConversationTurn({
          userText,
          transcript: session.transcript,
          currentState: session.state,
          isSilence: false,
          languageMode: session.languageMode,
        });

        const { spokenText, metadata, language: agentLang } = turnResult;

        if (metadata?.extracted) {
          session.state = { ...session.state, ...metadata.extracted };
        }
        if (metadata?.stage) session.state.stage = metadata.stage;
        if (metadata?.isComplete) session.state.isComplete = true;

        const assistantMsg = {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: spokenText,
          timestamp: Date.now(),
          language: agentLang || session.activeLanguage,
        };

        session.transcript.push(assistantMsg);

        sendWsMessage(ws, 'transcript_update', {
          message: assistantMsg,
          fullTranscript: session.transcript,
        });

        sendWsMessage(ws, 'state_update', { state: session.state });

        // Synthesize audio
        sendWsMessage(ws, 'agent_speaking_start', { text: spokenText });
        session.isAgentSpeaking = true;
        const speechGenerationId = ++session.speechGenerationId;
        const { audioBase64 } = await synthesizeSpeech(spokenText, agentLang || session.activeLanguage);
        if (audioBase64 && speechGenerationId === session.speechGenerationId && session.isAgentSpeaking) {
          sendWsMessage(ws, 'audio_chunk', {
            audioBase64,
            mimeType: 'audio/mp3',
            messageId: assistantMsg.id
          });
        }
        if (speechGenerationId === session.speechGenerationId) {
          sendWsMessage(ws, 'agent_speaking_end', {});
          session.isAgentSpeaking = false;
        }
      } catch (err) {
        logger.error(`Text turn error for [${sessionId}]:`, err.message);
      } finally {
        session.isProcessing = false;
      }
      break;
    }

    case 'end_call': {
      await handleEndCall(session);
      break;
    }

    case 'ping': {
      sendWsMessage(ws, 'pong', { time: Date.now() });
      break;
    }
  }
}

async function handleEndCall(session) {
  const { ws, sessionId } = session;
  const durationSec = Math.round((Date.now() - session.startTime) / 1000);

  logger.info(`Ending call for session [${sessionId}]. Total duration: ${durationSec}s, Turns: ${session.transcript.length}`);

  sendWsMessage(ws, 'call_ended', {
    sessionId,
    callDurationSeconds: durationSec,
    totalTurns: session.transcript.length,
  });

  sendWsMessage(ws, 'report_generating', {
    status: 'Synthesizing clinical intake report and triage assessment...',
  });

  try {
    const report = await generateHealthReport({
      transcript: session.transcript,
      screeningState: session.state,
      durationSeconds: durationSec,
      sessionId
    });

    session.report = report;
    sessionStore.set(sessionId, session);

    logger.success(`Health Report generated successfully for session [${sessionId}]`, {
      riskLevel: report.triageAssessment?.riskLevel,
      completion: report.completionStatus
    });

    sendWsMessage(ws, 'report_ready', { report });
  } catch (err) {
    logger.error(`Error generating report for session [${sessionId}]:`, err.message);
    sendWsMessage(ws, 'error', { message: 'Failed to generate health report' });
  }
}
