const fs = require('fs');

// Fix surgery-view-toggle.tsx
let uiCode = fs.readFileSync('src/app/dashboard/programaciones/surgery-view-toggle.tsx', 'utf8');
uiCode = uiCode.replace(/DNI: \{row\.patientPii\?\.dni \|\| 'Desconocido'\}/g, "Doc: {row.patientPii?.dni || row.patientPii?.carnetExtranjeria || row.patientPii?.pasaporte || 'Desconocido'}");
fs.writeFileSync('src/app/dashboard/programaciones/surgery-view-toggle.tsx', uiCode);

// Fix patient rendering in table just in case they have only carnet or pasaporte
// Well actually patients-table.tsx already correctly renders individually. It says "Sin ID Oficial" if all three are null.

console.log('Fixed UI labels');
