import React, { useEffect, useState } from 'react';
import { X, Server, Cpu, Mic, Volume2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export function SettingsModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          setConfig(data);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to load config:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-bold text-white">Voice AI Pipeline Status</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading system pipeline telemetry...</div>
        ) : config ? (
          <div className="space-y-4 text-xs">
            
            {/* Active Engines */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <Mic className="w-4 h-4 text-brand-400 mx-auto mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400 block">STT Engine</span>
                <span className="font-bold text-white uppercase text-xs">{config.providers?.stt || 'Groq Whisper'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <Cpu className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400 block">LLM Engine</span>
                <span className="font-bold text-white uppercase text-xs">{config.providers?.llm || 'Llama 3.3'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <Volume2 className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400 block">TTS Engine</span>
                <span className="font-bold text-white uppercase text-xs">{config.providers?.tts || 'OpenAI / Google'}</span>
              </div>
            </div>

            {/* Model & Voice Configuration */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Groq LLM Model:</span>
                <span className="font-mono text-slate-200 font-semibold">{config.models?.groqModel || 'llama-3.3-70b-versatile'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">OpenAI Model:</span>
                <span className="font-mono text-slate-200 font-semibold">{config.models?.openaiModel || 'gpt-4o-mini'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">OpenAI Voice Preset:</span>
                <span className="font-mono text-slate-200 font-semibold">{config.models?.openaiVoice || 'nova'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sarvam Voice Preset:</span>
                <span className="font-mono text-slate-200 font-semibold">{config.models?.sarvamVoice || 'ananya'}</span>
              </div>
            </div>

            {/* API Key Detection Badges */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Detected API Providers</span>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 ${
                  config.providers?.hasGroq ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {config.providers?.hasGroq ? <CheckCircle2 className="w-3.5 h-3.5" /> : '○'} Groq (Whisper + Llama)
                </span>

                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 ${
                  config.providers?.hasOpenAI ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {config.providers?.hasOpenAI ? <CheckCircle2 className="w-3.5 h-3.5" /> : '○'} OpenAI (Whisper + GPT + TTS)
                </span>

                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 ${
                  config.providers?.hasSarvam ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {config.providers?.hasSarvam ? <CheckCircle2 className="w-3.5 h-3.5" /> : '○'} Sarvam AI (Saarika + Bulbul)
                </span>
              </div>
            </div>

            {/* Zero-Key Safe Guarantee */}
            {!config.providers?.hasGroq && !config.providers?.hasOpenAI && !config.providers?.hasSarvam && (
              <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/60 text-indigo-300 text-[11px]">
                💡 <strong>Zero-Key Fallback Mode Active:</strong> The app will run seamlessly using Google TTS & simulated clinical dialogue responses even without third-party API keys configured in .env!
              </div>
            )}

          </div>
        ) : (
          <div className="text-xs text-rose-400">Failed to connect to backend configuration API.</div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
