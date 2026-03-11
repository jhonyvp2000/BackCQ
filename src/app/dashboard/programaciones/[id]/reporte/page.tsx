import { getSurgery, getSurgicalReport, createSurgicalReport } from "@/app/actions/reportes";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { FileSignature, UploadCloud, FileText, CheckCircle, ArrowLeft, DownloadCloud } from "lucide-react";
import Link from "next/link";

export default async function ReporteQuirurgicoPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = session.user as any;
    const surgeryData = await getSurgery(params.id);

    if (!surgeryData) {
        return (
            <div className="p-8 text-center text-zinc-500">
                Acto Quirúrgico no encontrado.
            </div>
        );
    }

    const existingReportData = await getSurgicalReport(params.id);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/programaciones" className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center">
                        <FileSignature className="mr-3 text-[var(--color-hospital-blue)]" /> Reporte Operatorio
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Documento legal del acto médico en sala de operaciones
                    </p>
                </div>
            </div>

            <div className="bg-[var(--color-hospital-blue)] bg-opacity-[0.03] border border-[var(--color-hospital-blue)] border-opacity-20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-hospital-blue)] mb-1">Paciente ID</h3>
                    <p className="font-medium text-lg text-zinc-900 dark:text-white">{surgeryData.patient}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-1">Estado Cirugía</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                        {surgeryData.surgery.status.toUpperCase()}
                    </span>
                </div>
            </div>

            {existingReportData ? (
                <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 flex items-center border-b border-emerald-100 dark:border-emerald-900/50">
                        <CheckCircle className="text-emerald-600 mr-2" size={20} />
                        <h3 className="font-medium text-emerald-800 dark:text-emerald-400">Reporte Guardado Exitosamente</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Cirujano Principal</h4>
                                <p className="mt-1 font-medium text-zinc-900 dark:text-white">{existingReportData.surgeon.name} {existingReportData.surgeon.lastname}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Procedimiento Quirúrgico</h4>
                                <p className="mt-1 text-zinc-800 dark:text-zinc-200">{existingReportData.report.surgicalProcedure}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Hallazgos</h4>
                                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl whitespace-pre-wrap borde border-zinc-100">{existingReportData.report.findings || 'Sin hallazgos especificados'}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sangrado (st)</h4>
                                    <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">{existingReportData.report.bloodLoss || '0 cc'}</p>
                                </div>
                            </div>

                            {existingReportData.report.documentUrl && (
                                <div className="mt-8">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-hospital-blue)] mb-3">Anexo PDF Firmado</h4>
                                    <a href={existingReportData.report.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors group">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-hospital-blue)]/10 text-[var(--color-hospital-blue)] flex items-center justify-center group-hover:bg-[var(--color-hospital-blue)] group-hover:text-white transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white">reporte_anexo.pdf</p>
                                            <p className="text-xs text-zinc-500">Almacenado de forma segura en Supabase Storage</p>
                                        </div>
                                        <DownloadCloud className="text-zinc-400 group-hover:text-[var(--color-hospital-blue)] transition-colors" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                    <form action={createSurgicalReport} className="space-y-8">
                        <input type="hidden" name="surgery_id" value={params.id} />
                        <input type="hidden" name="surgeon_id" value={user.id} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Diagnóstico Pre-Operatorio</label>
                                <input type="text" name="pre_op_diagnosis" className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-hospital-light)] transition-all" placeholder="Ej. Apendicitis Aguda" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Diagnóstico Post-Operatorio</label>
                                <input type="text" name="post_op_diagnosis" className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-hospital-light)] transition-all" placeholder="Ej. Apendicitis Supurada" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Procedimiento Quirúrgico (Técnica Principal) *</label>
                            <input type="text" name="surgical_procedure" required className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-hospital-light)] transition-all" placeholder="Ej. Apendicectomía Laparoscópica" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hallazgos Operatorios Importantes</label>
                            <textarea name="findings" rows={4} className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-hospital-light)] transition-all resize-y" placeholder="Describa el estado de los órganos, cavidad libre, adherencias etc..."></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sangrado Estimado</label>
                                <input type="text" name="blood_loss" className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-hospital-light)] transition-all" placeholder="Ej. 100 cc" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Detalles de Complicaciones</label>
                                <input type="text" name="complications" className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-hospital-light)] transition-all" placeholder="Ninguna" />
                            </div>
                        </div>

                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center mb-4">
                                    <UploadCloud className="mr-2" size={18} /> Adjuntar Documento Escaneado Oficial (PDF)
                                </label>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 dark:border-zinc-700 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="mb-2 text-zinc-400" size={24} />
                                            <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-300"><span className="font-semibold">Click para subir</span> o arrastra el archivo</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">PDF, MAX. 10MB (Irán directo a Supabase Bucket)</p>
                                        </div>
                                        <input id="dropzone-file" type="file" name="file" accept="application/pdf" className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full lg:w-auto flex justify-center items-center py-3 px-8 rounded-xl shadow-sm text-sm font-medium text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] transition-colors"
                        >
                            <FileSignature className="mr-2" size={18} /> Firmar y Guardar Reporte Operatorio
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
