import sys

file_path = 'f:/JVP/ANTIGRAVITY/BackCQ/src/app/dashboard/programaciones/surgery-form.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Replace text-blue-900 with text-blue-600 (azul claro, legible)
text = text.replace('font-normal text-blue-900 dark:text-blue-300', 'font-normal text-blue-600 dark:text-blue-300')

# 2. Modify Duración Est. defaultValue
# Old: <select name="estimated_duration" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.estimatedDuration || ""} className={getSelectCls("estimated_duration", "px-2")}>
# New: <select name="estimated_duration" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.estimatedDuration || "1 hora"} className={getSelectCls("estimated_duration", "px-2")}>
old_select = 'defaultValue={clonedData?.surgery?.estimatedDuration || ""} className={getSelectCls("estimated_duration", "px-2")}>'
new_select = 'defaultValue={clonedData?.surgery?.estimatedDuration || "1 hora"} className={getSelectCls("estimated_duration", "px-2")}>'

text = text.replace(old_select, new_select)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
