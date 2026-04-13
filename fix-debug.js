const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

const t = '// Create Identity Vault entity';
const r = 'console.log("===> DEBUG DNI: ", {validDni, apiPatientDataRaw, pDni, pCE, patientUuid});\n        // Create Identity Vault entity';

code = code.split(t).join(r);

fs.writeFileSync('src/app/actions/cirugias.ts', code);
console.log('Injected debug console.log into PM2');
