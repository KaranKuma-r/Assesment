import { jsPDF } from 'jspdf';

export function exportReportToPDF(report) {
  if (!report) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 15;
  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // navy-900
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(45, 212, 191); // teal-400
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AURAHEALTH AI - CLINICAL INTAKE REPORT', margin, 14);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report ID: ${report.id}  |  Date: ${new Date(report.timestamp).toLocaleString()}  |  Duration: ${report.callDurationSeconds || 0}s`, margin, 22);

  y = 38;

  // Triage Banner Box
  const risk = report.triageAssessment?.riskLevel || 'MODERATE';
  if (risk === 'EMERGENCY') {
    doc.setFillColor(254, 226, 226); // red-100
    doc.setDrawColor(239, 68, 68);
    doc.setTextColor(185, 28, 28);
  } else if (risk === 'HIGH') {
    doc.setFillColor(255, 237, 213); // orange-100
    doc.setDrawColor(249, 115, 22);
    doc.setTextColor(194, 65, 12);
  } else if (risk === 'MODERATE') {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11);
    doc.setTextColor(180, 83, 9);
  } else {
    doc.setFillColor(209, 250, 229); // green-100
    doc.setDrawColor(16, 185, 129);
    doc.setTextColor(4, 120, 87);
  }

  doc.roundedRect(margin, y, 180, 18, 2, 2, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`TRIAGE RISK LEVEL: ${risk}  |  RECOMMENDED URGENCY: ${report.triageAssessment?.recommendedUrgency || 'Next Day Clinic'}`, margin + 4, y + 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Completion Status: ${(report.completionStatus || 'Complete').toUpperCase()} (${report.completionPercentage ?? 95}% complete)`, margin + 4, y + 13);

  y += 24;

  // Patient Demographics Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Patient Demographics & Intake Details', margin, y);
  y += 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Patient Name: ${report.patientInfo?.name || 'Anonymous Caller'}`, margin, y);
  doc.text(`Preferred Language: ${report.patientInfo?.preferredLanguage || 'English'}`, margin + 90, y);
  y += 5;
  doc.text(`Estimated Age: ${report.patientInfo?.estimatedAge || 'Adult'}`, margin, y);
  doc.text(`Total Screening Turns: ${report.totalTurns || 0}`, margin + 90, y);
  y += 8;

  // Chief Complaint & History of Present Illness (HPI)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Chief Complaint & History of Present Illness (HPI)', margin, y);
  y += 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Primary Symptom: ${report.chiefComplaint?.primarySymptom || 'Not specified'}`, margin, y);
  y += 5;
  doc.text(`Onset & Duration: ${report.historyOfPresentIllness?.onsetAndDuration || 'Not specified'}`, margin, y);
  y += 5;
  const severityScore = report.historyOfPresentIllness?.severityScore;
  const severityLabel = Number.isFinite(severityScore) && severityScore > 0
    ? `${severityScore}/10 (${report.historyOfPresentIllness?.severityClassification || 'Unspecified'})`
    : 'Not assessed';
  doc.text(`Pain/Discomfort Severity: ${severityLabel}`, margin, y);
  y += 5;
  if (report.historyOfPresentIllness?.symptomCharacteristics) {
    doc.text(`Characteristics: ${report.historyOfPresentIllness.symptomCharacteristics}`, margin, y);
    y += 5;
  }
  y += 3;

  // Associated Symptoms & Medical Background
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Associated Symptoms & Background', margin, y);
  y += 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const symptoms = (report.associatedSymptoms || []).join(', ') || 'None reported';
  doc.text(`Associated Symptoms: ${symptoms}`, margin, y);
  y += 5;
  const conditions = (report.medicalBackground?.knownConditions || []).join(', ') || 'None reported';
  doc.text(`Known Conditions: ${conditions}`, margin, y);
  y += 5;
  const allergies = (report.medicalBackground?.knownAllergies || []).join(', ') || 'No known allergies';
  doc.text(`Allergies: ${allergies}`, margin, y);
  y += 8;

  // Clinical Triage Rationale & Red Flags
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Clinical Triage Assessment & Rationale', margin, y);
  y += 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const rationaleLines = doc.splitTextToSize(report.triageAssessment?.clinicalRationale || 'Clinical screening completed.', 180);
  doc.text(rationaleLines, margin, y);
  y += rationaleLines.length * 4.5 + 4;

  // Doctor Clinical Notes
  if (report.doctorClinicalNote) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("5. Physician's Structured Clinical SBAR Note", margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(report.doctorClinicalNote, 180);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.2 + 4;
  }

  // Recommended Next Steps
  if (report.recommendedActionItems && report.recommendedActionItems.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('6. Recommended Action Items', margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    report.recommendedActionItems.forEach((action) => {
      doc.text(`• ${action}`, margin + 3, y);
      y += 4.5;
    });
  }

  // Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL MEDICAL INTAKE: This report was generated by AuraHealth AI Voice Screening System for pre-consultation triage. Final diagnosis requires evaluation by a licensed physician.', margin, 285);

  doc.save(`AuraHealth_Intake_Report_${report.id}.pdf`);
}
