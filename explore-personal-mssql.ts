import sql from 'mssql';

const config = {
    user: 'sa',
    password: 'SERVERPIDE',
    server: '192.168.80.120',
    database: 'ERPHOSPITAL',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkMSSQL() {
    try {
        await sql.connect(config);
        console.log("Conectado a MSSQL ERPHOSPITAL!");

        // Sacar información de columnas
        const colsResult = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'personal' AND TABLE_NAME = 'trabajador'
        `);
        console.log("\nColumnas en personal.trabajador:");
        colsResult.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

        // Obtener muestra de 5 trabajadores activos
        const sampleResult = await sql.query(`
            SELECT TOP 5 * 
            FROM personal.trabajador 
            WHERE estado COLLATE Modern_Spanish_CI_AS IN ('ACTIVO', 'A', '1') OR estado IS NULL
        `);
        console.log("\nMuestra de 5 filas:");
        console.log(JSON.stringify(sampleResult.recordset, null, 2));

        // Obtener las distintas profesiones y especialidades para entender
        const profResult = await sql.query(`
            SELECT DISTINCT profesion, especialidad 
            FROM personal.trabajador
        `);
        console.log("\nProfesiones y Especialidades encontradas:");
        profResult.recordset.forEach(row => {
            console.log(`Prof: ${row.profesion} | Esp: ${row.especialidad}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Error MSSQL:", err);
        process.exit(1);
    }
}

checkMSSQL();
