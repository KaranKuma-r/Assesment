import React from 'react';
import { Activity, Radio, Globe, Settings, ShieldAlert } from 'lucide-react';

export function Navbar({ isConnected, languageMode, setLanguageMode, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-soft-teal">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-800">AuraHealth</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                VOICE AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 tracking-wide">Intelligent Clinical Intake & Screening</p>
          </div>
        </div>

        {/* Status & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className={isConnected ? 'text-slate-700 font-medium' : 'text-rose-600 font-medium'}>
              {isConnected ? 'Real-Time WS Active' : 'Connecting...'}
            </span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1">
            <Globe className="w-4 h-4 text-teal-600 ml-1.5 hidden xs:block" />
            <select
              value={languageMode}
              onChange={(e) => setLanguageMode(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2 py-1"
            >
              <option value="auto" className="bg-white text-slate-800">🌐 Auto (Hindi / English / Hinglish)</option>
              <option value="en" className="bg-white text-slate-800">🇺🇸 English</option>
              <option value="hi" className="bg-white text-slate-800">🇮🇳 Hindi (हिन्दी)</option>
            </select>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors shadow-soft-sm"
            title="System Pipeline Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
