import sys
import re

file_path = 'f:/JVP/ANTIGRAVITY/BackCQ/src/app/dashboard/programaciones/surgery-form.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Original classes used for labels
# <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">

# Replace 1: Standard labels
old_cls_1 = 'font-bold text-zinc-800 dark:text-zinc-300'
new_cls_1 = 'font-normal text-blue-900 dark:text-blue-300'

text = text.replace(old_cls_1, new_cls_1)

# Sometimes maybe it has extra classes:
# 'text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest text-emerald-600 dark:text-emerald-400'
# Let's fix if it became "font-normal text-blue-900 dark:text-blue-300 uppercase tracking-widest text-emerald-600 dark:text-emerald-400"
# In fact, we should remove the emerald classes if they got converted
text = text.replace('font-normal text-blue-900 dark:text-blue-300 uppercase tracking-widest text-emerald-600 dark:text-emerald-400', 'font-normal text-blue-900 dark:text-blue-300 uppercase tracking-widest')

# Check for "Tipo de Intervención" old emerald if it was different
text = text.replace('font-bold text-emerald-600 dark:text-emerald-400', 'font-normal text-blue-900 dark:text-blue-300')


# What about labels inside the checkbox list?
# <span className="font-semibold text-zinc-700 dark:text-zinc-200">
# Wait, the user said "todas las etiquetas de los componentes". This refers to the Fields text (e.g. "Sala Quirúrgica", "Tipo Operación", "Procedencia").
# Those are exactly the `<label>` tags above inputs!

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
