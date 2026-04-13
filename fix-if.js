const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

const replacement = 'if (existingPii.length > 0) {\\n' +
'        finalPatientId = existingPii[0].patientId;\\n' +
'    } else if (!finalPatientId) {';

// But wait, the literal "\\n" means outputting "\" and "n".
// Better use literal newlines or single backslash n evaluated locally.

const correctReplacement = 'if (existingPii.length > 0) {\n' +
'        finalPatientId = existingPii[0].patientId;\n' +
'    } else if (!finalPatientId) {';

code = code.replace(/if\s*\(existingPii\.length\s*>\s*0\)\s*\{\s*finalPatientId\s*=\s*existingPii\[0\]\.patientId;\s*\}\s*else\s*\{/g, correctReplacement);

code = code.replace(/if \(patientUuid\) \{ const res/g, "if (patientUuid && !patientUuid.startsWith('__api_pat__')) { const res");

fs.writeFileSync('src/app/actions/cirugias.ts', code);
console.log('Fixed IF/ELSE cleanly');
