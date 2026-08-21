import React, { useRef, useEffect } from 'react';
import { MessageSquare, Bot, User, Volume2 } from 'lucide-react';

export function LiveTranscript({ transcript = [], interimText = '' }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-soft flex flex-col h-[320px] sm:h-[380px]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Live Conversation Transcript</h3>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          {transcript.length} turns
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 scroll-smooth">
        {transcript.length === 0 && !interimText ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
            <Bot className="w-8 h-8 text-slate-300 mb-2" />
            <p>Start speaking to see real-time transcribed dialogue and AI responses.</p>
          </div>
        ) : (
          <>
            {transcript.map((msg, index) => {
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
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-soft-sm ${
                      isAI
                        ? 'bg-slate-100 border border-slate-200 text-slate-800'
                        : 'bg-indigo-600 text-white shadow-soft-indigo'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-80">
                      <span className="font-bold uppercase tracking-wider">
                        {isAI ? 'AuraHealth AI' : 'Patient'}
                      </span>
                      <span className="font-mono text-[9px]">{timeStr}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {isAI ? msg.content.replace(/```(?:json)?[\s\S]*?```/g, '').replace(/\{[\s\S]*?"(?:extracted|stage|patientName)"[\s\S]*?\}/g, '').trim() : msg.content}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Live Interim Speech Bubble */}
            {interimText && (
              <div className="flex gap-3 text-xs items-start flex-row-reverse animate-pulse">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-indigo-100 text-indigo-700 border border-indigo-300">
                  <User className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="max-w-[82%] rounded-2xl px-4 py-2.5 bg-indigo-50 border border-indigo-300 text-indigo-900 shadow-soft-indigo">
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-indigo-700 font-bold">
                    <span>Patient (Speaking live...)</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                  </div>
                  <p className="leading-relaxed italic">{interimText}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
