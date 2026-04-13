const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

// 1. In createSurgery & editSurgery: Input splitting
code = code.replace(/const patientIdRaw = formData\.get\("patient_id"\) as string;\r?\n\s*const patientId = patientIdRaw \? patientIdRaw\.trim\(\) : "";/g, 
'const patientUuidRaw = formData.get("patient_uuid") as string;\n    const patientUuid = patientUuidRaw ? patientUuidRaw.trim() : "";\n    const patientDniRaw = formData.get("patient_dni") as string;\n    const patientDni = patientDniRaw ? patientDniRaw.trim() : "";\n    const validDni = /^\\\\d{8}$/.test(patientDni) ? patientDni : null;');

// Fix the validation lines
code = code.replace(/if \(!patientId \|\| !scheduledDateStr/g, 'if ((!patientUuid && !patientDni) || !scheduledDateStr');
code = code.replace(/if \(!id \|\| !patientId \|\|/g, 'if (!id || (!patientUuid && !patientDni) ||');

// 2. Fix the Identity vault block using robust Regex matching
code = code.replace(/eq\(cqPatientPii\.dni, patientId\)/g, 'eq(cqPatientPii.dni, patientDni)');
code = code.replace(/eq\(cqPatientPii\.historiaClinica, patientId\)/g, 'eq(cqPatientPii.historiaClinica, patientDni)');
code = code.replace(/eq\(cqPatientPii\.carnetExtranjeria, patientId\)/g, 'eq(cqPatientPii.carnetExtranjeria, patientDni)');
code = code.replace(/eq\(cqPatientPii\.pasaporte, patientId\)/g, 'eq(cqPatientPii.pasaporte, patientDni)');

code = code.replace(/let pHistoriaClinica = patientId;/g, 'let pHistoriaClinica = validDni || null;');
code = code.replace(/dni: patientId,/g, 'dni: validDni,');
code = code.replace(/dni: patientId, \/\/ saving the DNI text here/g, 'dni: validDni,');
code = code.replace(/historiaClinica: pHistoriaClinica,/g, 'historiaClinica: pHistoriaClinica || validDni,');

// Update patientId mapper to PatientDni fallback
code = code.replace(/let finalPatientId: string;/g, 'let finalPatientId: string | null = null;\n    if (patientUuid) { const res = await db.select().from(cqPatientPii).where(eq(cqPatientPii.patientId, patientUuid)).limit(1); if (res.length > 0) finalPatientId = res[0].patientId; }');
code = code.replace(/const existingPii = await db\.select\(\)\.from\(cqPatientPii\)\.where\(/g, 'const existingPii = finalPatientId ? [] : await db.select().from(cqPatientPii).where(');

// Also reapply fix for diagnoses and procedures pivots!
code = code.replace('return surgeries.map(s => ({\r\n        ...s,\r\n        team: teams.filter(t => t.surgeryId === s.surgery.id)\r\n    }));', 'const dxs = await db.select({ surgeryId: cqSurgeryDiagnoses.surgeryId, diagnosisId: cqSurgeryDiagnoses.diagnosisId }).from(cqSurgeryDiagnoses).where(inArray(cqSurgeryDiagnoses.surgeryId, surgeryIds)); const procs = await db.select({ surgeryId: cqSurgeryProcedures.surgeryId, procedureId: cqSurgeryProcedures.procedureId }).from(cqSurgeryProcedures).where(inArray(cqSurgeryProcedures.surgeryId, surgeryIds)); return surgeries.map(s => ({ ...s, team: teams.filter(t => t.surgeryId === s.surgery.id), diagnoses: dxs.filter(d => d.surgeryId === s.surgery.id).map(d => d.diagnosisId), procedures: procs.filter(p => p.surgeryId === s.surgery.id).map(p => p.procedureId) }));');
code = code.replace('return surgeries.map(s => ({\n        ...s,\n        team: teams.filter(t => t.surgeryId === s.surgery.id)\n    }));', 'const dxs = await db.select({ surgeryId: cqSurgeryDiagnoses.surgeryId, diagnosisId: cqSurgeryDiagnoses.diagnosisId }).from(cqSurgeryDiagnoses).where(inArray(cqSurgeryDiagnoses.surgeryId, surgeryIds)); const procs = await db.select({ surgeryId: cqSurgeryProcedures.surgeryId, procedureId: cqSurgeryProcedures.procedureId }).from(cqSurgeryProcedures).where(inArray(cqSurgeryProcedures.surgeryId, surgeryIds)); return surgeries.map(s => ({ ...s, team: teams.filter(t => t.surgeryId === s.surgery.id), diagnoses: dxs.filter(d => d.surgeryId === s.surgery.id).map(d => d.diagnosisId), procedures: procs.filter(p => p.surgeryId === s.surgery.id).map(p => p.procedureId) }));');

fs.writeFileSync('src/app/actions/cirugias.ts', code);
console.log('REPLACEMENTS APPLIED!');
