import React, { useRef } from 'react';
import { Volume2, Mic, Sparkles, AlertCircle } from 'lucide-react';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer.js';

export function AudioOrb({
  isAiSpeaking,
  isUserSpeaking,
  isThinking,
  thinkingStatus,
  mediaStream,
  activeLanguage,
  latestMessage,
}) {
  const canvasRef = useRef(null);
  useAudioVisualizer(canvasRef, mediaStream, isAiSpeaking, isUserSpeaking);

  let statusText = 'Ready to listen';
  let statusColor = 'text-slate-400';
  let orbGlow = 'from-slate-700/20 to-slate-900/40 border-slate-700/50';

  if (isThinking) {
    statusText = thinkingStatus || 'Clinical AI is processing...';
    statusColor = 'text-amber-400';
    orbGlow = 'from-amber-500/30 to-orange-500/20 border-amber-500/50 glow-brand';
  } else if (isAiSpeaking) {
    statusText = 'AuraHealth AI is speaking...';
    statusColor = 'text-brand-400';
    orbGlow = 'from-teal-500/40 to-brand-600/30 border-brand-400/60 glow-brand-lg';
  } else if (isUserSpeaking) {
    statusText = 'Listening to you...';
    statusColor = 'text-indigo-400';
    orbGlow = 'from-indigo-500/40 to-blue-600/30 border-indigo-400/60 shadow-lg shadow-indigo-500/30';
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      
      {/* Central Visualizer Orb */}
      <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 my-4">
        
        {/* Ripple Rings when Speaking */}
        {isAiSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute -inset-4 rounded-full border border-brand-500/40 animate-pulse pointer-events-none" />
          </>
        )}

        {isUserSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-indigo-500/25 animate-ping opacity-75 pointer-events-none" />
            <div className="absolute -inset-3 rounded-full border border-indigo-400/50 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Animated Inner Glowing Sphere */}
        <div
          className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr ${orbGlow} backdrop-blur-xl border flex flex-col items-center justify-center transition-all duration-500 shadow-2xl`}
        >
          {/* Central Icon */}
          <div className="mb-2">
            {isAiSpeaking ? (
              <Volume2 className="w-10 h-10 text-brand-300 animate-bounce" />
            ) : isUserSpeaking ? (
              <Mic className="w-10 h-10 text-indigo-300 animate-pulse" />
            ) : isThinking ? (
              <Sparkles className="w-10 h-10 text-amber-300 animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <Mic className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>

          {/* Active Language Badge */}
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
            {activeLanguage === 'hi' ? '🇮🇳 Hindi' : '🇺🇸 English'}
          </span>
        </div>

      </div>

      {/* Real-time Waveform Canvas */}
      <div className="w-full max-w-xs h-14 my-2 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={280}
          height={56}
          className="w-full h-full rounded-lg bg-slate-900/40 border border-slate-800/60"
        />
      </div>

      {/* State Status Banner */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-sm font-medium ${statusColor} transition-colors duration-300`}>
          {statusText}
        </span>
      </div>

      {/* Latest Spoken Caption */}
      {latestMessage && (
        <div className="mt-4 max-w-lg px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm leading-relaxed shadow-sm">
          <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wide">
            {latestMessage.role === 'assistant' ? 'AI Agent' : 'You'}:
          </span>
          <span className="italic">"{latestMessage.content}"</span>
        </div>
      )}

    </div>
  );
}
