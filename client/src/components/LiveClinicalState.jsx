import React from 'react';
import { User, Stethoscope, Clock, Zap, PlusCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const STAGE_LABELS = {
  greeting: '1. Greeting & Identity',
  patient_name: '1. Patient Demographics',
  main_concern: '2. Chief Complaint',
  duration: '3. Onset & Timeline',
  severity: '4. Severity & Character',
  associated_symptoms: '5. Associated Symptoms',
  history_and_safety: '6. Medical Background',
  wrap_up: '7. Clinical Review',
};

export function LiveClinicalState({ screeningState }) {
  const {
    patientName,
    mainConcern,
    duration,
    severity,
    associatedSymptoms = [],
    medicalHistory = [],
    allergies = [],
    stage = 'greeting',
    isComplete
  } = screeningState;

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Live Clinical Intake State</h3>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30">
          {STAGE_LABELS[stage] || 'Intake Active'}
        </span>
      </div>

      {/* Extracted Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        
        {/* Patient Name */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
          <User className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Patient Name</span>
            <p className="font-medium text-slate-200 mt-0.5">
              {patientName ? <span className="text-brand-300 font-semibold">{patientName}</span> : <span className="text-slate-500 italic">Listening for name...</span>}
            </p>
          </div>
        </div>

        {/* Chief Concern */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
          <Stethoscope className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Chief Complaint</span>
            <p className="font-medium text-slate-200 mt-0.5">
              {mainConcern ? <span className="text-indigo-300 font-semibold">{mainConcern}</span> : <span className="text-slate-500 italic">Assessing primary symptom...</span>}
            </p>
          </div>
        </div>

        {/* Duration */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Onset & Duration</span>
            <p className="font-medium text-slate-200 mt-0.5">
              {duration ? <span className="text-amber-300 font-semibold">{duration}</span> : <span className="text-slate-500 italic">Awaiting timeline...</span>}
            </p>
          </div>
        </div>

        {/* Severity */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Severity Rating</span>
            <p className="font-medium text-slate-200 mt-0.5">
              {severity ? <span className="text-rose-300 font-semibold">{severity}</span> : <span className="text-slate-500 italic">Awaiting pain scale (1-10)...</span>}
            </p>
          </div>
        </div>

      </div>

      {/* Associated Symptoms Tags */}
      <div>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1.5">
          Associated Symptoms Identified:
        </span>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {associatedSymptoms.length > 0 ? (
            associatedSymptoms.map((sym, i) => (
              <span
                key={i}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
              >
                + {sym}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">No secondary symptoms recorded yet</span>
          )}
        </div>
      </div>

      {/* Progress Footer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Real-time Structured Clinical State Tracking</span>
        </div>
        {isComplete && (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Report
          </span>
        )}
      </div>

    </div>
  );
}
