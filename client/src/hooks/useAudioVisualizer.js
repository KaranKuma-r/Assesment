import { useEffect, useRef } from 'react';

/**
 * Real-time Web Audio Analyser hook for Canvas waveform / frequency visualizer.
 */
export function useAudioVisualizer(canvasRef, mediaStream, isAiSpeaking = false, isUserSpeaking = false) {
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localAnalyser = null;
    let localAudioContext = null;

    if (mediaStream && isUserSpeaking) {
      try {
        localAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        localAnalyser = localAudioContext.createAnalyser();
        localAnalyser.fftSize = 128;
        localAnalyser.smoothingTimeConstant = 0.8;

        const source = localAudioContext.createMediaStreamSource(mediaStream);
        source.connect(localAnalyser);

        audioContextRef.current = localAudioContext;
        analyserRef.current = localAnalyser;
        sourceRef.current = source;
      } catch (err) {
        console.warn('AudioContext init error:', err);
      }
    }

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      phase += 0.05;

      if (isAiSpeaking) {
        // AI Speaking Waveform (Emerald / Teal organic sine wave)
        const bars = 36;
        const barWidth = width / bars;
        const centerY = height / 2;

        for (let i = 0; i < bars; i++) {
          const x = i * barWidth;
          const sinFactor = Math.sin(i * 0.2 + phase);
          const barHeight = Math.max(8, (Math.sin(i * 0.35 + phase * 1.5) * 0.5 + 0.5) * 45 * Math.abs(sinFactor));

          const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
          gradient.addColorStop(0, '#2dd4bf');
          gradient.addColorStop(0.5, '#14b8a6');
          gradient.addColorStop(1, '#0f766e');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x + 2, centerY - barHeight / 2, barWidth - 4, barHeight, 4);
          ctx.fill();
        }
      } else if (isUserSpeaking && localAnalyser) {
        // User Speaking Live Frequency Spectrum
        const bufferLength = localAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        localAnalyser.getByteFrequencyData(dataArray);

        const bars = 32;
        const barWidth = width / bars;
        const centerY = height / 2;

        for (let i = 0; i < bars; i++) {
          const value = dataArray[i] || 0;
          const barHeight = Math.max(6, (value / 255) * height * 0.7);

          const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
          gradient.addColorStop(0, '#818cf8');
          gradient.addColorStop(0.5, '#6366f1');
          gradient.addColorStop(1, '#4338ca');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(i * barWidth + 2, centerY - barHeight / 2, barWidth - 4, barHeight, 4);
          ctx.fill();
        }
      } else {
        // Idle Ambient Pulse
        const centerY = height / 2;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 2;

        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * 0.04 + phase * 0.5) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (localAudioContext && localAudioContext.state !== 'closed') {
        localAudioContext.close().catch(() => {});
      }
    };
  }, [canvasRef, mediaStream, isAiSpeaking, isUserSpeaking]);
}
