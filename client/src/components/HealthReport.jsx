import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  User,
  HeartPulse,
  Activity,
  PlusCircle,
  Pill,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { exportReportToPDF } from '../utils/pdfExport.js';

export function HealthReport({ report, onStartNewCall }) {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  if (!report) return null;

  const {
    id,
    timestamp,
    callDurationSeconds = 0,
    totalTurns = 0,
    completionStatus = 'complete',
    completionPercentage = 95,
    patientInfo = {},
    chiefComplaint = {},
    historyOfPresentIllness = {},
    associatedSymptoms = [],
    medicalBackground = {},
    triageAssessment = {},
    recommendedActionItems = [],
    doctorClinicalNote = '',
    transcript = [],
  } = report;

  const riskLevel = triageAssessment?.riskLevel || 'MODERATE';

  // Triage badge styles
  const getTriageStyle = (level) => {
    switch (level) {
      case 'EMERGENCY':
        return {
          bg: 'bg-rose-950/60 border-rose-600/80 text-rose-300',
          badge: 'bg-rose-600 text-white',
          glow: 'glow-red',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/60 border-orange-600/80 text-orange-300',
          badge: 'bg-orange-600 text-white',
          glow: 'shadow-lg shadow-orange-500/20',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-950/60 border-amber-500/80 text-amber-300',
          badge: 'bg-amber-500 text-navy-950',
          glow: 'shadow-lg shadow-amber-500/20',
        };
      default:
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300',
          badge: 'bg-emerald-500 text-navy-950',
          glow: 'glow-brand',
        };
    }
  };

  const triageStyle = getTriageStyle(riskLevel);

  const handleCopySummary = () => {
    const text = `
=== AURAHEALTH AI CLINICAL INTAKE REPORT ===
Report ID: ${id}
Date: ${new Date(timestamp).toLocaleString()}
Duration: ${callDurationSeconds}s | Completion: ${completionStatus}

Patient Name: ${patientInfo.name || 'Anonymous'}
Language: ${patientInfo.preferredLanguage || 'English'}
Chief Complaint: ${chiefComplaint.primarySymptom || 'N/A'}
Onset & Duration: ${historyOfPresentIllness.onsetAndDuration || 'N/A'}
Severity: ${historyOfPresentIllness.severityScore || 5}/10 (${historyOfPresentIllness.severityClassification || 'Moderate'})
Associated Symptoms: ${(associatedSymptoms || []).join(', ')}

TRIAGE ASSESSMENT:
Risk Level: ${riskLevel}
Recommended Urgency: ${triageAssessment.recommendedUrgency || 'Next Day Clinic'}
Rationale: ${triageAssessment.clinicalRationale || 'N/A'}

DOCTOR CLINICAL NOTE:
${doctorClinicalNote}

RECOMMENDED ACTIONS:
${(recommendedActionItems || []).map((a) => `• ${a}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Report Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Clinical Health Screening Report</h2>
              <p className="text-xs text-slate-400">
                Report ID: <span className="font-mono text-slate-300">{id}</span> • Generated {new Date(timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopySummary}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={() => exportReportToPDF(report)}
            className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-navy-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onStartNewCall}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Call</span>
          </button>
        </div>
      </div>

      {/* Triage Alert Banner */}
      <div className={`p-6 rounded-3xl border ${triageStyle.bg} ${triageStyle.glow} backdrop-blur-xl space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${triageStyle.badge}`}>
              Triage Level: {riskLevel}
            </span>
            <span className="text-sm font-bold text-white">
              Recommended Urgency: {triageAssessment?.recommendedUrgency || 'Next Day Clinic'}
            </span>
          </div>

          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span>Intake Completion:</span>
            <span className="font-bold text-white capitalize">{completionStatus}</span>
            <div className="w-16 bg-slate-800 rounded-full h-2">
              <div
                className="bg-brand-400 h-2 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span>{completionPercentage}%</span>
          </div>
        </div>

        {/* Clinical Rationale */}
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
            Clinical Triage Rationale:
          </span>
          <p className="text-sm leading-relaxed text-slate-200">
            {triageAssessment?.clinicalRationale || 'Intake screening completed with stable vital parameters.'}
          </p>
        </div>

        {/* Red Flags if any */}
        {triageAssessment?.identifiedRedFlags && triageAssessment.identifiedRedFlags.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-rose-900/50 border border-rose-700 text-xs text-rose-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Identified Red Flags:</span>
              <ul className="list-disc list-inside mt-0.5">
                {triageAssessment.identifiedRedFlags.map((rf, i) => (
                  <li key={i}>{rf}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Demographics, Chief Complaint, HPI, Symptoms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Patient Demographics & Intake Metrics */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. Patient Profile</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name</span>
              <span className="text-sm font-bold text-white">{patientInfo.name || 'Anonymous Caller'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Language</span>
              <span className="text-sm font-bold text-white">{patientInfo.preferredLanguage || 'English'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Call Duration</span>
              <span className="text-sm font-mono font-bold text-slate-200">{callDurationSeconds} seconds</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Screening Turns</span>
              <span className="text-sm font-mono font-bold text-slate-200">{totalTurns} turns</span>
            </div>
          </div>
        </div>

        {/* Section 2: Chief Complaint & Present Illness (HPI) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <HeartPulse className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. Chief Complaint & HPI</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Symptom</span>
              <span className="text-sm font-bold text-indigo-300">{chiefComplaint.primarySymptom || 'Not specified'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Onset / Duration</span>
                <span className="text-xs font-semibold text-slate-200">{historyOfPresentIllness.onsetAndDuration || 'Not stated'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Severity Rating</span>
                <span className="text-xs font-bold text-amber-300">
                  {historyOfPresentIllness.severityScore || 5}/10 ({historyOfPresentIllness.severityClassification || 'Moderate'})
                </span>
              </div>
            </div>

            {historyOfPresentIllness.symptomCharacteristics && (
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                <span className="font-semibold text-slate-400">Character:</span> {historyOfPresentIllness.symptomCharacteristics}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Section 3: Associated Symptoms & Medical Background */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Activity className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">3. Symptoms & Clinical History</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          {/* Associated Symptoms */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Associated Symptoms</span>
            <div className="flex flex-wrap gap-1.5">
              {associatedSymptoms.length > 0 ? (
                associatedSymptoms.map((sym, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                    + {sym}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">None reported</span>
              )}
            </div>
          </div>

          {/* Known Conditions */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Known Medical Conditions</span>
            <div className="flex flex-wrap gap-1.5">
              {medicalBackground.knownConditions && medicalBackground.knownConditions.length > 0 ? (
                medicalBackground.knownConditions.map((cond, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                    {cond}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">None reported</span>
              )}
            </div>
          </div>

          {/* Allergies & Meds */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Allergies & Current Meds</span>
            <div className="flex flex-wrap gap-1.5">
              {medicalBackground.knownAllergies && medicalBackground.knownAllergies.length > 0 ? (
                medicalBackground.knownAllergies.map((alg, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 font-medium">
                    ⚠️ {alg}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">No known allergies (NKDA)</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Section 4: Physician's Structured Clinical SBAR Note */}
      {doctorClinicalNote && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">4. Physician's Clinical SBAR Summary</h3>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-sans italic bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            "{doctorClinicalNote}"
          </p>
        </div>
      )}

      {/* Section 5: Recommended Next Steps */}
      {recommendedActionItems && recommendedActionItems.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">5. Recommended Clinical Action Items</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {recommendedActionItems.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 6: Collapsible Full Conversation Transcript */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
        >
          <span>View Full Audited Call Transcript ({transcript.length} turns)</span>
          {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTranscript && (
          <div className="mt-4 space-y-3 pt-4 border-t border-slate-800 max-h-96 overflow-y-auto pr-2">
            {transcript.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl text-xs ${
                  msg.role === 'assistant'
                    ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                    : 'bg-indigo-950/40 border border-indigo-800/60 text-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-bold uppercase tracking-wider">
                    {msg.role === 'assistant' ? '🤖 AuraHealth AI' : '👤 Patient'}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
