import React, { useState } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { PreCallScreen } from './components/PreCallScreen.jsx';
import { CallInterface } from './components/CallInterface.jsx';
import { HealthReport } from './components/HealthReport.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { useVoiceCall } from './hooks/useVoiceCall.js';
import { Sparkles, Loader2, Activity } from 'lucide-react';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    isConnected,
    isCallActive,
    isAiSpeaking,
    isUserSpeaking,
    isThinking,
    thinkingStatus,
    isMuted,
    languageMode,
    activeLanguage,
    callMode,
    interimText,
    transcript,
    screeningState,
    report,
    isGeneratingReport,
    error,
    mediaStream,
    startCall,
    endCall,
    startSpeakingTurn,
    stopSpeakingTurn,
    stopAudioPlayback,
    sendTextMessage,
    setLanguageMode,
    setCallMode,
    setIsMuted,
    setReport,
  } = useVoiceCall();

  const handleStartNewCall = () => {
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Top Navigation */}
      <Navbar
        isConnected={isConnected}
        languageMode={languageMode}
        setLanguageMode={setLanguageMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Screen Router */}
      <main className="flex-1 flex flex-col justify-center">
        
        {/* Loading / Synthesizing Report Overlay */}
        {isGeneratingReport && (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shadow-soft-teal">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Synthesizing Clinical Report...</h2>
              <p className="text-xs text-slate-500 max-w-sm">
                Our clinical AI is analyzing dialogue turns, extracting symptoms, and generating the doctor-ready triage assessment.
              </p>
            </div>
          </div>
        )}

        {/* View 1: Active Call Screen */}
        {!isGeneratingReport && isCallActive && (
          <CallInterface
            isAiSpeaking={isAiSpeaking}
            isUserSpeaking={isUserSpeaking}
            isThinking={isThinking}
            thinkingStatus={thinkingStatus}
            mediaStream={mediaStream}
            activeLanguage={activeLanguage}
            interimText={interimText}
            transcript={transcript}
            screeningState={screeningState}
            callMode={callMode}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            startSpeakingTurn={startSpeakingTurn}
            stopSpeakingTurn={stopSpeakingTurn}
            stopAudioPlayback={stopAudioPlayback}
            sendTextMessage={sendTextMessage}
            onEndCall={endCall}
          />
        )}

        {/* View 2: Post-Call Health Report */}
        {!isGeneratingReport && !isCallActive && report && (
          <HealthReport report={report} onStartNewCall={handleStartNewCall} />
        )}

        {/* View 3: Pre-Call Setup Screen */}
        {!isGeneratingReport && !isCallActive && !report && (
          <PreCallScreen
            onStartCall={startCall}
            languageMode={languageMode}
            setLanguageMode={setLanguageMode}
            callMode={callMode}
            setCallMode={setCallMode}
            isConnected={isConnected}
            error={error}
          />
        )}

      </main>

      {/* Pipeline Telemetry Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Global Footer */}
      <footer className="w-full border-t border-slate-200 py-4 px-6 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-teal-600" />
          <span>AuraHealth Voice AI • Real-Time WebSockets • Bilingual Health Intake</span>
        </div>
        <div>
          <span>Clinical Pre-Triage Screening System</span>
        </div>
      </footer>

    </div>
  );
}
