import nodemailer from "nodemailer";

interface SurgeryEmailPayload {
    recipientEmail: string;
    recipientName: string;
    roleInSurgery: string;
    patientFullName: string;
    patientDni: string;
    scheduledDateStr: string; // HH:mm - dd/MM/yyyy
    roomName: string;
    diagnosis: string;
    interventionName: string;
    isUpdate?: boolean;
}

export async function sendSurgeryEmailNotification(payload: SurgeryEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const smtpUser = process.env.SMTP_USER || "";
        const smtpPass = process.env.SMTP_PASS || "";
        const smtpFrom = process.env.SMTP_FROM || `"Centro Quirúrgico - Hospital II-2 Tarapoto" <notificaciones@hospitalii2tarapoto.gob.pe>`;

        if (!payload.recipientEmail || !payload.recipientEmail.includes("@")) {
            console.log(`[EmailService] Omisió: Email no válido o ausente para ${payload.recipientName}`);
            return { success: false, error: "Email no válido o ausente" };
        }

        // Si no se han configurado credenciales en .env, loguear simulacro transparente
        if (!smtpUser || !smtpPass) {
            console.log(`[EmailService - SIMULACRO NOTIFICACIÓN CORREO]`);
            console.log(`Para: ${payload.recipientName} <${payload.recipientEmail}>`);
            console.log(`Asunto: ${payload.isUpdate ? '🔄 REPROGRAMACIÓN DE CIRUGÍA' : '🏥 NOTIFICACIÓN DE CIRUGÍA PROGRAMADA'}`);
            console.log(`Rol: ${payload.roleInSurgery} | Quirófano: ${payload.roomName} | Fecha/Hora: ${payload.scheduledDateStr}`);
            console.log(`Paciente: ${payload.patientFullName} (DNI: ${payload.patientDni})`);
            return { success: true, messageId: `mock-msg-${Date.now()}` };
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const subjectAction = payload.isUpdate ? "🔄 ACTUALIZACIÓN DE CIRUGÍA" : "🏥 ASIGNACIÓN DE CIRUGÍA PROGRAMADA";
        const subject = `${subjectAction} — ${payload.roomName} (${payload.scheduledDateStr})`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
                    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                    .header { background: #1e3a8a; color: #ffffff; padding: 24px; text-align: center; }
                    .header h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
                    .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; }
                    .body { padding: 24px; }
                    .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 16px; }
                    .item { margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
                    .item strong { color: #0f172a; font-weight: 700; }
                    .box { background: #f1f5f9; padding: 16px; border-radius: 12px; border-left: 4px solid #2563eb; margin: 16px 0; }
                    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <h1>HOSPITAL II-2 TARAPOTO</h1>
                        <p>CENTRO QUIRÚRGICO — SISTEMA BACKCQ</p>
                    </div>
                    <div class="body">
                        <p style="font-size: 14px; font-weight: 700;">Estimado(a) Dr(a). ${payload.recipientName},</p>
                        <p style="font-size: 13px; color: #475569;">
                            ${payload.isUpdate ? 'Se han actualizado los detalles de la programación médica en la cual participas:' : 'Se te ha asignado una nueva intervención quirúrgica en la agenda central del Hospital II-2 Tarapoto:'}
                        </p>

                        <div class="badge">
                            ROLI ASIGNADO: ${payload.roleInSurgery.toUpperCase()}
                        </div>

                        <div class="box">
                            <div class="item"><strong>🗓️ Fecha y Hora:</strong> ${payload.scheduledDateStr}</div>
                            <div class="item"><strong>🏛️ Quirófano / Sala:</strong> ${payload.roomName}</div>
                            <div class="item"><strong>👤 Paciente:</strong> ${payload.patientFullName} (DNI: ${payload.patientDni})</div>
                            <div class="item"><strong>📋 Diagnóstico:</strong> ${payload.diagnosis}</div>
                            <div class="item"><strong>🔪 Intervención:</strong> ${payload.interventionName}</div>
                        </div>

                        <p style="font-size: 12px; color: #64748b;">
                            Por favor ingresar al sistema BackCQ para revisar la ficha quirúrgica completa o gestionar los registros asistenciales.
                        </p>
                    </div>
                    <div class="footer">
                        Este es un mensaje automático generado por el Sistema de Gestión Quirúrgica BackCQ.<br>
                        MINISTERIO DE SALUD — OGESS ESPECIALIZADA / SAN MARTÍN
                    </div>
                </div>
            </body>
            </html>
        `;

        const info = await transporter.sendMail({
            from: smtpFrom,
            to: payload.recipientEmail,
            subject,
            html: htmlContent,
        });

        console.log(`[EmailService] Correo enviado con éxito a ${payload.recipientEmail}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error(`[EmailService Error] Fallo al enviar correo a ${payload.recipientEmail}:`, error);
        return { success: false, error: error.message || "Error desconocido en transporte SMTP" };
    }
}
