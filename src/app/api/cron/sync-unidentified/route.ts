import { NextResponse } from "next/server";
import { db } from "@/db";
import { cqPatientPii, cqPatients } from "@/db/schema";
import { eq, or, ilike } from "drizzle-orm";

export const dynamic = "force-dynamic";

const parseLocalDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const baseDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    return new Date(`${baseDateStr}T12:00:00`);
};

const sanitizeHc = (hcRaw: string | null | undefined): string | null => {
    if (!hcRaw) return null;
    const trimmed = hcRaw.trim();
    if (!trimmed) return null;
    const firstToken = trimmed.split(/\s+/)[0];
    return firstToken.substring(0, 50);
};

export async function GET(request: Request) {
    try {
        console.log("[CRON] Iniciando tarea de sincronización de pacientes 'NO IDENTIFICADO'...");

        // 1. Obtener pacientes locales con anomalías en su nombre/apellido
        const patients = await db
            .select({
                id: cqPatients.id,
                dni: cqPatientPii.dni,
                nombres: cqPatientPii.nombres,
                apellidos: cqPatientPii.apellidos
            })
            .from(cqPatientPii)
            .innerJoin(cqPatients, eq(cqPatientPii.patientId, cqPatients.id))
            .where(
                or(
                    eq(cqPatientPii.nombres, "NO IDENTIFICADO"),
                    eq(cqPatientPii.apellidos, "NO IDENTIFICADO"),
                    ilike(cqPatientPii.nombres, "%NO IDENTIFICADO%"),
                    ilike(cqPatientPii.apellidos, "%NO IDENTIFICADO%")
                )
            )
            .limit(50); // Límite de seguridad para evitar sobrecargar la pasarela API

        if (patients.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No se encontraron pacientes 'NO IDENTIFICADO' pendientes de sincronizar."
            });
        }

        const apiUrl = process.env.API_NETHOS_URL || "http://192.168.41.25:3010";
        const synced = [];
        const failed = [];

        for (const patient of patients) {
            const dni = patient.dni;
            if (!dni) continue;

            try {
                const response = await fetch(`${apiUrl}/api/pacientes/search?documento=${dni}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    // timeout corto por si el endpoint de NETHOS tarda en responder
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    const data = await response.json();
                    let externalPatientData = null;

                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                        externalPatientData = data.data[0];
                    } else if (data.data && !Array.isArray(data.data) && data.data.nombres) {
                        externalPatientData = data.data;
                    }

                    if (externalPatientData && externalPatientData.nombres && externalPatientData.nombres.toUpperCase() !== "NO IDENTIFICADO") {
                        const pName = (externalPatientData.nombres || "").trim();
                        const pLastName = [
                            (externalPatientData.apellidoPaterno || "").trim(),
                            (externalPatientData.apellidoMaterno || "").trim()
                        ].filter(Boolean).join(" ");
                        
                        let sexo = null;
                        if (externalPatientData.sexo === "M" || externalPatientData.sexo === "Masculino") sexo = "Masculino";
                        else if (externalPatientData.sexo === "F" || externalPatientData.sexo === "Femenino") sexo = "Femenino";

                        const fechaNac = externalPatientData.fechaNacimiento ? parseLocalDate(externalPatientData.fechaNacimiento) : null;
                        const ubi = externalPatientData.codigoInei ? externalPatientData.codigoInei.toString().trim() : null;
                        const pDireccion = externalPatientData.direccion ? (externalPatientData.direccion || "").trim() : null;
                        const pHistoriaClinica = externalPatientData.observacion ? (sanitizeHc(externalPatientData.observacion) || dni) : dni;

                        // Ejecutar actualización
                        await db.transaction(async (tx) => {
                            await tx.update(cqPatients)
                                .set({
                                    fechaNacimiento: fechaNac,
                                    sexo: sexo,
                                    ubigeo: ubi,
                                    updatedAt: new Date()
                                })
                                .where(eq(cqPatients.id, patient.id));

                            await tx.update(cqPatientPii)
                                .set({
                                    nombres: pName,
                                    apellidos: pLastName,
                                    historiaClinica: pHistoriaClinica,
                                    direccion: pDireccion
                                })
                                .where(eq(cqPatientPii.patientId, patient.id));
                        });

                        console.log(`[CRON] Paciente DNI ${dni} auto-sincronizado a ${pName} ${pLastName}`);
                        synced.push({ dni, nombres: pName, apellidos: pLastName });
                    }
                } else {
                    failed.push({ dni, reason: `API NetHos retornó estatus: ${response.status}` });
                }
            } catch (err: any) {
                console.error(`[CRON] Error sincronizando paciente DNI ${dni}:`, err);
                failed.push({ dni, reason: err.message || "Error de red" });
            }
        }

        return NextResponse.json({
            success: true,
            totalFound: patients.length,
            totalSynced: synced.length,
            synced,
            failed
        });

    } catch (error: any) {
        console.error("[CRON] Error general en el endpoint de sincronización:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
