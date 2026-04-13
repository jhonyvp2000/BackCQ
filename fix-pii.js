const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

// Fix createSurgery
code = code.replace(/if \\(existingPii\\.length > 0\\) \\{\\s*finalPatientId = existingPii\\[0\\]\\.patientId;\\s*\\} else \\{/g, 
'if (existingPii.length > 0) {\n        finalPatientId = existingPii[0].patientId;\n    } else if (!finalPatientId) {');

// Fix editSurgery
code = code.replace(/if \\(existingPii\\.length > 0\\) \\{\\s*finalPatientId = existingPii\\[0\\]\\.patientId;\\s*\\} else \\{/g, 
'if (existingPii.length > 0) {\n        finalPatientId = existingPii[0].patientId;\n    } else if (!finalPatientId) {');

// Assert patientId not null
code = code.replace(/patientId: finalPatientId,/g, 'patientId: (finalPatientId as string),');

fs.writeFileSync('src/app/actions/cirugias.ts', code);
