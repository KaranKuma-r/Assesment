import React from 'react';
import { Activity, Radio, Globe, Settings, ShieldAlert } from 'lucide-react';

export function Navbar({ isConnected, languageMode, setLanguageMode, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-brand-400/40">
            <Activity className="w-5 h-5 text-navy-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">AuraHealth</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30">
                VOICE AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide">Intelligent Clinical Intake & Screening</p>
          </div>
        </div>

        {/* Status & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className={isConnected ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              {isConnected ? 'Real-Time WS Active' : 'Connecting...'}
            </span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
            <Globe className="w-4 h-4 text-brand-400 ml-1.5 hidden xs:block" />
            <select
              value={languageMode}
              onChange={(e) => setLanguageMode(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-2 py-1"
            >
              <option value="auto" className="bg-navy-900 text-white">🌐 Auto (Hindi / English / Hinglish)</option>
              <option value="en" className="bg-navy-900 text-white">🇺🇸 English</option>
              <option value="hi" className="bg-navy-900 text-white">🇮🇳 Hindi (हिन्दी)</option>
            </select>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="System Pipeline Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
