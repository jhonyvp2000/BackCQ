import re

with open('src/app/dashboard/programaciones/surgery-form.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace inputClasses in patient_id
content = content.replace(
    'className={`${inputClasses} pl-4 pr-10`}',
    'className={getInputCls("patient_id", "pl-4 pr-10")}'
)

# Replace other search boxes (just clear the error so it uses base classes)
content = content.replace(
    'className={`${inputClasses} pl-9 py-2`}',
    'className={getInputCls("", "pl-9 py-2")}'
)

# Patient Error Tag
content = content.replace(
    '</AnimatePresence>\n                            </div>',
    '</AnimatePresence>\n                            <FieldError msg={errors.patient_id} />\n                            </div>'
)

# Diagnoses Container & Error
content = content.replace(
    '<div className="max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">\n                                    {selectedDxList.map((dx) => (',
    '<div className={`max-h-52 overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1 ${getContainerErrCls("diagnoses")}`}>\n                                    {selectedDxList.map((dx) => ('
)
content = content.replace(
    '</p>\n                                    )}\n                                </div>\n                            </div>',
    '</p>\n                                    )}\n                                </div>\n                                <FieldError msg={errors.diagnoses} />\n                            </div>'
)

# Procedures Container & Error
content = content.replace(
    '<div className="max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">\n                                    {selectedProcList.map((proc) => (',
    '<div className={`max-h-52 overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1 ${getContainerErrCls("procedures")}`}>\n                                    {selectedProcList.map((proc) => ('
)
content = content.replace(
    '</button>\n                                                )}\n                                            </div>\n                                        )}\n                                    </div>\n                                </div>',
    '</button>\n                                                )}\n                                            </div>\n                                        )}\n                                    </div>\n                                    <FieldError msg={errors.procedures} />\n                                </div>\n'
)

# Selects in Classification
content = re.sub(
    r'<select name="surgery_type" disabled=\{!canSchedule\} className=\{selectClasses\}>',
    r'<select name="surgery_type" disabled={!canSchedule} className={getSelectCls("surgery_type")}>',
    content
)
content = re.sub(
    r'<select name="urgency_type" disabled=\{!canSchedule\} className=\{selectClasses\}>',
    r'<select name="urgency_type" disabled={!canSchedule} className={getSelectCls("urgency_type")}>',
    content
)
content = re.sub(
    r'<select name="specialty_id" disabled=\{!canSchedule\} className=\{selectClasses\}>',
    r'<select name="specialty_id" disabled={!canSchedule} className={getSelectCls("specialty_id")}>',
    content
)
content = re.sub(
    r'<select name="origin" disabled=\{!canSchedule\} className=\{selectClasses\}>',
    r'<select name="origin" disabled={!canSchedule} className={getSelectCls("origin")}>',
    content
)
content = re.sub(
    r'<select name="insurance_type" disabled=\{!canSchedule\} className=\{selectClasses\}>',
    r'<select name="insurance_type" disabled={!canSchedule} className={getSelectCls("insurance_type")}>',
    content
)

# Classification Error Tags
# Actually the selects themselves glow red, which is enough. But for perfection:
content = re.sub(
    r'(<select name="(surgery_type|urgency_type|specialty_id|origin|insurance_type)".*?<\/select>)',
    r'\1\n                                    <FieldError msg={errors.\2} />',
    content
)

# Surgeons Container & Error
content = content.replace(
    '<div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">\n                                    {selectedSurgList.map((s) => (',
    '<div className={`max-h-40 overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1 ${getContainerErrCls("surgeons")}`}>\n                                    {selectedSurgList.map((s) => ('
)
content = content.replace(
    '</p>\n                                    )}\n                                </div>\n                            </div>',
    '</p>\n                                    )}\n                                </div>\n                                <FieldError msg={errors.surgeons} />\n                            </div>'
)

# Other staff containers
content = content.replace(
    '<div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">',
    '<div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">'
)

# Selects & Inputs in Schedule
content = content.replace(
    '<select name="operating_room_id" disabled={!canSchedule} className={selectClasses}>',
    '<select name="operating_room_id" disabled={!canSchedule} className={getSelectCls("operating_room_id")}>'
)
content = content.replace(
    '</select>\n                            </div>',
    '</select>\n                                <FieldError msg={errors.operating_room_id} />\n                            </div>'
)

content = content.replace(
    '<input type="date" name="scheduled_date" required disabled={!canSchedule} className={inputClasses} />',
    '<input type="date" name="scheduled_date" required disabled={!canSchedule} className={getInputCls("scheduled_date")} />\n                                    <FieldError msg={errors.scheduled_date} />'
)
content = content.replace(
    '<input type="time" name="scheduled_time" required disabled={!canSchedule} className={inputClasses} />',
    '<input type="time" name="scheduled_time" required disabled={!canSchedule} className={getInputCls("scheduled_time")} />\n                                    <FieldError msg={errors.scheduled_time} />'
)
content = content.replace(
    '<select name="estimated_duration" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.estimatedDuration || ""} className={`${inputClasses} px-2`}>',
    '<select name="estimated_duration" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.estimatedDuration || ""} className={getSelectCls("estimated_duration", "px-2")}>'
)
content = content.replace(
    '</select>\n                                </div>\n                            </div>',
    '</select>\n                                    <FieldError msg={errors.estimated_duration} />\n                                </div>\n                            </div>'
)

content = content.replace(
    'className={`${inputClasses} resize-none h-20`}',
    'className={getInputCls("", "resize-none h-20")}'
)

with open('src/app/dashboard/programaciones/surgery-form.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
