const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

code = code.replace(/let pName = 'NO IDENTIFICADO';/g, 'let pName = "NO IDENTIFICADO";\n        let pDni = validDni;');

code = code.replace(/pDireccion = parsed\.direccion \|\| null;/g, 'pDireccion = parsed.direccion || null;\n                pDni = pDni || (/^\\\\d{8}$/.test(parsed.dni) ? parsed.dni : null);');

code = code.replace(/dni: validDni, \/\/ saving the DNI text here/g, 'dni: pDni, // saving the correct resolved DNI');
code = code.replace(/dni: validDni,/g, 'dni: pDni,');

code = code.replace(/historiaClinica: pHistoriaClinica \|\| validDni,/g, 'historiaClinica: pHistoriaClinica || pDni,');

fs.writeFileSync('src/app/actions/cirugias.ts', code);
console.log('Fixed API DNI Ghost Patient Creation');
