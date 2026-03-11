"use server";

import { db } from "@/db";
import { cqOperatingRooms, cqSurgeries, cqPatients, cqPatientPii } from "@/db/schema";
import { sql, eq, and, inArray, desc, asc } from "drizzle-orm";
import { format } from "date-fns";

export async function getDashboardStats() {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const firstDayOfMonthStr = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');

    // 1. Estadísticas Generales
    // Salas
    const [salasCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cqOperatingRooms)
        .where(eq(cqOperatingRooms.status, 'available'));

    // Cirugías Hoy (En Progreso, Agendadas, etc) - Solo cuenta las no canceladas
    const todaySurgeries = await db
        .select({ status: cqSurgeries.status })
        .from(cqSurgeries)
        .where(sql`DATE(scheduled_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') = ${todayStr}::date`);

    const scheduledToday = todaySurgeries.filter(s => s.status === 'scheduled').length;
    const inProgressToday = todaySurgeries.filter(s => [
        'in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'
    ].includes(s.status)).length;
    const completedToday = todaySurgeries.filter(s => s.status === 'completed').length;
    const cancelledToday = todaySurgeries.filter(s => s.status === 'cancelled').length;

    // Mes actual completadas
    const [completedMonthCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cqSurgeries)
        .where(
            and(
                sql`DATE(scheduled_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') >= ${firstDayOfMonthStr}::date`,
                sql`DATE(scheduled_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') <= ${todayStr}::date`,
                eq(cqSurgeries.status, 'completed')
            )
        );

    // Total pacientes empadronados
    const [pacientesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cqPatients);

    // 2. Cirugías Activas / Próximas (Hoy)
    const _activeSurgeries = await db.select({
        surgery: cqSurgeries,
        operatingRoom: cqOperatingRooms,
        patientPii: cqPatientPii,
    })
        .from(cqSurgeries)
        .leftJoin(cqOperatingRooms, eq(cqSurgeries.operatingRoomId, cqOperatingRooms.id))
        .leftJoin(cqPatientPii, eq(cqSurgeries.patientId, cqPatientPii.patientId))
        .where(
            and(
                sql`DATE(scheduled_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') = ${todayStr}::date`,
                inArray(cqSurgeries.status, ['scheduled', 'in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'])
            )
        )
        .orderBy(asc(cqSurgeries.scheduledDate))
        .limit(5);

    const activeSurgeries = _activeSurgeries.map(row => ({
        id: row.surgery.id,
        scheduledDate: row.surgery.scheduledDate,
        status: row.surgery.status,
        urgencyType: row.surgery.urgencyType,
        diagnosis: row.surgery.diagnosis,
        operatingRoom: row.operatingRoom,
        patient: { pii: row.patientPii }
    }));

    // 3. Últimos Pacientes Empadronados
    const latestPatients = await db
        .select({
            id: cqPatients.id,
            createdAt: cqPatients.createdAt,
            sexo: cqPatients.sexo,
            nombres: cqPatientPii.nombres,
            apellidos: cqPatientPii.apellidos,
            dni: cqPatientPii.dni,
            hc: cqPatientPii.historiaClinica
        })
        .from(cqPatients)
        .innerJoin(cqPatientPii, eq(cqPatients.id, cqPatientPii.patientId))
        .orderBy(desc(cqPatients.createdAt))
        .limit(4);

    return {
        stats: {
            salasAvailable: Number(salasCount?.count || 0),
            scheduledToday,
            inProgressToday,
            completedToday,
            cancelledToday,
            completedThisMonth: Number(completedMonthCount?.count || 0),
            totalPacientes: Number(pacientesCount?.count || 0)
        },
        activeSurgeries,
        latestPatients
    };
}
