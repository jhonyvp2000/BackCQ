import postgres from 'postgres';
import * as mssql from 'mssql';
import * as dotenv from 'dotenv';

dotenv.config(); // Cargar config de BackCQ (.env local)

const pgConnectionString = process.env.DATABASE_URL;

const sqlConfig = {
    user: 'sa',
    password: 'SERVERPIDE',
    database: 'ERPHOSPITAL',
    server: '192.168.80.120',
    options: {
        encrypt: false, // para conexiones intranet a MSSQL local general
        trustServerCertificate: true
    }
};

const normalizeStr = (str: string | null | undefined) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
};

async function main() {
    console.log("Iniciando conectores de ambas bases de datos...");
    if (!pgConnectionString) {
        console.error("Falta DATABASE_URL en BackCQ .env");
        process.exit(1);
    }
    
    let pgClient;
    let pool;
    try {
        pgClient = postgres(pgConnectionString);
        
        console.log("Conectando a Microsoft SQL Server (ERPHOSPITAL)...");
        pool = await mssql.connect(sqlConfig);
        
        console.log("Extrañendo datos de SITIO.UBIGEO en MSSQL...");
        const resultMsSql = await pool.request().query('SELECT CODIGOINEI as codigo, DEPARTAMENTO as dpto, PROVINCIA as prov, DISTRITO as dist FROM SITIO.UBIGEO');
        const msUbi = resultMsSql.recordset;
        
        console.log("Extraendo datos de cq_ubigeo en Postgres...");
        const pgUbi = await pgClient`SELECT code as codigo, departamento as dpto, provincia as prov, distrito as dist FROM cq_ubigeo`;

        console.log(`\nRegistros obtenidos:`);
        console.log(`MSSQL (SITIO.UBIGEO): ${msUbi.length} filas.`);
        console.log(`Postgres (cq_ubigeo): ${pgUbi.length} filas.\n`);

        const msMap = new Map();
        for (const row of msUbi) {
            if (row.codigo) msMap.set(row.codigo.toString().trim(), row);
        }

        let totalComparaciones = 0;
        let coincidenciasExactas = 0;
        let coincidenciasAvanzadas = 0;
        let diferentes = 0;
        
        const muestrasDiferentes = [];

        console.log("Iniciando validación cruzada y cálculo de similitud...");

        for (const pgRow of pgUbi) {
            const cod = pgRow.codigo?.toString().trim();
            if (!cod) continue;
            
            const msRow = msMap.get(cod);
            if (msRow) {
                totalComparaciones++;
                
                // Normalizamos ambas partes para comparar
                const msDpto = normalizeStr(msRow.dpto);
                const msProv = normalizeStr(msRow.prov);
                const msDist = normalizeStr(msRow.dist);
                
                const pgDpto = normalizeStr(pgRow.dpto);
                const pgProv = normalizeStr(pgRow.prov);
                const pgDist = normalizeStr(pgRow.dist);

                if (msDpto === pgDpto && msProv === pgProv && msDist === pgDist) {
                    coincidenciasAvanzadas++;
                } else {
                    diferentes++;
                    // Guardamos una muestra del ruido o discrepancia
                    if (muestrasDiferentes.length < 10) {
                        muestrasDiferentes.push({
                            codigo: cod,
                            mssql: `${msDpto} / ${msProv} / ${msDist}`,
                            postgres: `${pgDpto} / ${pgProv} / ${pgDist}`
                        });
                    }
                }
            }
        }

        console.log("============== REPORTE DE CONSISTENCIA DE UBIGEOS ==============");
        if (totalComparaciones === 0) {
            console.log("No se encontraron códigos (CODIGOINEI) coincidentes entre ambas tablas.");
        } else {
            const porcentaje = ((coincidenciasAvanzadas / totalComparaciones) * 100).toFixed(2);
            console.log(`Total de Ubigeos comparables (código match): ${totalComparaciones}`);
            console.log(`🟢 Iguales / Homologables: ${coincidenciasAvanzadas} (${porcentaje}%)`);
            console.log(`🔴 Diferencias encontradas: ${diferentes}`);
            
            if (diferentes > 0) {
                console.log("\nMuestra de las diferencias tipográficas o de denominación:");
                muestrasDiferentes.forEach(m => {
                    console.log(`[${m.codigo}] => MS: "${m.mssql}"  ||  PG: "${m.postgres}"`);
                });
            }
            
            if (parseFloat(porcentaje) > 95) {
                console.log("\n✅ CONCLUSIÓN: La tabla Postgres 'cq_ubigeo' puede considerarse equivalente y funcional para sustituir la antigua tabla de MSSQL, poseyendo la ventaja de más columnas enriquecidas.");
            } else {
                console.log("\n⚠️ CONCLUSIÓN: Tienes bastante divergencia entre las bases.");
            }
        }

    } catch (e) {
        console.error("Hubo un error en la extracción o comparación:", e);
    } finally {
        if (pgClient) await pgClient.end();
        if (pool) await pool.close();
        process.exit(0);
    }
}

main();
