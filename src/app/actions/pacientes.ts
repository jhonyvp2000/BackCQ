"use server";

import { db } from "@/db";
import { cqPatientPii, cqPatients, cqSurgeries } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function lookupPatientByDni(dni: string) {
    if (!dni || dni.length < 8) return null;

    try {
        const result = await db.select().from(cqPatientPii).where(
            or(
                eq(cqPatientPii.dni, dni),
                eq(cqPatientPii.historiaClinica, dni)
            )
        );

        if (result.length > 0) {
            return {
                found: true,
                fullName: `${result[0].nombres} ${result[0].apellidos}`,
                source: 'Registro Local CQ (Bóveda)'
            };
        }

        // --- Mocking RENIEC call for demonstration ---
        await new Promise(resolve => setTimeout(resolve, 600));

        if (dni === "09791568") {
            return { found: true, fullName: "Jhony Vela Paredes", source: 'RENIEC API' };
        } else if (dni === "12345678") {
            return { found: true, fullName: "Paciente de Prueba RENIEC", source: 'RENIEC API' };
        }

        return { found: false, source: null };
    } catch (error) {
        console.error("Error looking up DNI:", error);
        return { found: false, source: null };
    }
}

export async function getPacientes() {
    try {
        const result = await db
            .select({
                patient: cqPatients,
                pii: cqPatientPii
            })
            .from(cqPatients)
            .leftJoin(cqPatientPii, eq(cqPatients.id, cqPatientPii.patientId))
            .orderBy(cqPatients.createdAt);

        return result.map(r => ({
            ...r.patient,
            pii: r.pii
        })).reverse();
    } catch (error) {
        console.error("Error fetching patients:", error);
        return [];
    }
}

export async function createPaciente(formData: FormData) {
    const dni = formData.get("dni") as string;
    const carnetExtranjeria = formData.get("carnetExtranjeria") as string;
    const pasaporte = formData.get("pasaporte") as string;
    const nombres = formData.get("nombres") as string;
    const apellidos = formData.get("apellidos") as string;
    const sexo = formData.get("sexo") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;
    const historiaClinica = formData.get("historiaClinica") as string;
    const ubigeo = formData.get("ubigeo") as string;

    if (!nombres || !apellidos) {
        throw new Error("Nombres y apellidos son requeridos");
    }

    if (!dni && !carnetExtranjeria && !pasaporte) {
        throw new Error("Se requiere al menos un documento de identidad (DNI, C. Extranjería o Pasaporte/Otro)");
    }

    try {
        await db.transaction(async (tx) => {
            const [newPatient] = await tx.insert(cqPatients).values({
                sexo: sexo || null,
                fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
                ubigeo: ubigeo || null,
            }).returning();

            await tx.insert(cqPatientPii).values({
                patientId: newPatient.id,
                nombres,
                apellidos,
                dni: dni || null,
                carnetExtranjeria: carnetExtranjeria || null,
                pasaporte: pasaporte || null,
                historiaClinica: historiaClinica || null
            });
        });

        revalidatePath("/dashboard/pacientes");
        revalidatePath("/dashboard/programaciones");
    } catch (error: any) {
        console.error("Error creating patient:", error);
        throw new Error("Error interno. Es probable que el DNI o HC ya existan.");
    }
}

export async function updatePaciente(id: string, formData: FormData) {
    const dni = formData.get("dni") as string;
    const carnetExtranjeria = formData.get("carnetExtranjeria") as string;
    const pasaporte = formData.get("pasaporte") as string;
    const nombres = formData.get("nombres") as string;
    const apellidos = formData.get("apellidos") as string;
    const sexo = formData.get("sexo") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;
    const historiaClinica = formData.get("historiaClinica") as string;
    const ubigeo = formData.get("ubigeo") as string;

    if (!nombres || !apellidos) {
        throw new Error("Nombres y apellidos son requeridos");
    }

    if (!dni && !carnetExtranjeria && !pasaporte) {
        throw new Error("Se requiere al menos un documento de identidad (DNI, C. Extranjería o Pasaporte/Otro)");
    }

    try {
        await db.transaction(async (tx) => {
            await tx.update(cqPatients).set({
                sexo: sexo || null,
                fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
                ubigeo: ubigeo || null,
                updatedAt: new Date()
            }).where(eq(cqPatients.id, id));

            await tx.update(cqPatientPii).set({
                nombres,
                apellidos,
                dni: dni || null,
                carnetExtranjeria: carnetExtranjeria || null,
                pasaporte: pasaporte || null,
                historiaClinica: historiaClinica || null
            }).where(eq(cqPatientPii.patientId, id));
        });

        revalidatePath("/dashboard/pacientes");
        revalidatePath("/dashboard/programaciones");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating patient:", error);
        if (error.code === '23505') {
            return { success: false, message: "Ya existe otro paciente con este DNI o Historia Clínica." };
        }
        return { success: false, message: "Error interno al actualizar paciente" };
    }
}

export async function deletePaciente(id: string) {
    try {
        const historyCheck = await db.select().from(cqSurgeries).where(eq(cqSurgeries.patientId, id)).limit(1);

        if (historyCheck.length > 0) {
            return {
                success: false,
                message: "Imposible eliminar. El paciente tiene cirugías asociadas a su historia clínica."
            };
        }

        await db.delete(cqPatients).where(eq(cqPatients.id, id));

        revalidatePath("/dashboard/pacientes");
        revalidatePath("/dashboard/programaciones");
        return { success: true };
    } catch (error) {
        console.error("Error deleting patient:", error);
        return { success: false, message: "Error interno al intentar eliminar" };
    }
}
