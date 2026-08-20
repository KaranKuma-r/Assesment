import React, { useRef, useEffect } from 'react';
import { MessageSquare, Bot, User, Volume2 } from 'lucide-react';

export function LiveTranscript({ transcript = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col h-[320px] sm:h-[380px]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Live Conversation Transcript</h3>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {transcript.length} turns
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 scroll-smooth">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
            <Bot className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p>Start speaking to see real-time transcribed dialogue and AI responses.</p>
          </div>
        ) : (
          transcript.map((msg, index) => {
            const isAI = msg.role === 'assistant';
            const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 text-xs ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isAI
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}
                >
                  {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    isAI
                      ? 'bg-slate-800/80 border border-slate-700/60 text-slate-100'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75">
                    <span className="font-semibold uppercase tracking-wider">
                      {isAI ? 'AuraHealth AI' : 'Patient'}
                    </span>
                    <span>{timeStr}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
