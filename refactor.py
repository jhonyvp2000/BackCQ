import sys
import os

file_path = 'f:/JVP/ANTIGRAVITY/BackCQ/src/app/dashboard/programaciones/surgery-form.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Expand modal
text = text.replace('w-full max-w-4xl', 'w-[96vw] max-w-7xl')

# 2. Rename Paciente
text = text.replace('Identificador (DNI / HC)', 'Paciente (DNI / HC)')

# 3. Rename Diagnosticos
text = text.replace('Catálogo de Diagnósticos (Dx)', 'Diagnósticos (Dx)')

# 4. Default Surgery Type
text = text.replace('defaultValue={clonedData?.surgery?.surgeryType || ""}', 'defaultValue={clonedData?.surgery?.surgeryType || "Cirugía Mayor"}', 1)

# Now, we extract Diagnosticos and Tipo_intervencion and Procedimientos
# They are inside section 1.
# Diagnosticos block:
start_dx = '                            <div className="space-y-2 pt-2">\n                                <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Diagnósticos (Dx)</label>'
if start_dx not in text: print("Missing Dx"); sys.exit(1)

# Find end of these sections which is before Action button
end_marker = '                            {/* Action button to continue */}'
end_pos = text.find(end_marker, text.find(start_dx))

block = text[text.find(start_dx):end_pos]

# Format them into a grid
new_block = '                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">\n    ' + block.replace('\n', '\n    ') + '\n                            </div>\n'

# Remove block from old location
text = text.replace(block, '')

# We need to replace the old Grid of Section 2 which is:
p_start = '<label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Tipo Operación</label>'
# Wait, Section 2 has a `<div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">\n                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">`

# Let's target the exact text from `Tipo Operación` grid until the `Team` section
marker = '<label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Tipo Operación</label>'
marker_pos = text.find(marker)

# We find the start of its surrounding grid
start_sec2 = text.rfind('<div className="grid ', 0, marker_pos)
end_sec2 = text.find('                            <div className="pt-2 flex justify-end">', start_sec2)

sec2_old = text[start_sec2:end_sec2]

new_sec2 = """<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Tipo Operación</label>
                                    <select name="surgery_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.surgeryType || "Cirugía Mayor"} className={getSelectCls("surgery_type")}>
                                        <option value="">- Tipo -</option>
                                        <option value="Cirugía Menor">Cirugía Menor</option>
                                        <option value="Cirugía Mayor">Cirugía Mayor</option>
                                    </select>
                                    <FieldError msg={errors.surgery_type} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Prioridad</label>
                                    <select name="urgency_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.urgencyType || "ELECTIVO"} className={getSelectCls("urgency_type")}>
                                        <option value="ELECTIVO">Electivo</option>
                                        <option value="EMERGENCIA">Emergencia</option>
                                    </select>
                                    <FieldError msg={errors.urgency_type} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Especialidad</label>
                                    <select name="specialty_id" disabled={!canSchedule} defaultValue={clonedData?.surgery?.specialtyId || ""} className={getSelectCls("specialty_id")}>
                                        <option value="">- Seleccionar -</option>
                                        {specialties.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                    <FieldError msg={errors.specialty_id} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Tipo de seguro</label>
                                    <select name="insurance_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.insuranceType || ""} className={getSelectCls("insurance_type")}>
                                        <option value="">- Seguro -</option>
                                        <option value="SIS">SIS</option>
                                        <option value="SOAT">SOAT</option>
                                        <option value="PARTICULAR">PARTICULAR</option>
                                        <option value="SISPOL">SISPOL</option>
                                    </select>
                                    <FieldError msg={errors.insurance_type} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Procedencia</label>
                                    <input
                                        type="text"
                                        name="origin"
                                        disabled={!canSchedule}
                                        defaultValue={clonedData?.surgery?.origin || ""}
                                        placeholder="Ej. Ambulatorio"
                                        className={getInputCls("origin")}
                                    />
                                    <FieldError msg={errors.origin} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">N° de Cama</label>
                                    <input
                                        type="text"
                                        name="bed_number"
                                        disabled={!canSchedule}
                                        defaultValue={clonedData?.surgery?.bedNumber || ""}
                                        placeholder="Ej. 104-B"
                                        className={getInputCls("bed_number")}
                                    />
                                    <FieldError msg={errors.bed_number} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Código Interno</label>
                                    <input
                                        type="text"
                                        name="internal_code"
                                        disabled={!canSchedule}
                                        defaultValue={clonedData?.surgery?.internalCode || ""}
                                        placeholder="Código o Referencia"
                                        className={getInputCls("internal_code")}
                                    />
                                    <FieldError msg={errors.internal_code} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Tipo de Anestesia</label>
                                    <select name="anesthesia_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.anesthesiaType || ""} className={getSelectCls("anesthesia_type")}>
                                        <option value="">- Seleccionar Anestesia -</option>
                                        <option value="RAQ">RAQ - Raquídea (o Subaracnoidea)</option>
                                        <option value="EPI">EPI - Epidural</option>
                                        <option value="AGB">AGB - Anestesia General Balanceada</option>
                                        <option value="AGE">AGE - Anestesia General Endovenosa</option>
                                        <option value="AGI">AGI - Anestesia General Inhalatoria</option>
                                        <option value="BLOQ">BLOQ - Bloqueo Regional</option>
                                        <option value="LOCL">LOCL - Local</option>
                                    </select>
                                    <FieldError msg={errors.anesthesia_type} />
                                </div>
                            </div>
"""

# Insert new_block (the pulled content) and then new_sec2 (the properly aligned 4-col rows)
if sec2_old in text:
    text = text.replace(sec2_old, new_block + new_sec2)
else:
    print("Could not find sec2_old")
    sys.exit(1)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('SUCCESS')
