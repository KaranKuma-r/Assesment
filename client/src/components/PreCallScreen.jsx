import React from 'react';
import { PhoneCall, Mic, Sparkles, ShieldAlert, Globe, Radio, CheckCircle, ArrowRight } from 'lucide-react';

export function PreCallScreen({
  onStartCall,
  languageMode,
  setLanguageMode,
  callMode,
  setCallMode,
  isConnected,
  error,
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      
      {/* Emergency Disclaimer Banner */}
      <div className="w-full mb-8 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-200">
        <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-rose-300">EMERGENCY MEDICAL NOTICE:</span>
          <p className="mt-0.5 text-rose-200/90 leading-relaxed">
            This AI voice screening call is for pre-consultation intake and triage preparation. If you are experiencing chest pain, severe difficulty breathing, acute bleeding, or a medical emergency, please call <strong>108 (India)</strong> or <strong>911 (US)</strong> or visit your nearest emergency room immediately.
          </p>
        </div>
      </div>

      {/* Hero Badge & Title */}
      <div className="text-center space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Conversational Health Intake</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Talk with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-brand-400 to-indigo-400">AuraHealth AI</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Experience an adaptive, bilingual voice intake call. Our clinical AI listens to your symptoms, asks targeted screening questions, and instantly generates a structured doctor-ready summary.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="w-full max-w-xl mt-8 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Language Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            1. Preferred Language Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'auto', label: '🌐 Auto-Detect', desc: 'English & Hindi' },
              { id: 'en', label: '🇺🇸 English', desc: 'Global English' },
              { id: 'hi', label: '🇮🇳 Hindi', desc: 'हिन्दी / Hinglish' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguageMode(lang.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  languageMode === lang.id
                    ? 'bg-brand-500/15 border-brand-400 text-white shadow-md shadow-brand-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-white">{lang.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{lang.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Call Mode Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            2. Voice Interaction Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'push-to-talk', label: '🎙️ Push-to-Talk', desc: 'Hold Spacebar or button while speaking' },
              { id: 'vad', label: '⚡ Hands-Free VAD', desc: 'Automatic speech & silence detection' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setCallMode(mode.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  callMode === mode.id
                    ? 'bg-indigo-500/15 border-indigo-400 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-white">{mode.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Big Start Call Button */}
        <button
          onClick={onStartCall}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-brand-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-navy-950 font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-brand-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.99]"
        >
          <PhoneCall className="w-5 h-5 text-navy-950 stroke-[2.5]" />
          <span>Start Health Screening Call</span>
          <ArrowRight className="w-5 h-5 text-navy-950 stroke-[2.5]" />
        </button>

      </div>

      {/* Screening Protocol Flow Steps */}
      <div className="w-full max-w-2xl mt-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-4">
          What the AI Screening Assistant Will Ask
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          {[
            { step: '1', title: 'Identity', desc: 'Patient Name' },
            { step: '2', title: 'Concern', desc: 'Chief Symptom' },
            { step: '3', title: 'Duration', desc: 'Onset Timeline' },
            { step: '4', title: 'Triage', desc: 'Severity (1-10)' },
          ].map((item) => (
            <div key={item.step} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold mx-auto flex items-center justify-center mb-1">
                {item.step}
              </div>
              <div className="font-semibold text-xs text-slate-200">{item.title}</div>
              <div className="text-[10px] text-slate-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
