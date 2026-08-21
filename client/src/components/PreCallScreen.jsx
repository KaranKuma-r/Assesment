import React from 'react';
import { PhoneCall, Sparkles, Globe, ArrowRight } from 'lucide-react';

export function PreCallScreen({
  onStartCall,
  languageMode,
  setLanguageMode,
  callMode,
  setCallMode,
  error,
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center">
      
      {/* Hero Badge & Title */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-semibold tracking-wide shadow-soft-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Conversational Clinical Voice AI</span>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Call Mode</label>
          <div className="grid grid-cols-2 gap-2.5">
            {[['vad', 'Hands-Free'], ['push-to-talk', 'Push to Talk']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setCallMode(id)} className={`p-3 rounded-2xl border text-xs font-bold ${callMode === id ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
          Talk with <span className="text-teal-600">AuraHealth AI</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
          An adaptive, bilingual voice intake assistant. Speak naturally in English or Hindi — our clinical AI listens, conducts the screening intake, and prepares a structured report for your doctor.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="w-full max-w-lg mt-10 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-6">
        
        {/* Language Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Select Language Mode
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'auto', label: '🌐 Auto-Detect', desc: 'English & Hindi' },
              { id: 'en', label: '🇺🇸 English', desc: 'Global English' },
              { id: 'hi', label: '🇮🇳 Hindi', desc: 'हिन्दी / Hinglish' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguageMode(lang.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  languageMode === lang.id
                    ? 'bg-teal-50/90 border-teal-500 text-teal-900 shadow-soft-sm ring-2 ring-teal-500/20'
                    : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/70 hover:text-slate-800'
                }`}
              >
                <div className="font-bold text-xs text-slate-800">{lang.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{lang.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Big Start Call Button */}
        <button
          onClick={onStartCall}
          className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base tracking-wide flex items-center justify-center gap-3 shadow-soft-teal transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <PhoneCall className="w-5 h-5 text-white stroke-[2.5]" />
          <span>Start Voice Screening Call</span>
          <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
        </button>

      </div>

      {/* Screening Protocol Flow Steps */}
      <div className="w-full max-w-xl mt-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { step: '1', title: 'Identity', desc: 'Patient Name' },
            { step: '2', title: 'Concern', desc: 'Chief Symptom' },
            { step: '3', title: 'Duration', desc: 'Onset Timeline' },
            { step: '4', title: 'Triage', desc: 'Severity (1-10)' },
          ].map((item) => (
            <div key={item.step} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
              <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 text-xs font-bold mx-auto flex items-center justify-center mb-1.5 border border-teal-200">
                {item.step}
              </div>
              <div className="font-bold text-xs text-slate-800">{item.title}</div>
              <div className="text-[11px] text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
