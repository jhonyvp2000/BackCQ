const fs = require('fs');
const file = 'f:/JVP/ANTIGRAVITY/BackCQ/src/app/dashboard/programaciones/surgery-form.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. In section 2, change target
content = content.replace(
  /<button type="button" onClick=\{\(\) => toggleSection\('team'\)\} className="text-sm font-semibold text-\[var\(--color-hospital-blue\)\] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900\/30 dark:hover:bg-blue-900\/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;<\/button>/,
  '<button type="button" onClick={() => toggleSection(\'schedule\')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>'
);

// 2. Extract sections
const sec3Start = content.indexOf('{/* --- SECCIÓN 3: EQUIPO ASISTENCIAL --- */}');
const sec4Start = content.indexOf('{/* --- SECCIÓN 4: AGENDA Y SALA --- */}');
const footerStart = content.indexOf('{/* Footer Actions */}');

if(sec3Start === -1 || sec4Start === -1 || footerStart === -1) {
  console.log('Could not find all sections');
  process.exit(1);
}

let sec3Html = content.substring(sec3Start, sec4Start);
let sec4Html = content.substring(sec4Start, footerStart);

// Modify texts correctly inside the chunks
sec3Html = sec3Html.replace('3. Equipo Asistencial', '4. Equipo Asistencial');
sec3Html = sec3Html.replace('{/* --- SECCIÓN 3: EQUIPO ASISTENCIAL --- */}', '{/* --- SECCIÓN 4: EQUIPO ASISTENCIAL --- */}');
// Remove the 'schedule' button from team section
sec3Html = sec3Html.replace(
  /<div className="pt-2 flex justify-end">\s*<button type="button" onClick=\{\(\) => toggleSection\('schedule'\)\}.*?<\/button>\s*<\/div>/,
  ''
);

sec4Html = sec4Html.replace('4. Sala y Horarios', '3. Sala y Horarios');
sec4Html = sec4Html.replace('{/* --- SECCIÓN 4: AGENDA Y SALA --- */}', '{/* --- SECCIÓN 3: AGENDA Y SALA --- */}');

// Add the 'team' button to schedule section
const match = sec4Html.match(/<\/div>\s*<\/motion\.div>\s*<\/div>\s*$/);
if(match) {
    sec4Html = sec4Html.replace(/<\/div>\s*<\/motion\.div>\s*<\/div>\s*$/, 
        '                            <div className="pt-2 flex justify-end">\n' +
        '                                <button type="button" onClick={() => toggleSection(\'team\')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>\n' +
        '                            </div>\n                        ' + match[0]
    );
} else {
    console.log("Could not match the ending of sec4Html");
}

// Write it back
const newContent = content.substring(0, sec3Start) + sec4Html + sec3Html + content.substring(footerStart);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Swapped successfully');
