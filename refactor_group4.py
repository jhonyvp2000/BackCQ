import sys

file_path = 'f:/JVP/ANTIGRAVITY/BackCQ/src/app/dashboard/programaciones/surgery-form.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Lines to replace start at `<div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">` in Section 4.
# Let's find Section 4 header first.
header_4 = "4. Sala y Horarios</span>"
start_sec4 = text.find(header_4)

# Find the start of the `Sala Quirúrgica` block
start_sala = text.find('                            <div className="space-y-2">\n                                <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Sala Quirúrgica</label>', start_sec4)

if start_sala == -1:
    print("Could not find Sala block")
    sys.exit(1)

# Find the end of `Duración Estimada` block. It ends with `</div>\n                            </div>` before Notas Internas
end_marker = '                            <div className="space-y-2 pt-2">\n                                <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Notas Internas</label>'
end_sala = text.find(end_marker, start_sala)

if end_sala == -1:
    print("Could not find end of Sala grid")
    sys.exit(1)

old_block = text[start_sala:end_sala]

# Now, we reconstruct the old_block without the inner `grid grid-cols-2` and `col-span-2`.
# `Sala` block is currently separate. We will combine them.

# First, extract exact HTML blocks for the 5 components:
def extract_block(block_text, search_str):
    pos = block_text.find(search_str)
    if pos == -1: return ""
    # find the next </div>
    # we can just use simple string splitting since they are nicely formatted.
    start = block_text.rfind('<div', 0, pos)
    # count divs to find matching end or just assume it's next `</div>`
    # actually all blocks end with `</FieldError>` or `</select>\n                                    <FieldError... />\n                                </div>`
    end = block_text.find('</div>', pos) + 6
    if block_text[end:end+1] == '\n':
        end += 1
    return block_text[start:end]

b1 = extract_block(old_block, ">Sala Quirúrgica</label>")
b2 = extract_block(old_block, ">Fecha de Solicitud</label>")
b3 = extract_block(old_block, ">Fecha Programación</label>")
b4 = extract_block(old_block, ">Hora</label>")
b5 = extract_block(old_block, ">Duración Estimada</label>")

# Clean up block classes
b1 = b1.replace('<div className="space-y-2">', '    <div className="space-y-2">')
b2 = b2.replace('<div className="col-span-2 space-y-2">', '    <div className="space-y-2">')
b3 = b3.replace('<div className="space-y-2">', '    <div className="space-y-2">')
b4 = b4.replace('<div className="space-y-2">', '    <div className="space-y-2">')
b5 = b5.replace('<div className="col-span-2 space-y-2 mt-1">', '    <div className="space-y-2">')

# Slightly compact some labels if desired, though max-w-7xl handles it well.
# "Fecha de Solicitud" -> "Fecha Solicitud"
b2 = b2.replace(">Fecha de Solicitud</label>", ">Fecha Solicitud</label>")
# "Fecha Programación" -> "Fecha Prog."
b3 = b3.replace(">Fecha Programación</label>", ">Fecha Prog.</label>")
# "Duración Estimada" -> "Duración"
b5 = b5.replace(">Duración Estimada</label>", ">Duración Est.</label>")

new_grid = '                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">\n' + \
           '                            ' + b1.lstrip() + '\n' + \
           '                            ' + b2.lstrip() + '\n' + \
           '                            ' + b3.lstrip() + '\n' + \
           '                            ' + b4.lstrip() + '\n' + \
           '                            ' + b5.lstrip() + '\n' + \
           '                            </div>\n'

text = text[:start_sala] + new_grid + text[end_sala:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
