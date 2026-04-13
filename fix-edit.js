const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

// 0. Only process editSurgery block!
const parts = code.split('export async function editSurgery(formData: FormData) {');
let head = parts[0];
let editSurg = 'export async function editSurgery(formData: FormData) {' + parts[1];

// 1. Replace legacy string parameter
editSurg = editSurg.replace(/const diagnosis = formData\.get\("diagnosis"\) as string;/,
'    const diagnosesIds = formData.getAll("diagnoses") as string[];\n    const proceduresIds = formData.getAll("procedures") as string[];');

// 2. Replace validation assertion
editSurg = editSurg.replace(/!diagnosis/, 'diagnosesIds.length === 0 || proceduresIds.length === 0');
editSurg = editSurg.replace(/\|\| !diagnosis \|\|/, '|| diagnosesIds.length === 0 || proceduresIds.length === 0 ||');

// 3. Inject resolution logic right before the update db call.
const resolutionLogic = `
    // Resolve deferred Synthetic IDs for Diagnoses (Late-bound DB Injection)
    const finalDiagnosisIds = [];
    for (const did of diagnosesIds) {
        if (did.startsWith('__api_dx__')) {
            const parts = did.replace('__api_dx__', '').split('|||');
            const code = parts[0];
            const name = parts.slice(1).join('|||');

            const existing = await db.select().from(cqDiagnoses).where(eq(cqDiagnoses.code, code)).limit(1);
            if (existing.length > 0) {
                finalDiagnosisIds.push(existing[0].id);
            } else {
                const [inserted] = await db.insert(cqDiagnoses).values({
                    code: code.substring(0, 20),
                    name: name,
                    isActive: true,
                    isVerifiedMinsa: true
                }).returning({ id: cqDiagnoses.id });
                if (inserted) finalDiagnosisIds.push(inserted.id);
            }
        } else {
            finalDiagnosisIds.push(did);
        }
    }

    // Resolve deferred Synthetic IDs for Procedures
    const finalProcedureIds = [];
    for (const pid of proceduresIds) {
        if (pid.startsWith('__api_proc__')) {
            const parts = pid.replace('__api_proc__', '').split('|||');
            const code = parts[0];
            const name = parts.slice(1).join('|||');

            const existing = await db.select().from(cqProcedures).where(eq(cqProcedures.code, code)).limit(1);
            if (existing.length > 0) {
                finalProcedureIds.push(existing[0].id);
            } else {
                const [inserted] = await db.insert(cqProcedures).values({
                    code: code.substring(0, 20),
                    name: name,
                    isActive: true,
                    isVerifiedMinsa: true
                }).returning({ id: cqProcedures.id });
                if (inserted) finalProcedureIds.push(inserted.id);
            }
        } else {
            finalProcedureIds.push(pid);
        }
    }

    const trueDiagnosesIds = [...new Set(finalDiagnosisIds)];
    const trueProceduresIds = [...new Set(finalProcedureIds)];

    let diagnosis = "";
    if (trueDiagnosesIds.length > 0) {
        const selectedDiags = await db.select().from(cqDiagnoses).where(inArray(cqDiagnoses.id, trueDiagnosesIds));
        diagnosis = selectedDiags.map(d => d.code + " - " + d.name).join(", ");
    }
    const finalUrgencyType = urgencyType || 'ELECTIVO';

    const roomId = operatingRoomId ? operatingRoomId : null;`;

editSurg = editSurg.replace(/const roomId = operatingRoomId \? operatingRoomId : null;/, resolutionLogic);

// 4. Inject Pivot Table Mapping at the END of editSurgery! 
const pivotMapping = `    await db.delete(cqSurgeryDiagnoses).where(eq(cqSurgeryDiagnoses.surgeryId, id));
    if (trueDiagnosesIds.length > 0) {
        await db.insert(cqSurgeryDiagnoses).values(
            trueDiagnosesIds.map(did => ({ surgeryId: id, diagnosisId: did }))
        );
    }

    await db.delete(cqSurgeryProcedures).where(eq(cqSurgeryProcedures.surgeryId, id));
    if (trueProceduresIds.length > 0) {
        await db.insert(cqSurgeryProcedures).values(
            trueProceduresIds.map(pid => ({ surgeryId: id, procedureId: pid }))
        );
    }

    revalidatePath("/dashboard/programaciones");
    return { success: true };\n`;

editSurg = editSurg.replace(/revalidatePath\(\"\/dashboard\/programaciones\"\);/, pivotMapping);
editSurg = editSurg.replace(/urgencyType: urgencyType \|\| 'ELECTIVO',/, 'urgencyType: finalUrgencyType,');

fs.writeFileSync('src/app/actions/cirugias.ts', head + editSurg);
console.log('EDIT SURGERY COMPELETLY UPGRADED!');
