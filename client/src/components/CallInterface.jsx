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
  interimText = '',
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
  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice Activity Detection (VAD) hook for 100% Hands-Free speech detection
  useVAD({
    mediaStream,
    isEnabled: callMode === 'vad' && !isMuted && !isAiSpeaking && !isThinking,
    onSpeechStart: () => {
      startSpeakingTurn();
    },
    onSpeechEnd: () => {
      stopSpeakingTurn();
    },
  });

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
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-soft-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE CALL INTAKE</span>
          </div>
          <span className="text-sm font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 font-semibold">
            ⏱️ {formatDuration(durationSec)}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-soft-sm ${
              isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-slate-600" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic Active'}</span>
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-soft-sm transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Main Call Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center: Interactive Voice Orb Visualizer */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-soft">
          <AudioOrb
            isAiSpeaking={isAiSpeaking}
            isUserSpeaking={isUserSpeaking}
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
          <LiveTranscript transcript={transcript} interimText={interimText} />
        </div>

      </div>

      {/* Bottom Controls Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-soft flex flex-col items-center gap-3">
        
        {/* Live Status Pill & Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg">
          {callMode === 'push-to-talk' && (
            <button
              onPointerDown={startSpeakingTurn}
              onPointerUp={stopSpeakingTurn}
              onPointerLeave={stopSpeakingTurn}
              disabled={isMuted || isThinking}
              className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold"
            >
              Hold to Talk
            </button>
          )}
          
          {/* Barge-In / Interrupt Button */}
          {isAiSpeaking && (
            <button
              onClick={stopAudioPlayback}
              className="py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2 transition-all shadow-soft-sm active:scale-95"
            >
              <Hand className="w-4 h-4 text-amber-600" />
              <span>Interrupt AI</span>
            </button>
          )}

          {/* Voice State Pill */}
          <div className={`flex-1 py-3 px-5 rounded-2xl border text-xs font-semibold text-center flex items-center justify-center gap-2.5 transition-all ${
            isUserSpeaking
              ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-soft-indigo ring-2 ring-indigo-100'
              : isThinking
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : isAiSpeaking
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-soft-sm'
          }`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isUserSpeaking ? 'bg-indigo-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isUserSpeaking ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}></span>
            </span>
            <span>
              {isUserSpeaking
                ? '🎙️ Listening to you... (Pause when finished)'
                : isThinking
                ? '🧠 Clinical AI is thinking...'
                : isAiSpeaking
                ? '🔊 AuraHealth AI is speaking...'
                : '✨ Listening Automatically — Speak naturally anytime'}
            </span>
          </div>

          {/* Text Fallback Drawer Toggle */}
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-all shadow-soft-sm"
            title="Type message instead"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{showTextInput ? 'Hide Text' : 'Type'}</span>
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

    </div>
  );
}
