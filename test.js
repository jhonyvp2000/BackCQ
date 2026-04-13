require('dotenv').config();
const { db } = require('./src/db');
const { cqSurgeryTeam } = require('./src/db/schema');
async function run() {
    const res = await db.select().from(cqSurgeryTeam);
    console.log('Total count:', res.length);
    if(res.length > 0) {
        const grouped = res.reduce((acc, r) => {
            acc[r.surgeryId] = acc[r.surgeryId] || { CIRUJANO: 0, ANESTESIOLOGO: 0, ENFERMERO: 0 };
            acc[r.surgeryId][r.roleInSurgery] = (acc[r.surgeryId][r.roleInSurgery] || 0) + 1;
            return acc;
        }, {});
        console.log(grouped);
    }
    process.exit(0);
}
run();
