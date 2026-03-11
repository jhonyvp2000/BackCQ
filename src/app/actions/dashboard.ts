"use server";

import { db } from "@/db";
import { cqOperatingRooms, cqSurgeries, cqPatients, cqPatientPii } from "@/db/schema";
import { sql, eq, and, inArray, desc } from "drizzle-orm";
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
    const activeSurgeries = await db.query.cqSurgeries.findMany({
        where: and(
            sql`DATE(scheduled_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') = ${todayStr}::date`,
            inArray(cqSurgeries.status, ['scheduled', 'in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'])
        ),
        with: {
            patient: {
                with: { pii: true }
            },
            operatingRoom: true
        },
        orderBy: (s, { asc }) => [asc(s.scheduledDate)],
        limit: 5
    });

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
            completedThisMonth: Number(completedMonthCount?.count || 0),
            totalPacientes: Number(pacientesCount?.count || 0)
        },
        activeSurgeries,
        latestPatients
    };
}
