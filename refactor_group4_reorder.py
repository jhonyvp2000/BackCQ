import sys

file_path = 'f:/JVP/ANTIGRAVITY/BackCQ/src/app/dashboard/programaciones/surgery-form.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# I will find the grid container 
start_search = text.find('<div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">\n                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">', text.find('4. Sala y Horarios</span>'))

if start_search == -1:
    print("Could not find grid container")
    sys.exit(1)

# Now I'll find the old block to replace
start_block = text.find('                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">', start_search)

# find the closing div of the grid. It precedes "Notas Internas"
end_marker = '                            </div>\n                            <div className="space-y-2 pt-2">\n                                <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Notas Internas</label>'

end_block = text.find(end_marker, start_block)
if end_block == -1:
    print("Could not find end of grid")
    sys.exit(1)

old_grid = text[start_block:end_block]

def extract_block(block_text, search_str):
    pos = block_text.find(search_str)
    if pos == -1: return ""
    start = block_text.rfind('<div className="space-y-2">', 0, pos)
    end = block_text.find('</div>', pos) + 6
    if block_text[end:end+1] == '\n':
        end += 1
    return block_text[start:end]

b1_sala = extract_block(old_grid, ">Sala Quirúrgica</label>")
b2_fechas = extract_block(old_grid, ">Fecha Solicitud</label>")
b3_fechap = extract_block(old_grid, ">Fecha Prog.</label>")
b4_hora = extract_block(old_grid, ">Hora</label>")
b5_dur = extract_block(old_grid, ">Duración Est.</label>")

if not all([b1_sala, b2_fechas, b3_fechap, b4_hora, b5_dur]):
    print("Could not extract all blocks")
    sys.exit(1)

# Combine blocks in the new requested order
new_grid = '                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">\n' + \
           '                            ' + b2_fechas.lstrip() + '\n' + \
           '                            ' + b3_fechap.lstrip() + '\n' + \
           '                            ' + b4_hora.lstrip() + '\n' + \
           '                            ' + b5_dur.lstrip() + '\n' + \
           '                            ' + b1_sala.lstrip() + '\n'

text = text[:start_block] + new_grid + text[end_block:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
