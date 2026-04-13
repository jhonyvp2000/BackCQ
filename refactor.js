const fs = require('fs');

try {
    let code = fs.readFileSync('src/app/dashboard/programaciones/surgery-form.tsx', 'utf8');

    // 1. Add new props
    code = code.replace(
        /procedures: any\[\],\n    patients: any\[\]\n}\) \{/,
        'procedures: any[],\n    patients: any[],\n    editMode?: boolean,\n    editData?: any,\n    isOpenOverride?: boolean,\n    onCloseOverride?: () => void\n}) {'
    );

    // 2. Add controlled isOpen logic
    code = code.replace(
        /const \[isOpen, setIsOpen\] = useState\(false\);/,
        'const [internalIsOpen, setInternalIsOpen] = useState(false);\n    const isOpen = isOpenOverride !== undefined ? isOpenOverride : internalIsOpen;\n    const handleClose = () => { if(onCloseOverride) onCloseOverride(); else setInternalIsOpen(false); };'
    );

    // 3. Replace all setIsOpen(true) and setIsOpen(false) EXCEPT for the internal declaration
    code = code.replace(/setIsOpen\(true\)/g, 'setInternalIsOpen(true)');
    code = code.replace(/onClick=\{.. \=\> setIsOpen\(false\)\}/g, 'onClick={handleClose}');
    code = code.replace(/setIsOpen\(false\)/g, 'handleClose()');

    // 4. Wrap the open button in editMode check
    code = code.replace(
        /\{\/\* Botón flotante superior[\s\S]*?<button[\s\S]*?Nueva Cirugía[\s\S]*?<\/button>/,
        `{!editMode && (
            <button
                type="button"
                onClick={() => setInternalIsOpen(true)}
                className="flex items-center text-sm font-semibold justify-center py-2.5 px-6 rounded-xl shadow-[0_2px_12px_rgba(33,121,202,0.3)] text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] hover:shadow-[0_6px_20px_rgba(33,121,202,0.4)] transition-all uppercase tracking-wider gap-2 shrink-0"
            >
                <Plus size={18} /> Nueva Cirugía
            </button>
        )}`
    );

    // 5. Change form action to use editSurgery or createSurgery
    code = code.replace(
        /import \{ createSurgery, createCustomDiagnosis/g,
        'import { createSurgery, editSurgery, createCustomDiagnosis'
    );

    code = code.replace(
        /const result = await createSurgery\(formData\);/g,
        'const result = editMode ? await editSurgery(formData) : await createSurgery(formData);'
    );

    // 6. Handle editData injection
    code = code.replace(
        /const \[clonedData, setClonedData\] = useState<any>\(null\);/,
        `const [clonedData, setClonedData] = useState<any>(editData || null);
    
    useEffect(() => {
        if(editMode && editData) {
            setClonedData(editData);
            if (editData?.patientPii?.patientId) {
                setSelectedPatId(editData.patientPii.patientId);
                setPatSearchTerm(editData.patientPii.dni || editData.patientPii.historiaClinica || "");
            }
            if (editData?.team) {
                const surg = editData.team.filter((t: any) => t.role === 'CIRUJANO').map((t: any) => t.staff.id);
                const anes = editData.team.filter((t: any) => t.role === 'ANESTESIOLOGO').map((t: any) => t.staff.id);
                const nurs = editData.team.filter((t: any) => t.role === 'ENFERMERO').map((t: any) => t.staff.id);
                setSelectedSurgIds(new Set(surg));
                setSelectedAnesIds(new Set(anes));
                setSelectedNursIds(new Set(nurs));
            }
            if (editData?.diagnoses) Object.keys(editData.diagnoses).length? setSelectedDxIds(new Set(editData.diagnoses)) : null;
            if (editData?.procedures) Object.keys(editData.procedures).length? setSelectedProcIds(new Set(editData.procedures)) : null;
            setFormKey(prev => prev + 1);
        }
    }, [editData, editMode]);`
    );

    // 7. Inject hidden ID field if editMode
    code = code.replace(
        /<input type=\"hidden\" name=\"api_patient_data\" value=\{selectedPatList\[0\]\?.apiData \|\| \"\"\} \/>/,
        '<input type="hidden" name="api_patient_data" value={selectedPatList[0]?.apiData || ""} />\n                                    {editMode && <input type="hidden" name="id" value={editData?.surgery?.id || ""} />}'
    );

    // 8. Keep window open setting hide in edit mode
    code = code.replace(
        /if \(!keepOpen\) \{\s*handleClose\(\);\s*\}/g,
        'if (!keepOpen || editMode) { handleClose(); }'
    );

    // 9. Hide keepOpen checkbox if edit mode
    code = code.replace(
        /<label className=\"flex items-center gap-2 cursor-pointer group\">/,
        '{!editMode && (\n<label className="flex items-center gap-2 cursor-pointer group">'
    );
    code = code.replace(
        /<\/label>\s*<button/g,
        '</label>\n)}\n\n                    <button'
    );

    // 10. Text replacements for titles
    code = code.replace(
        /<h2 className=\"text-2xl font-bold text-zinc-900 dark:text-white mb-2 ml-1 flex items-center gap-2\">\s*Registro de Programación Quirúrgica\s*<\/h2>\s*<p className=\"text-zinc-500 dark:text-zinc-400 text-sm ml-1 mb-8 max-w-xl font-medium\">\s*Complete las secciones para agendar el procedimiento en el área blanca.\s*<\/p>/g,
        `<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 ml-1 flex items-center gap-2">
            {editMode ? "Editar Programación Quirúrgica" : "Registro de Programación Quirúrgica"}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm ml-1 mb-8 max-w-xl font-medium">
            {editMode ? "Modifica los parámetros de la cirugía planificada." : "Complete las secciones para agendar el procedimiento en el área blanca."}
        </p>`
    );
    
    // 11. Button texts
    code = code.replace(
        /\{submitting \? 'Aprobando Agenda\.\.\.' : 'Confirmar Cirugía'\}/g,
        '{submitting ? (editMode ? "Guardando Cambios..." : "Aprobando Agenda...") : (editMode ? "Guardar Cambios" : "Confirmar Cirugía")}'
    );

    // 12. Fix the backdrop Animate onClick
    code = code.replace(
        /onClick=\{.*setInternalIsOpen\(false\)\}/g,
        'onClick={handleClose}'
    );

    fs.writeFileSync('src/app/dashboard/programaciones/surgery-form.tsx', code);
    console.log("SUCCESS. Script applied changes to surgery-form.tsx");
} catch(err) {
    console.error(err);
}
