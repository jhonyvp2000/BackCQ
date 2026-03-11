"use server";

import { db } from "@/db";
import { cqSurgicalReports, cqSurgeries, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function getSurgery(id: string) {
    const [data] = await db
        .select({
            surgery: cqSurgeries,
            patient: cqSurgeries.patientId, // Ideally this bridges to a patient catalog
        })
        .from(cqSurgeries)
        .where(eq(cqSurgeries.id, id));
    return data;
}

export async function getSurgicalReport(surgeryId: string) {
    const [data] = await db
        .select({
            report: cqSurgicalReports,
            surgeon: usersTable,
        })
        .from(cqSurgicalReports)
        .innerJoin(usersTable, eq(cqSurgicalReports.surgeonId, usersTable.id))
        .where(eq(cqSurgicalReports.surgeryId, surgeryId));
    return data;
}

export async function createSurgicalReport(formData: FormData) {
    const surgeryId = formData.get("surgery_id") as string;
    const surgeonId = formData.get("surgeon_id") as string; // Will come from NextAuth session
    const preOpDiagnosis = formData.get("pre_op_diagnosis") as string;
    const postOpDiagnosis = formData.get("post_op_diagnosis") as string;
    const surgicalProcedure = formData.get("surgical_procedure") as string;
    const findings = formData.get("findings") as string;
    const bloodLoss = formData.get("blood_loss") as string;
    const complications = formData.get("complications") as string;
    const file = formData.get("file") as File;

    if (!surgeryId || !surgeonId || !surgicalProcedure) {
        throw new Error("Missing mandatory fields for surgical report");
    }

    let documentUrl = null;

    // Upload PDF securely to Supabase Storage Bucket
    if (file && file.size > 0) {
        const ext = file.name.split('.').pop();
        const fileName = `${surgeryId}-reporte-${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('centroquirurgico')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase Storage Error:", uploadError);
            throw new Error("Al subir el documento adjunto al Bucket.");
        }

        // Get public URL (Assuming 'centroquirurgico' is a public bucket in this instance. For highly sensitive data it should be private with SignedUrls, but we follow standard Vercel ready structure for now).
        const { data: urlData } = supabase.storage
            .from('centroquirurgico')
            .getPublicUrl(fileName);

        documentUrl = urlData.publicUrl;
    }

    await db.insert(cqSurgicalReports).values({
        surgeryId,
        surgeonId,
        preOpDiagnosis,
        postOpDiagnosis,
        surgicalProcedure,
        findings,
        bloodLoss,
        complications,
        documentUrl,
    });

    revalidatePath(`/dashboard/programaciones/${surgeryId}/reporte`);
}
