const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

const t = '                pDni = pDni || (/^\\\\d{8}$/.test(parsed.dni) ? parsed.dni : null);';

const r = '                if (parsed.dni) { if (/^\\\\d{8}$/.test(parsed.dni)) { pDni = pDni || parsed.dni; } else if (parsed.dni.length <= 20) { pCE = parsed.dni; } }';

code = code.split(t).join(r);

code = code.replace(/let pSexo = null;/g, 'let pSexo = null; let pCE = null;');
code = code.replace(/dni: pDni,(?![ \\/])/g, 'dni: pDni, carnetExtranjeria: pCE,');

fs.writeFileSync('src/app/actions/cirugias.ts', code);
console.log('Fixed Long DNI Insertion flatly');
