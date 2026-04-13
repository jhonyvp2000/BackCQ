import sys

file_path = 'f:/JVP/ANTIGRAVITY/BackCQ/src/app/dashboard/programaciones/surgery-form.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find the Team section container
# It starts at: <div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60"> just below Team Section heading
team_header = "3. Equipo Asistencial</span>"

if team_header not in text:
    print("Could not find team header")
    sys.exit(1)

start_search = text.find(team_header)

str_to_replace_start = '                            <div className="space-y-2">\n                                <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Cirujano(s) Principal(es)</label>'
str_to_replace_end = '                            <div className="space-y-2">\n                                <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Enfermero(s)</label>'

pos_start = text.find(str_to_replace_start, start_search)
if pos_start == -1:
    print("Could not find start of Surgeons")
    sys.exit(1)

pos_end_label = text.find(str_to_replace_end, pos_start)

# Finding the actual closing div of "Enfermero(s)" block.
# We know it ends just before: <div className="pt-2 flex justify-end">
end_marker = '                            <div className="pt-2 flex justify-end">'
pos_end = text.find(end_marker, pos_end_label)

if pos_end == -1:
    print("Could not find end of nurses block")
    sys.exit(1)

block = text[pos_start:pos_end]

# We need to format it into a grid
# We wrap the existing block into `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n` + indented block + `\n                            </div>\n`

new_block = '                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">\n' + \
            '    ' + block.replace('\n', '\n    ').rstrip() + '\n' + \
            '                            </div>\n'

text = text[:pos_start] + new_block + text[pos_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
