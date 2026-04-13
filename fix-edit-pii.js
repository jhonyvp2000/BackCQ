const fs = require('fs');
let code = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

const replacer = '        const apiPatientDataRaw = formData.get("api_patient_data") as string | null;\n' +
"        let pName = 'NO IDENTIFICADO';\n" +
"        let pLastName = 'NO IDENTIFICADO';\n" +
"        let pSexo = null;\n" +
"        let pFechaNac = null;\n" +
"        let pUbigeo = null;\n" +
"        let pHistoriaClinica = validDni || null;\n" +
"        let pDireccion = null;\n" +
"\n" +
"        if (apiPatientDataRaw) {\n" +
"            try {\n" +
"                const parsed = JSON.parse(apiPatientDataRaw);\n" +
"                pName = parsed.nombres || pName;\n" +
"                pLastName = parsed.apellidos || pLastName;\n" +
"                pSexo = parsed.sexo || null;\n" +
"                pFechaNac = parsed.fechaNacimiento ? new Date(parsed.fechaNacimiento) : null;\n" +
"                pUbigeo = parsed.ubigeo || null;\n" +
"                pHistoriaClinica = parsed.historiaClinica || pHistoriaClinica;\n" +
"                pDireccion = parsed.direccion || null;\n" +
"            } catch (e) {\n" +
"                console.error(\"Failed to parse api_patient_data\", e);\n" +
"            }\n" +
"        }\n" +
"\n" +
"        const newPat = await db.insert(cqPatients).values({\n" +
"            sexo: pSexo,\n" +
"            fechaNacimiento: pFechaNac,\n" +
"            ubigeo: pUbigeo,\n" +
"        }).returning({ id: cqPatients.id });\n" +
"        finalPatientId = newPat[0].id;\n" +
"\n" +
"        await db.insert(cqPatientPii).values({\n" +
"            patientId: (finalPatientId as string),\n" +
"            dni: validDni,\n" +
"            nombres: pName,\n" +
"            apellidos: pLastName,\n" +
"            historiaClinica: pHistoriaClinica || validDni,\n" +
"            direccion: pDireccion\n" +
"        });\n";

code = code.replace(/const newPat = await db\.insert\(cqPatients\)\.values\(\{\}\)\.returning\(\{ id: cqPatients\.id \}\);[\s\S]*?apellidos: 'No Identificado'\r?\n\s*\}\);/m, replacer);

fs.writeFileSync('src/app/actions/cirugias.ts', code);
