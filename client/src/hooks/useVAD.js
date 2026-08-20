import { useEffect, useRef, useState } from 'react';

/**
 * Energy/RMS-based Voice Activity Detection hook for Hands-Free voice conversation.
 */
export function useVAD({
  mediaStream,
  isEnabled = false,
  onSpeechStart,
  onSpeechEnd,
  silenceThresholdMs = 1800,
  minSpeechDurationMs = 600,
  energyThreshold = 0.02
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const speechStartTimeRef = useRef(0);
  const lastAudioTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    if (!isEnabled || !mediaStream) {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);

      checkIntervalRef.current = setInterval(() => {
        analyser.getFloatTimeDomainData(dataArray);

        // Calculate Root Mean Square (RMS) energy
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const now = Date.now();

        if (rms > energyThreshold) {
          lastAudioTimeRef.current = now;

          if (!isSpeakingRef.current) {
            speechStartTimeRef.current = now;
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            if (onSpeechStart) onSpeechStart();
          }
        } else {
          // If silent for longer than silenceThresholdMs and speech duration exceeded minimum
          if (isSpeakingRef.current && (now - lastAudioTimeRef.current > silenceThresholdMs)) {
            const speechDuration = now - speechStartTimeRef.current;
            if (speechDuration >= minSpeechDurationMs) {
              isSpeakingRef.current = false;
              setIsSpeaking(false);
              if (onSpeechEnd) onSpeechEnd();
            }
          }
        }
      }, 100);
    } catch (err) {
      console.warn('VAD initialization failed:', err);
    }

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isEnabled, mediaStream, onSpeechStart, onSpeechEnd, silenceThresholdMs, minSpeechDurationMs, energyThreshold]);

  return { isSpeaking };
}
