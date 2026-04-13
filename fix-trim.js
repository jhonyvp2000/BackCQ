const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

const t = '                if (parsed.dni) { if (/^\\\\d{8}$/.test(parsed.dni)) { pDni = pDni || parsed.dni; } else if (parsed.dni.length <= 20) { pCE = parsed.dni; } }';

const r = '                if (parsed.dni) { const c = String(parsed.dni).trim(); if (/^\\\\d{8}$/.test(c)) { pDni = pDni || c; } else if (c.length <= 20) { pCE = c; } }';

code = code.split(t).join(r);

fs.writeFileSync('src/app/actions/cirugias.ts', code);
console.log('Fixed Long DNI Insertion with .trim()');
