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
  const severityLabel = Number.isFinite(historyOfPresentIllness.severityScore) && historyOfPresentIllness.severityScore > 0
    ? `${historyOfPresentIllness.severityScore}/10 (${historyOfPresentIllness.severityClassification || 'Unspecified'})`
    : 'Not assessed';

  // Triage badge styles
  const getTriageStyle = (level) => {
    switch (level) {
      case 'EMERGENCY':
        return {
          bg: 'bg-rose-50/90 border-rose-200 text-rose-900',
          badge: 'bg-rose-600 text-white',
          glow: 'shadow-soft',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50/90 border-orange-200 text-orange-900',
          badge: 'bg-orange-600 text-white',
          glow: 'shadow-soft',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50/90 border-amber-200 text-amber-900',
          badge: 'bg-amber-500 text-slate-900',
          glow: 'shadow-soft',
        };
      default:
        return {
          bg: 'bg-teal-50/90 border-teal-200 text-teal-900',
          badge: 'bg-teal-600 text-white',
          glow: 'shadow-soft-teal',
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
Severity: ${severityLabel}
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
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Clinical Health Screening Report</h2>
              <p className="text-xs text-slate-500">
                Report ID: <span className="font-mono text-slate-700 font-semibold">{id}</span> • Generated {new Date(timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopySummary}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-soft-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={() => exportReportToPDF(report)}
            className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-soft-teal transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onStartNewCall}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-soft-indigo transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Call</span>
          </button>
        </div>
      </div>

      {/* Triage Alert Banner */}
      <div className={`p-6 rounded-3xl border ${triageStyle.bg} ${triageStyle.glow} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${triageStyle.badge}`}>
              Triage Level: {riskLevel}
            </span>
            <span className="text-sm font-bold text-slate-800">
              Recommended Urgency: {triageAssessment?.recommendedUrgency || 'Next Day Clinic'}
            </span>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span>Intake Completion:</span>
            <span className="font-bold text-slate-800 capitalize">{completionStatus}</span>
            <div className="w-16 bg-slate-200 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span>{completionPercentage}%</span>
          </div>
        </div>

        {/* Clinical Rationale */}
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">
            Clinical Triage Rationale:
          </span>
          <p className="text-sm leading-relaxed text-slate-700">
            {triageAssessment?.clinicalRationale || 'Intake screening completed with stable vital parameters.'}
          </p>
        </div>

        {/* Red Flags if any */}
        {triageAssessment?.identifiedRedFlags && triageAssessment.identifiedRedFlags.length > 0 && (
          <div className="mt-3 p-3.5 rounded-2xl bg-rose-100/70 border border-rose-300 text-xs text-rose-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
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
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">1. Patient Profile</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Name</span>
              <span className="text-sm font-bold text-slate-800">{patientInfo.name || 'Anonymous Caller'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Language</span>
              <span className="text-sm font-bold text-slate-800">{patientInfo.preferredLanguage || 'English'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Call Duration</span>
              <span className="text-sm font-mono font-bold text-slate-700">{callDurationSeconds} seconds</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Screening Turns</span>
              <span className="text-sm font-mono font-bold text-slate-700">{totalTurns} turns</span>
            </div>
          </div>
        </div>

        {/* Section 2: Chief Complaint & Present Illness (HPI) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HeartPulse className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">2. Chief Complaint & HPI</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Primary Symptom</span>
              <span className="text-sm font-bold text-indigo-700">{chiefComplaint.primarySymptom || 'Not specified'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Onset / Duration</span>
                <span className="text-xs font-semibold text-slate-700">{historyOfPresentIllness.onsetAndDuration || 'Not stated'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Severity Rating</span>
                <span className="text-xs font-bold text-amber-700">
                  {severityLabel}
                </span>
              </div>
            </div>

            {historyOfPresentIllness.symptomCharacteristics && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Character:</span> {historyOfPresentIllness.symptomCharacteristics}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Section 3: Associated Symptoms & Medical Background */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Activity className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">3. Symptoms & Clinical History</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          {/* Associated Symptoms */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Associated Symptoms</span>
            <div className="flex flex-wrap gap-1.5">
              {associatedSymptoms.length > 0 ? (
                associatedSymptoms.map((sym, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-xs">
                    + {sym}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">None reported</span>
              )}
            </div>
          </div>

          {/* Known Conditions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Known Medical Conditions</span>
            <div className="flex flex-wrap gap-1.5">
              {medicalBackground.knownConditions && medicalBackground.knownConditions.length > 0 ? (
                medicalBackground.knownConditions.map((cond, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    {cond}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">None reported</span>
              )}
            </div>
          </div>

          {/* Allergies & Meds */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Allergies & Current Meds</span>
            <div className="flex flex-wrap gap-1.5">
              {medicalBackground.knownAllergies && medicalBackground.knownAllergies.length > 0 ? (
                medicalBackground.knownAllergies.map((alg, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                    ⚠️ {alg}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No known allergies (NKDA)</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Section 4: Physician's Structured Clinical SBAR Note */}
      {doctorClinicalNote && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">4. Physician's Clinical SBAR Summary</h3>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-sans italic bg-slate-50 p-4 rounded-2xl border border-slate-200">
            "{doctorClinicalNote}"
          </p>
        </div>
      )}

      {/* Section 5: Recommended Next Steps */}
      {recommendedActionItems && recommendedActionItems.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">5. Recommended Clinical Action Items</h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            {recommendedActionItems.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 6: Collapsible Full Conversation Transcript */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900"
        >
          <span>View Full Audited Call Transcript ({transcript.length} turns)</span>
          {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTranscript && (
          <div className="mt-4 space-y-3 pt-4 border-t border-slate-100 max-h-96 overflow-y-auto pr-2">
            {transcript.map((msg, index) => (
              <div
                key={index}
                className={`p-3.5 rounded-2xl text-xs ${
                  msg.role === 'assistant'
                    ? 'bg-slate-50 border border-slate-200 text-slate-800'
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
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
