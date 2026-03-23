import sql from 'mssql';
import { db } from './src/db';
import { usersTable, professions, staffProfiles } from './src/db/schema';
import { eq, inArray } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const mssqlConfig = {
    user: 'sa',
    password: 'SERVERPIDE',
    server: '192.168.80.120',
    database: 'ERPHOSPITAL',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function runMigration() {
    console.log("Iniciando migración desde MSSQL a Postgres CQ...");

    try {
        // Conectar a MSSQL
        await sql.connect(mssqlConfig);
        console.log("✅ Conectado a MSSQL ERPHOSPITAL.");

        const result = await sql.query(`
            SELECT CODIGO, APELLIDOS, NOMBRES, PROFESION, ESPECIALIDAD, NUMEROCOLEGIATURA, EMAIL
            FROM personal.trabajador
            WHERE estado COLLATE Modern_Spanish_CI_AS IN ('ACTIVO', 'A', '1') OR estado IS NULL
        `);
        const workers = result.recordset;
        console.log(`📌 Encontrados ${workers.length} trabajadores activos en MSSQL.`);

        // Preparamos profesiones estructuradas
        const baseProfessions = [
            { name: 'MEDICO CIRUJANO', category: 'ASISTENCIAL' },
            { name: 'ANESTESIOLOGO', category: 'ASISTENCIAL' },
            { name: 'ENFERMERO', category: 'ASISTENCIAL' },
            { name: 'OTRO ASISTENCIAL', category: 'ASISTENCIAL' },
            { name: 'ADMINISTRATIVO', category: 'ADMINISTRATIVO' }
        ];

        // Insertar/Asegurar profesiones base en PG
        let pgProfessionsMap: Record<string, string> = {};
        for (const bp of baseProfessions) {
            let existing = await db.select().from(professions).where(eq(professions.name, bp.name)).limit(1);
            if (existing.length === 0) {
                const inserted = await db.insert(professions).values({
                    name: bp.name,
                    staffCategory: bp.category
                }).returning({ id: professions.id });
                pgProfessionsMap[bp.name] = inserted[0].id;
            } else {
                pgProfessionsMap[bp.name] = existing[0].id;
            }
        }
        console.log("✅ Catálogo de Profesiones asegurado.");

        // Hash genérico para contraseñas de las cuentas migradas
        const defaultHash = await bcrypt.hash('123456', 10);

        let insertedCount = 0;
        let skippedCount = 0;

        for (const worker of workers) {
            const rawCode = worker.CODIGO || "";
            const rawDni = rawCode.trim();
            
            // Validaciones básicas de integridad
            if (!rawDni || rawDni.length > 20 || rawDni.length < 4) {
                skippedCount++;
                continue;
            }

            // Ignorar al que ya preservamos
            if (rawDni === '09791569') {
                skippedCount++;
                continue;
            }

            let p = (worker.PROFESION || "").toUpperCase();
            let e = (worker.ESPECIALIDAD || "").toUpperCase();

            // Deducción IA del Mapeo de Profesiones para Quirófano
            let mappedProfName = "ADMINISTRATIVO"; // default
            
            const assistKeywords = ['MEDICO', 'CIRUJANO', 'ENFERMER', 'ANESTES', 'PEDIATRA', 'OBSTETRA', 'NUTRICION', 'PSICOLOGO', 'BIOLOGO', 'FARMACEUTIC', 'TECNOLOG', 'ASISTENCIAL', 'LABORA', 'RAYOS X', 'CLINIC', 'FISIOTERAPIA'];
            
            const isAssist = assistKeywords.some(kw => p.includes(kw) || e.includes(kw));

            if (isAssist) {
                if (p.includes("ANESTESIOLOG") || e.includes("ANESTESIOLOG")) {
                    mappedProfName = "ANESTESIOLOGO";
                } else if (p.includes("CIRUJAN") || p.includes("CIRUGIA") || e.includes("CIRUGIA") || p.includes("TRAUMATOLOG") || p.includes("GINECOLOG") || p.includes("UROLOG") || p.includes("OFTALMOLOG") || p.includes("OTORRINO")) {
                    // Muchos médicos operan (traumatólogos, oftalmólogos, ginecólogos, urólogos, otorrinos). Los englobamos como Cirujanos para el pool.
                    mappedProfName = "MEDICO CIRUJANO";
                } else if (p.includes("ENFERMER")) {
                    mappedProfName = "ENFERMERO";
                } else {
                    // Otros médicos generales u obstetras
                    mappedProfName = "OTRO ASISTENCIAL"; 
                }
            } else {
                mappedProfName = "ADMINISTRATIVO";
            }

            // Inserción BD Postgres
            try {
                // Verificar posible duplicado por DNI (las DBs legacy pueden tener repetidos)
                const existingUser = await db.select().from(usersTable).where(eq(usersTable.dni, rawDni)).limit(1);
                
                let userIdToLink;
                if (existingUser.length === 0) {
                    const reqEmail = worker.EMAIL ? worker.EMAIL.trim() : "";
                    const safeEmail = reqEmail.length > 3 && reqEmail.includes("@") ? reqEmail : null;
                    
                    const newUser = await db.insert(usersTable).values({
                        dni: rawDni,
                        name: (worker.NOMBRES || "N/A").trim(),
                        lastname: (worker.APELLIDOS || "N/A").trim(),
                        email: safeEmail,
                        passwordHash: defaultHash,
                        isActive: true
                    }).returning({ id: usersTable.id });
                    userIdToLink = newUser[0].id;
                    insertedCount++;
                } else {
                    userIdToLink = existingUser[0].id;
                }

                // Relacionar perfil de personal si es ASISTENCIAL
                if (mappedProfName !== "ADMINISTRATIVO") {
                    await db.insert(staffProfiles).values({
                        userId: userIdToLink,
                        professionId: pgProfessionsMap[mappedProfName],
                        tuitionCode: worker.NUMEROCOLEGIATURA ? worker.NUMEROCOLEGIATURA.trim() : null
                    }).onConflictDoNothing();
                }

            } catch (innerErr) {
                console.error(`Error migrando trabajador DNI ${rawDni}:`, (innerErr as any).message);
                skippedCount++;
            }
        }

        console.log(`\n🚀 ¡Migración Exitosa!`);
        console.log(`🔹 Inyectados/Evaluados: ${insertedCount}`);
        console.log(`🔹 Omitidos/Duplicados/Inválidos: ${skippedCount}`);

        process.exit(0);
    } catch (err) {
        console.error("Error Global:", err);
        process.exit(1);
    }
}

runMigration();
