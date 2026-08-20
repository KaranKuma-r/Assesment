import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceCall() {
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [languageMode, setLanguageMode] = useState('auto'); // 'auto' | 'en' | 'hi'
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [callMode, setCallMode] = useState('push-to-talk'); // 'push-to-talk' | 'vad'

  const [transcript, setTranscript] = useState([]);
  const [screeningState, setScreeningState] = useState({
    stage: 'greeting',
    patientName: '',
    mainConcern: '',
    duration: '',
    severity: '',
    symptomCharacter: '',
    associatedSymptoms: [],
    medicalHistory: [],
    allergies: [],
    isComplete: false,
    turnCount: 0,
  });

  const [report, setReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioQueueRef = useRef([]);
  const currentAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const isRecordingTurnRef = useRef(false);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;

    console.log('Connecting to WebSocket server:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (e) {
        console.warn('Error parsing incoming WS message:', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, []);

  // Handle incoming server events
  const handleServerMessage = (msg) => {
    const { type, payload } = msg;

    switch (type) {
      case 'call_started':
        setIsCallActive(true);
        setIsThinking(false);
        if (payload?.language) setActiveLanguage(payload.language);
        break;

      case 'agent_thinking':
        setIsThinking(true);
        setThinkingStatus(payload?.status === 'transcribing' ? 'Transcribing speech...' : 'Formulating medical response...');
        break;

      case 'agent_speaking_start':
        setIsThinking(false);
        setIsAiSpeaking(true);
        break;

      case 'audio_chunk':
        if (payload?.audioBase64) {
          playIncomingAudio(payload.audioBase64);
        }
        break;

      case 'agent_speaking_end':
        // If not playing anything, set speaking to false
        if (!currentAudioRef.current || currentAudioRef.current.paused) {
          setIsAiSpeaking(false);
        }
        break;

      case 'transcript_update':
        if (payload?.fullTranscript) {
          setTranscript(payload.fullTranscript);
        } else if (payload?.message) {
          setTranscript((prev) => [...prev, payload.message]);
        }
        break;

      case 'state_update':
        if (payload?.state) {
          setScreeningState((prev) => ({ ...prev, ...payload.state }));
          if (payload.state.activeLanguage) {
            setActiveLanguage(payload.state.activeLanguage);
          }
        }
        break;

      case 'report_generating':
        setIsGeneratingReport(true);
        break;

      case 'report_ready':
        setIsGeneratingReport(false);
        setIsCallActive(false);
        setIsAiSpeaking(false);
        if (payload?.report) {
          setReport(payload.report);
        }
        break;

      case 'call_ended':
        setIsCallActive(false);
        setIsAiSpeaking(false);
        break;

      case 'error':
        console.error('Server error:', payload?.message);
        setError(payload?.message || 'A server communication error occurred');
        setIsThinking(false);
        break;
    }
  };

  // Play audio chunks sequentially with barge-in support
  const playIncomingAudio = (base64Audio) => {
    try {
      const audio = new Audio(base64Audio);
      audioQueueRef.current.push(audio);

      const playNext = () => {
        if (audioQueueRef.current.length === 0) {
          setIsAiSpeaking(false);
          currentAudioRef.current = null;
          return;
        }

        const nextAudio = audioQueueRef.current.shift();
        currentAudioRef.current = nextAudio;
        setIsAiSpeaking(true);

        nextAudio.onended = () => {
          playNext();
        };

        nextAudio.onerror = (e) => {
          console.warn('Audio playback error:', e);
          playNext();
        };

        nextAudio.play().catch((err) => {
          console.warn('Auto-play blocked or failed:', err);
          playNext();
        });
      };

      if (!currentAudioRef.current || currentAudioRef.current.paused || currentAudioRef.current.ended) {
        playNext();
      }
    } catch (err) {
      console.error('Failed to create audio element:', err);
    }
  };

  // Stop currently playing audio (Barge-in)
  const stopAudioPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    audioQueueRef.current = [];
    setIsAiSpeaking(false);

    // Notify server of barge-in
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
    }
  }, []);

  // Request Microphone Access
  const setupMicrophone = async () => {
    if (mediaStreamRef.current) return mediaStreamRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      mediaStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setError('Microphone access is required for voice screening calls. Please allow microphone permissions.');
      throw err;
    }
  };

  // Start Call
  const startCall = async () => {
    setError(null);
    setReport(null);
    setTranscript([]);
    setScreeningState({
      stage: 'greeting',
      patientName: '',
      mainConcern: '',
      duration: '',
      severity: '',
      symptomCharacter: '',
      associatedSymptoms: [],
      medicalHistory: [],
      allergies: [],
      isComplete: false,
      turnCount: 0,
    });

    try {
      await setupMicrophone();
      connectWebSocket();

      // Wait briefly for WebSocket connection if connecting
      const checkAndSend = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'start_call',
              payload: { languageMode },
            })
          );
        } else {
          setTimeout(checkAndSend, 150);
        }
      };

      checkAndSend();
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  // End Call
  const endCall = useCallback(() => {
    stopAudioPlayback();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_call' }));
    }

    setIsRecordingTurnRef(false);
    setIsUserSpeaking(false);
  }, [stopAudioPlayback]);

  // Start User Speaking Turn (Push-to-talk press or VAD trigger)
  const startSpeakingTurn = useCallback(async () => {
    if (isAiSpeaking) {
      stopAudioPlayback(); // Barge-in immediately
    }

    if (isRecordingTurnRef.current) return;

    try {
      const stream = await setupMicrophone();
      isRecordingTurnRef.current = true;
      setIsUserSpeaking(true);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result;
            wsRef.current.send(
              JSON.stringify({
                type: 'audio_chunk',
                payload: { audioBase64: base64Data },
              })
            );
          };
          reader.readAsDataURL(e.data);
        }
      };

      mediaRecorder.start(250); // Emit audio slice every 250ms
    } catch (err) {
      console.error('Error starting recording turn:', err);
      isRecordingTurnRef.current = false;
      setIsUserSpeaking(false);
    }
  }, [isAiSpeaking, stopAudioPlayback]);

  // Stop User Speaking Turn (Push-to-talk release or VAD silence detected)
  const stopSpeakingTurn = useCallback(() => {
    if (!isRecordingTurnRef.current) return;

    isRecordingTurnRef.current = false;
    setIsUserSpeaking(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Give 150ms for last chunk to flush before sending turn end signal
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'audio_turn_end' }));
      }
    }, 150);
  }, []);

  // Send Text Turn (Keyboard Fallback)
  const sendTextMessage = useCallback((text) => {
    if (!text || !text.trim()) return;

    if (isAiSpeaking) {
      stopAudioPlayback();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text_turn',
          payload: { text },
        })
      );
    }
  }, [isAiSpeaking, stopAudioPlayback]);

  // Connect on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [connectWebSocket]);

  return {
    isConnected,
    isCallActive,
    isAiSpeaking,
    isUserSpeaking,
    isThinking,
    thinkingStatus,
    isMuted,
    languageMode,
    activeLanguage,
    callMode,
    transcript,
    screeningState,
    report,
    isGeneratingReport,
    error,
    mediaStream: mediaStreamRef.current,
    startCall,
    endCall,
    startSpeakingTurn,
    stopSpeakingTurn,
    stopAudioPlayback,
    sendTextMessage,
    setLanguageMode,
    setCallMode,
    setIsMuted,
    setReport,
  };
}
