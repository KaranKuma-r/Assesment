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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-800">Voice AI Pipeline Status</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading system pipeline telemetry...</div>
        ) : config ? (
          <div className="space-y-4 text-xs">
            
            {/* Active Engines */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <Mic className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-500 block">STT Engine</span>
                <span className="font-bold text-slate-800 uppercase text-xs">{config.providers?.stt || 'Groq Whisper'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <Cpu className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-500 block">LLM Engine</span>
                <span className="font-bold text-slate-800 uppercase text-xs">{config.providers?.llm || 'Llama 3.3'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <Volume2 className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-500 block">TTS Engine</span>
                <span className="font-bold text-slate-800 uppercase text-xs">{config.providers?.tts || 'OpenAI / Google'}</span>
              </div>
            </div>

            {/* Model & Voice Configuration */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Groq LLM Model:</span>
                <span className="font-mono text-slate-800 font-semibold">{config.models?.groqModel || 'llama-3.3-70b-versatile'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">OpenAI Model:</span>
                <span className="font-mono text-slate-800 font-semibold">{config.models?.openaiModel || 'gpt-4o-mini'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">OpenAI Voice Preset:</span>
                <span className="font-mono text-slate-800 font-semibold">{config.models?.openaiVoice || 'nova'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sarvam Voice Preset:</span>
                <span className="font-mono text-slate-800 font-semibold">{config.models?.sarvamVoice || 'ananya'}</span>
              </div>
            </div>

            {/* API Key Detection Badges */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Detected API Providers</span>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 ${
                  config.providers?.hasGroq ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {config.providers?.hasGroq ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> : '○'} Groq (Whisper + Llama)
                </span>

                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 ${
                  config.providers?.hasOpenAI ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {config.providers?.hasOpenAI ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> : '○'} OpenAI (Whisper + GPT + TTS)
                </span>

                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 ${
                  config.providers?.hasSarvam ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {config.providers?.hasSarvam ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> : '○'} Sarvam AI (Saarika + Bulbul)
                </span>
              </div>
            </div>

            {/* Credential-free demo note */}
            {!config.providers?.hasGroq && !config.providers?.hasOpenAI && !config.providers?.hasSarvam && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] leading-relaxed">
                💡 <strong>Demo Mode:</strong> Without an LLM key, the app uses a stateful intake flow. Configure an STT provider for server-side transcription; browser speech recognition remains available where supported.
              </div>
            )}

          </div>
        ) : (
          <div className="text-xs text-rose-600">Failed to connect to backend configuration API.</div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
