import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Hand, MessageSquare, Send, Radio, VolumeX, Sparkles } from 'lucide-react';
import { AudioOrb } from './AudioOrb.jsx';
import { LiveClinicalState } from './LiveClinicalState.jsx';
import { LiveTranscript } from './LiveTranscript.jsx';
import { useVAD } from '../hooks/useVAD.js';

export function CallInterface({
  isAiSpeaking,
  isUserSpeaking,
  isThinking,
  thinkingStatus,
  mediaStream,
  activeLanguage,
  transcript,
  screeningState,
  callMode,
  isMuted,
  setIsMuted,
  startSpeakingTurn,
  stopSpeakingTurn,
  stopAudioPlayback,
  sendTextMessage,
  onEndCall,
}) {
  const [durationSec, setDurationSec] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice Activity Detection (VAD) hook if hands-free mode selected
  useVAD({
    mediaStream,
    isEnabled: callMode === 'vad' && !isMuted,
    onSpeechStart: () => {
      startSpeakingTurn();
    },
    onSpeechEnd: () => {
      stopSpeakingTurn();
    },
  });

  // Global Spacebar listener for Push-to-Talk
  useEffect(() => {
    if (callMode !== 'push-to-talk') return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpacePressed(true);
        startSpeakingTurn();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpacePressed(false);
        stopSpeakingTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [callMode, startSpeakingTurn, stopSpeakingTurn]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendTextMessage(textInput);
      setTextInput('');
    }
  };

  const latestMessage = transcript.length > 0 ? transcript[transcript.length - 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 min-h-[calc(100vh-80px)] justify-between">
      
      {/* Call Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE CALL INTAKE</span>
          </div>
          <span className="text-sm font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            ⏱️ {formatDuration(durationSec)}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-slate-300" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic Active'}</span>
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Main Call Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center: Interactive Voice Orb Visualizer */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
          <AudioOrb
            isAiSpeaking={isAiSpeaking}
            isUserSpeaking={isUserSpeaking || isSpacePressed}
            isThinking={isThinking}
            thinkingStatus={thinkingStatus}
            mediaStream={mediaStream}
            activeLanguage={activeLanguage}
            latestMessage={latestMessage}
          />
        </div>

        {/* Right Side: Live Clinical State & Live Transcript Tabs */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <LiveClinicalState screeningState={screeningState} />
          <LiveTranscript transcript={transcript} />
        </div>

      </div>

      {/* Bottom Controls & Push-to-Talk Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-4">
        
        {/* Call Mode Indicator & Hints */}
        <div className="text-xs text-slate-400 flex items-center gap-3">
          {callMode === 'push-to-talk' ? (
            <span>
              💡 <strong>Push-to-Talk Mode:</strong> Hold the button or press and hold <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">Spacebar</kbd> to speak.
            </span>
          ) : (
            <span>
              ⚡ <strong>Hands-Free VAD Mode:</strong> Speak naturally. AI will detect your voice and respond automatically after you finish.
            </span>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
          
          {/* Barge-In / Interrupt Button */}
          {isAiSpeaking && (
            <button
              onClick={stopAudioPlayback}
              className="py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all animate-pulse"
            >
              <Hand className="w-4 h-4" />
              <span>Interrupt AI (Barge-In)</span>
            </button>
          )}

          {/* Primary Voice Action Button */}
          {callMode === 'push-to-talk' ? (
            <button
              onMouseDown={startSpeakingTurn}
              onMouseUp={stopSpeakingTurn}
              onTouchStart={startSpeakingTurn}
              onTouchEnd={stopSpeakingTurn}
              className={`w-full py-4 px-8 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl transition-all select-none ${
                isUserSpeaking || isSpacePressed
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white scale-105 shadow-indigo-500/40 ring-4 ring-indigo-400/30'
                  : 'bg-gradient-to-r from-teal-500 via-brand-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-navy-950 shadow-brand-500/25'
              }`}
            >
              <Mic className={`w-5 h-5 ${isUserSpeaking || isSpacePressed ? 'animate-bounce' : ''}`} />
              <span>{isUserSpeaking || isSpacePressed ? 'Recording Voice Turn... (Release to Send)' : 'Hold to Speak (or Spacebar)'}</span>
            </button>
          ) : (
            <div className="w-full py-3.5 px-6 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span>Hands-Free Active — Speak anytime</span>
            </div>
          )}

          {/* Text Fallback Drawer Toggle */}
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{showTextInput ? 'Hide Text Fallback' : 'Type message instead'}</span>
          </button>
        </div>

        {/* Text Fallback Input */}
        {showTextInput && (
          <form onSubmit={handleSendText} className="w-full max-w-lg flex items-center gap-2 mt-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response here if speech is unclear..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-brand-400"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-navy-950 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

    </div>
  );
}
