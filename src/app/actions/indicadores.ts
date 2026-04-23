"use server";

import { db } from "@/db";
import { 
  cqSurgeries, cqSpecialties, cqInterventionTypes, cqSurgeryInterventions
} from "@/db/schema";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

export async function fetchIndicatorsReport(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 1. Obtener todas las especialidades activas
    const specialties = await db.select().from(cqSpecialties).where(eq(cqSpecialties.isActive, true));

    // 2. Obtener todas las cirugías del rango
    const surgeries = await db.select({
        id: cqSurgeries.id,
        specialtyId: cqSurgeries.specialtyId,
        urgencyType: cqSurgeries.urgencyType,
        status: cqSurgeries.status,
        isDeathByEmergency: cqSurgeries.isDeathByEmergency
    })
    .from(cqSurgeries)
    .where(and(
        gte(cqSurgeries.scheduledDate, startDate),
        lte(cqSurgeries.scheduledDate, endDate)
    ));

    // 3. Obtener intervenciones de LU y AMEU para estas cirugías
    const surgeryIds = surgeries.map(s => s.id);
    let luAmeuMap: Record<string, { isLU: boolean, isAMEU: boolean }> = {};

    if (surgeryIds.length > 0) {
        const interventions = await db.select({
            surgeryId: cqSurgeryInterventions.surgeryId,
            name: cqInterventionTypes.name
        })
        .from(cqSurgeryInterventions)
        .innerJoin(cqInterventionTypes, eq(cqSurgeryInterventions.interventionId, cqInterventionTypes.id))
        .where(and(
            inArray(cqSurgeryInterventions.surgeryId, surgeryIds),
            inArray(cqInterventionTypes.name, ['LEGRADO UTERINO', 'ASPIRACIÓN MANUAL ENDOUTERINA'])
        ));

        interventions.forEach(int => {
            if (!luAmeuMap[int.surgeryId]) luAmeuMap[int.surgeryId] = { isLU: false, isAMEU: false };
            if (int.name === 'LEGRADO UTERINO') luAmeuMap[int.surgeryId].isLU = true;
            if (int.name === 'ASPIRACIÓN MANUAL ENDOUTERINA') luAmeuMap[int.surgeryId].isAMEU = true;
        });
    }

    // 4. Procesar y agrupar
    const report = specialties.map(spec => {
        const specSurgeries = surgeries.filter(s => s.specialtyId === spec.id);
        
        const prog = specSurgeries.filter(s => s.urgencyType === 'ELECTIVO' && s.status !== 'cancelled').length;
        const susp = specSurgeries.filter(s => s.status === 'cancelled').length;
        const emg = specSurgeries.filter(s => s.urgencyType === 'EMERGENCIA' && s.status !== 'cancelled').length;
        const muerteEmer = specSurgeries.filter(s => s.isDeathByEmergency).length;
        
        // LU y AMEU (Normalmente son Ginecología, pero filtramos por intervención en cualquier especialidad por seguridad)
        const luProg = specSurgeries.filter(s => s.urgencyType === 'ELECTIVO' && luAmeuMap[s.id]?.isLU).length;
        const luEmer = specSurgeries.filter(s => s.urgencyType === 'EMERGENCIA' && luAmeuMap[s.id]?.isLU).length;
        const ameuProg = specSurgeries.filter(s => s.urgencyType === 'ELECTIVO' && luAmeuMap[s.id]?.isAMEU).length;
        const ameuEmer = specSurgeries.filter(s => s.urgencyType === 'EMERGENCIA' && luAmeuMap[s.id]?.isAMEU).length;

        const totalEfectivas = prog + emg; // Según lógica de imagen, efectivas son las realizadas
        const total = totalEfectivas + susp;

        return {
            especialidad: spec.name,
            prog,
            susp,
            emg,
            muerteEmer,
            luProg,
            luEmer,
            ameuProg,
            ameuEmer,
            totalEfectivas,
            total
        };
    });

    return report;
}
