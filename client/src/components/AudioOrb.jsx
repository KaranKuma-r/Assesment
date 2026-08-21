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
  let statusColor = 'text-slate-500';
  let orbGlow = 'from-slate-100 via-slate-50 to-white border-slate-200 shadow-soft-sm';

  if (isThinking) {
    statusText = thinkingStatus || 'Clinical AI is processing...';
    statusColor = 'text-amber-700';
    orbGlow = 'from-amber-100 via-amber-50 to-white border-amber-300 shadow-soft';
  } else if (isAiSpeaking) {
    statusText = 'AuraHealth AI is speaking...';
    statusColor = 'text-teal-700 font-semibold';
    orbGlow = 'from-teal-100 via-teal-50 to-white border-teal-300 shadow-soft-teal';
  } else if (isUserSpeaking) {
    statusText = 'Listening to you...';
    statusColor = 'text-indigo-700 font-semibold';
    orbGlow = 'from-indigo-100 via-indigo-50 to-white border-indigo-300 shadow-soft-indigo';
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      
      {/* Central Visualizer Orb */}
      <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 my-4">
        
        {/* Ripple Rings when Speaking */}
        {isAiSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-teal-200/50 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute -inset-4 rounded-full border border-teal-300 animate-pulse pointer-events-none" />
          </>
        )}

        {isUserSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-indigo-200/50 animate-ping opacity-75 pointer-events-none" />
            <div className="absolute -inset-3 rounded-full border border-indigo-300 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Animated Inner Glowing Sphere */}
        <div
          className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr ${orbGlow} backdrop-blur-xl border flex flex-col items-center justify-center transition-all duration-500`}
        >
          {/* Central Icon */}
          <div className="mb-2">
            {isAiSpeaking ? (
              <Volume2 className="w-10 h-10 text-teal-600 animate-bounce" />
            ) : isUserSpeaking ? (
              <Mic className="w-10 h-10 text-indigo-600 animate-pulse" />
            ) : isThinking ? (
              <Sparkles className="w-10 h-10 text-amber-600 animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Mic className="w-5 h-5 text-slate-500" />
              </div>
            )}
          </div>

          {/* Active Language Badge */}
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-soft-sm">
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
          className="w-full h-full rounded-xl bg-slate-50 border border-slate-200"
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
        <div className="mt-4 max-w-lg px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed shadow-soft-sm">
          <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wide">
            {latestMessage.role === 'assistant' ? 'AI Agent' : 'You'}:
          </span>
          <span className="italic">
            "{latestMessage.content.replace(/```(?:json)?[\s\S]*?```/g, '').replace(/\{[\s\S]*?"(?:extracted|stage|patientName)"[\s\S]*?\}/g, '').trim()}"
          </span>
        </div>
      )}

    </div>
  );
}
