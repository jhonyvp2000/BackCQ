"use client";

import { useState } from "react";
import { generarNotaSiga, generarConformidadServicio, generarNotaGenerica } from "@/app/actions/documentos";
import { saveAs } from "file-saver";
import {
    FileText, Loader2, AlertCircle, CheckCircle2, Send, Hash, Calendar,
    Package, FileSearch, ClipboardList, Truck, BarChart3, UserCheck,
    Briefcase, FileSignature, Award, BookOpen, ArrowLeft, ChevronRight,
    Type, User, GraduationCap
} from "lucide-react";

type DocType = "siga" | "conformidad" | "generica" | null;

// Definición de las plantillas disponibles
const TEMPLATES = [
    {
        id: "siga" as DocType,
        title: "Pedidos SIGA",
        subtitle: "Compra de Bienes y Servicios",
        icon: Send,
        gradient: "from-[#0D47A1] via-[#1565C0] to-[#42A5F5]",
        iconBg: "bg-[#0D47A1]/10",
        iconColor: "text-[#0D47A1]",
        borderHover: "hover:border-[#42A5F5]/50",
        ringColor: "ring-[#42A5F5]/20",
    },
    {
        id: "conformidad" as DocType,
        title: "Conformidad de Servicio",
        subtitle: "Locadores — Informe de Actividades",
        icon: FileSignature,
        gradient: "from-[#00695C] via-[#00897B] to-[#4DB6AC]",
        iconBg: "bg-[#00695C]/10",
        iconColor: "text-[#00695C]",
        borderHover: "hover:border-[#4DB6AC]/50",
        ringColor: "ring-[#4DB6AC]/20",
    },
    {
        id: "generica" as DocType,
        title: "Nota Genérica",
        subtitle: "Cualquier asunto institucional",
        icon: Type,
        gradient: "from-[#6A1B9A] via-[#8E24AA] to-[#BA68C8]",
        iconBg: "bg-[#6A1B9A]/10",
        iconColor: "text-[#6A1B9A]",
        borderHover: "hover:border-[#BA68C8]/50",
        ringColor: "ring-[#BA68C8]/20",
    },
];

export function DocumentosClient() {
    const [activeDoc, setActiveDoc] = useState<DocType>(null);

    // --- Estados SIGA ---
    const [sigaParams, setSigaParams] = useState({
        numero_correlativo: "", anio_curso: new Date().getFullYear().toString(),
        fecha_documento: "", bien_compra: "", doc_referencia: "",
        descripcion_compra: "", numero_pedido_siga: "", num_seguimiento_gstramite: ""
    });
    const [sigaLoading, setSigaLoading] = useState(false);
    const [sigaMsg, setSigaMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

    // --- Estados Conformidad ---
    const [confParams, setConfParams] = useState({
        numero_correlativo: "", anio_curso: new Date().getFullYear().toString(),
        fecha_documento: "", personal_locador: "", cargo_locador: "",
        numero_orden_servicio: "", numero_entregable: "", num_seguimiento: ""
    });
    const [confLoading, setConfLoading] = useState(false);
    const [confMsg, setConfMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

    // --- Estados Genérica ---
    const [genParams, setGenParams] = useState({
        numero_correlativo: "", anio_curso: new Date().getFullYear().toString(),
        fecha_documento: "", destinatario_nombre: "", destinatario_cargo: "",
        asunto: "", referencia: "", cuerpo_documento: "", num_seguimiento: ""
    });
    const [genLoading, setGenLoading] = useState(false);
    const [genMsg, setGenMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

    // --- Helpers ---
    const downloadBlob = (base64: string, filename: string) => {
        const bytes = atob(base64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        saveAs(new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), filename);
    };

    const handleGenerateSiga = async () => {
        if (!sigaParams.numero_correlativo || !sigaParams.bien_compra) {
            setSigaMsg({ type: "error", text: "Completa al menos el N° Correlativo y el Asunto." }); return;
        }
        setSigaMsg(null); setSigaLoading(true);
        try {
            const res = await generarNotaSiga(sigaParams);
            downloadBlob(res.base64, res.filename);
            setSigaMsg({ type: "success", text: `"${res.filename}" generado exitosamente.` });
        } catch (err: any) { setSigaMsg({ type: "error", text: err.message || "Error al generar." }); }
        finally { setSigaLoading(false); }
    };

    const handleGenerateConformidad = async () => {
        if (!confParams.numero_correlativo || !confParams.personal_locador) {
            setConfMsg({ type: "error", text: "Completa al menos el N° Correlativo y el Locador." }); return;
        }
        setConfMsg(null); setConfLoading(true);
        try {
            const res = await generarConformidadServicio(confParams);
            downloadBlob(res.base64, res.filename);
            setConfMsg({ type: "success", text: `"${res.filename}" generado exitosamente.` });
        } catch (err: any) { setConfMsg({ type: "error", text: err.message || "Error al generar." }); }
        finally { setConfLoading(false); }
    };

    const handleGenerateGenerica = async () => {
        if (!genParams.numero_correlativo || !genParams.asunto || !genParams.destinatario_nombre) {
            setGenMsg({ type: "error", text: "Completa N° Correlativo, Destinatario y Asunto." }); return;
        }
        setGenMsg(null); setGenLoading(true);
        try {
            const res = await generarNotaGenerica(genParams);
            downloadBlob(res.base64, res.filename);
            setGenMsg({ type: "success", text: `"${res.filename}" generado exitosamente.` });
        } catch (err: any) { setGenMsg({ type: "error", text: err.message || "Error al generar." }); }
        finally { setGenLoading(false); }
    };

    // Clases reutilizables
    const inp = "w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm transition-all duration-200 focus:bg-white dark:focus:bg-zinc-800 focus:border-[#42A5F5] focus:ring-2 focus:ring-[#42A5F5]/20 focus:outline-none";
    const inpSm = "w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm transition-all duration-200 focus:bg-white dark:focus:bg-zinc-800 focus:border-[#42A5F5] focus:ring-2 focus:ring-[#42A5F5]/20 focus:outline-none";

    // ========================
    // VISTA: Selector de plantillas
    // ========================
    if (!activeDoc) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TEMPLATES.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} onClick={() => setActiveDoc(t.id)}
                            className={`group relative text-left bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 ${t.borderHover} rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 active:scale-[0.98]`}>
                            <div className="flex flex-col gap-4">
                                <div className={`w-12 h-12 rounded-xl ${t.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                                    <Icon size={22} className={t.iconColor} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate">{t.title}</h3>
                                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{t.subtitle}</p>
                                </div>
                            </div>
                            {/* Barra decorativa inferior con gradiente */}
                            <div className={`absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r ${t.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </button>
                    );
                })}
            </div>
        );
    }

    const activeTpl = TEMPLATES.find(t => t.id === activeDoc)!;

    // ========================
    // VISTA: Formulario activo
    // ========================
    return (
        <div className="space-y-0">
            {/* Botón volver + Header */}
            <div className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-r ${activeTpl.gradient}`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-60" />
                <div className="relative px-6 py-4">
                    <button onClick={() => setActiveDoc(null)}
                        className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-3 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Volver a plantillas
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                            <activeTpl.icon size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">{activeTpl.title}</h2>
                            <p className="text-sm text-white/70 mt-0.5">{activeTpl.subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cuerpo del formulario */}
            <div className="bg-white dark:bg-zinc-900 border border-t-0 border-zinc-200/80 dark:border-zinc-800 rounded-b-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.04)]">
                <div className="p-6 space-y-5">

                    {/* ======= FORMULARIO SIGA ======= */}
                    {activeDoc === "siga" && (<>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Hash size={14} className="text-[#0D47A1]" /> N° Correlativo <span className="text-red-400 text-xs">*</span>
                                </label>
                                <input type="text" placeholder="Ej: 024" value={sigaParams.numero_correlativo}
                                    onChange={(e) => setSigaParams({...sigaParams, numero_correlativo: e.target.value})} className={inp} />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} className="text-[#0D47A1]" /> Año
                                </label>
                                <input type="text" value={sigaParams.anio_curso}
                                    onChange={(e) => setSigaParams({...sigaParams, anio_curso: e.target.value})} className={`${inp} font-medium`} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} className="text-[#0D47A1]" /> Fecha del documento
                                </label>
                                <input type="text" placeholder="Ej: Tarapoto, 27 de marzo del 2026" value={sigaParams.fecha_documento}
                                    onChange={(e) => setSigaParams({...sigaParams, fecha_documento: e.target.value})} className={inp} />
                            </div>
                        </div>
                        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                <Package size={14} className="text-[#0D47A1]" /> Asunto (Lo que se compra) <span className="text-red-400 text-xs">*</span>
                            </label>
                            <input type="text" placeholder="Ej: Gasa Quirúrgica Estéril" value={sigaParams.bien_compra}
                                onChange={(e) => setSigaParams({...sigaParams, bien_compra: e.target.value})} className={inp} />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                <ClipboardList size={14} className="text-[#0D47A1]" /> Descripción detallada
                            </label>
                            <textarea placeholder="Ej: La adquisición de gasa quirúrgica estéril..." value={sigaParams.descripcion_compra}
                                onChange={(e) => setSigaParams({...sigaParams, descripcion_compra: e.target.value})} rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm leading-relaxed resize-none transition-all duration-200 focus:bg-white dark:focus:bg-zinc-800 focus:border-[#42A5F5] focus:ring-2 focus:ring-[#42A5F5]/20 focus:outline-none" />
                        </div>
                        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3"><Truck size={13} /> Datos de seguimiento</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"><FileSearch size={13} className="text-zinc-400" /> Doc. Referencia</label>
                                    <input type="text" placeholder="01148-2026" value={sigaParams.doc_referencia}
                                        onChange={(e) => setSigaParams({...sigaParams, doc_referencia: e.target.value})} className={inpSm} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"><Hash size={13} className="text-zinc-400" /> N° Pedido SIGA</label>
                                    <input type="text" placeholder="539" value={sigaParams.numero_pedido_siga}
                                        onChange={(e) => setSigaParams({...sigaParams, numero_pedido_siga: e.target.value})} className={inpSm} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"><BarChart3 size={13} className="text-zinc-400" /> GSTramite</label>
                                    <input type="text" placeholder="025-2026 - 644588" value={sigaParams.num_seguimiento_gstramite}
                                        onChange={(e) => setSigaParams({...sigaParams, num_seguimiento_gstramite: e.target.value})} className={inpSm} />
                                </div>
                            </div>
                        </div>
                        <MessageBox msg={sigaMsg} />
                        <button onClick={handleGenerateSiga} disabled={sigaLoading}
                            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#0D47A1] to-[#1565C0] hover:from-[#0D47A1] hover:to-[#0D47A1] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(13,71,161,0.25)] hover:shadow-[0_4px_16px_rgba(13,71,161,0.35)] active:scale-[0.98]">
                            {sigaLoading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                            {sigaLoading ? "Generando..." : "Generar Pedido SIGA (.docx)"}
                        </button>
                    </>)}

                    {/* ======= FORMULARIO CONFORMIDAD ======= */}
                    {activeDoc === "conformidad" && (<>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Hash size={14} className="text-[#00695C]" /> N° Correlativo <span className="text-red-400 text-xs">*</span>
                                </label>
                                <input type="text" placeholder="Ej: 041" value={confParams.numero_correlativo}
                                    onChange={(e) => setConfParams({...confParams, numero_correlativo: e.target.value})} className={inp} />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} className="text-[#00695C]" /> Año
                                </label>
                                <input type="text" value={confParams.anio_curso}
                                    onChange={(e) => setConfParams({...confParams, anio_curso: e.target.value})} className={`${inp} font-medium`} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} className="text-[#00695C]" /> Fecha del documento
                                </label>
                                <input type="text" placeholder="Ej: 14 de Abril del 2026" value={confParams.fecha_documento}
                                    onChange={(e) => setConfParams({...confParams, fecha_documento: e.target.value})} className={inp} />
                            </div>
                        </div>
                        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3"><UserCheck size={13} /> Datos del Locador</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        <UserCheck size={14} className="text-[#00695C]" /> Nombre del Locador <span className="text-red-400 text-xs">*</span>
                                    </label>
                                    <input type="text" placeholder="Ej: Dra. Erika Roció Suyo Inga" value={confParams.personal_locador}
                                        onChange={(e) => setConfParams({...confParams, personal_locador: e.target.value})} className={inp} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        <Briefcase size={14} className="text-[#00695C]" /> Cargo / Especialidad
                                    </label>
                                    <input type="text" placeholder="Ej: Médico especialista en Anestesiología" value={confParams.cargo_locador}
                                        onChange={(e) => setConfParams({...confParams, cargo_locador: e.target.value})} className={inp} />
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3"><BookOpen size={13} /> Datos del trámite</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"><Award size={13} className="text-zinc-400" /> N° Orden de Servicio</label>
                                    <input type="text" placeholder="Ej: 417" value={confParams.numero_orden_servicio}
                                        onChange={(e) => setConfParams({...confParams, numero_orden_servicio: e.target.value})} className={inpSm} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"><FileText size={13} className="text-zinc-400" /> N° Entregable</label>
                                    <input type="text" placeholder="Ej: PRIMER ENTREGABLE 2026" value={confParams.numero_entregable}
                                        onChange={(e) => setConfParams({...confParams, numero_entregable: e.target.value})} className={inpSm} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"><BarChart3 size={13} className="text-zinc-400" /> Reg. Seguimiento</label>
                                    <input type="text" placeholder="Ej: 025-2026-151597" value={confParams.num_seguimiento}
                                        onChange={(e) => setConfParams({...confParams, num_seguimiento: e.target.value})} className={inpSm} />
                                </div>
                            </div>
                        </div>
                        <MessageBox msg={confMsg} />
                        <button onClick={handleGenerateConformidad} disabled={confLoading}
                            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#00695C] hover:to-[#00695C] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(0,105,92,0.25)] hover:shadow-[0_4px_16px_rgba(0,105,92,0.35)] active:scale-[0.98]">
                            {confLoading ? <Loader2 className="animate-spin" size={20} /> : <FileSignature size={20} />}
                            {confLoading ? "Generando..." : "Generar Conformidad de Servicio (.docx)"}
                        </button>
                    </>)}

                    {/* ======= FORMULARIO GENÉRICA ======= */}
                    {activeDoc === "generica" && (<>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Hash size={14} className="text-[#6A1B9A]" /> N° Correlativo <span className="text-red-400 text-xs">*</span>
                                </label>
                                <input type="text" placeholder="Ej: 060" value={genParams.numero_correlativo}
                                    onChange={(e) => setGenParams({...genParams, numero_correlativo: e.target.value})} className={inp} />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} className="text-[#6A1B9A]" /> Año
                                </label>
                                <input type="text" value={genParams.anio_curso}
                                    onChange={(e) => setGenParams({...genParams, anio_curso: e.target.value})} className={`${inp} font-medium`} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} className="text-[#6A1B9A]" /> Fecha del documento
                                </label>
                                <input type="text" placeholder="Ej: Tarapoto, 28 de abril del 2026" value={genParams.fecha_documento}
                                    onChange={(e) => setGenParams({...genParams, fecha_documento: e.target.value})} className={inp} />
                            </div>
                        </div>
                        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3"><User size={13} /> Destinatario</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        Nombre <span className="text-red-400 text-xs">*</span>
                                    </label>
                                    <input type="text" placeholder="Ej: MC. ANDERSON SOTO MAYOR" value={genParams.destinatario_nombre}
                                        onChange={(e) => setGenParams({...genParams, destinatario_nombre: e.target.value})} className={inp} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        Cargo / Dependencia
                                    </label>
                                    <input type="text" placeholder="Ej: Jefe de Dpto. de Cirugía" value={genParams.destinatario_cargo}
                                        onChange={(e) => setGenParams({...genParams, destinatario_cargo: e.target.value})} className={inp} />
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <ClipboardList size={14} className="text-[#6A1B9A]" /> Asunto <span className="text-red-400 text-xs">*</span>
                                </label>
                                <input type="text" placeholder="Ej: REMITE INFORMACION SOLICITADA" value={genParams.asunto}
                                    onChange={(e) => setGenParams({...genParams, asunto: e.target.value})} className={inp} />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    <BookOpen size={14} className="text-[#6A1B9A]" /> Referencia (Opcional)
                                </label>
                                <input type="text" placeholder="Ej: NOTA DE COORDINACION N° 003-2024..." value={genParams.referencia}
                                    onChange={(e) => setGenParams({...genParams, referencia: e.target.value})} className={inp} />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                <FileText size={14} className="text-[#6A1B9A]" /> Cuerpo del documento
                            </label>
                            <textarea placeholder="Escribe el contenido de la nota aquí..." value={genParams.cuerpo_documento}
                                onChange={(e) => setGenParams({...genParams, cuerpo_documento: e.target.value})} rows={6}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm leading-relaxed resize-none transition-all duration-200 focus:bg-white dark:focus:bg-zinc-800 focus:border-[#BA68C8] focus:ring-2 focus:ring-[#BA68C8]/20 focus:outline-none" />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"><BarChart3 size={13} className="text-zinc-400" /> Reg. Seguimiento (Pie de página)</label>
                            <input type="text" placeholder="Ej: 025-2024" value={genParams.num_seguimiento}
                                onChange={(e) => setGenParams({...genParams, num_seguimiento: e.target.value})} className={inpSm} />
                        </div>
                        <MessageBox msg={genMsg} />
                        <button onClick={handleGenerateGenerica} disabled={genLoading}
                            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#6A1B9A] to-[#8E24AA] hover:from-[#6A1B9A] hover:to-[#6A1B9A] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(106,27,154,0.25)] hover:shadow-[0_4px_16px_rgba(106,27,154,0.35)] active:scale-[0.98]">
                            {genLoading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                            {genLoading ? "Generando..." : "Generar Nota Genérica (.docx)"}
                        </button>
                    </>)}
                </div>
            </div>
        </div>
    );
}

// Componente auxiliar para mensajes
function MessageBox({ msg }: { msg: { type: "error" | "success"; text: string } | null }) {
    if (!msg) return null;
    const isErr = msg.type === "error";
    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${isErr ? "bg-red-50 dark:bg-red-900/10 border-red-200/60 dark:border-red-800/30 text-red-700 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400"}`}>
            {isErr ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <p className="leading-relaxed">{msg.text}</p>
        </div>
    );
}
