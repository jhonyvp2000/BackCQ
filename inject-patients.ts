import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import * as dotenv from 'dotenv';
import crypto from 'node:crypto'; // Built-in UUID generation

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

const testPatients = [
  // Adolescentes (aprox. 15-16 años)
  {
    dni: '09791560',
    nombres: 'Luiz',
    apellidos: 'Vargas Mendez',
    sexo: 'Masculino',
    fechaNacimiento: new Date('2010-05-15'),
  },
  {
    dni: '09791561',
    nombres: 'Camila',
    apellidos: 'Zevallos Castro',
    sexo: 'Femenino',
    fechaNacimiento: new Date('2011-08-22'),
  },
  // Adultos (aprox. 25-45 años)
  {
    dni: '09791562',
    nombres: 'Carlos Alberto',
    apellidos: 'Salinas Reyes',
    sexo: 'Masculino',
    fechaNacimiento: new Date('1995-11-03'),
  },
  {
    dni: '09791563',
    nombres: 'Mariana',
    apellidos: 'Lozano Quishpe',
    sexo: 'Femenino',
    fechaNacimiento: new Date('1988-02-14'),
  },
  {
    dni: '09791564',
    nombres: 'Raul Fernando',
    apellidos: 'Perales Gomez',
    sexo: 'Masculino',
    fechaNacimiento: new Date('1979-09-30'),
  },
  {
    dni: '09791565',
    nombres: 'Sonia Beatriz',
    apellidos: 'Garrido Muñoz',
    sexo: 'Femenino',
    fechaNacimiento: new Date('1985-04-18'),
  },
  // Adultos Mayores (aprox. 65-75 años)
  {
    dni: '09791566',
    nombres: 'Victor',
    apellidos: 'Chavez Diaz',
    sexo: 'Masculino',
    fechaNacimiento: new Date('1956-07-25'),
  },
  {
    dni: '09791567',
    nombres: 'Teresa',
    apellidos: 'Ortega Valles',
    sexo: 'Femenino',
    fechaNacimiento: new Date('1950-12-10'),
  }
];

async function main() {
  console.log("Inyectando 8 pacientes de prueba...");

  try {
    for (const p of testPatients) {
      // Usar UUID nativo de Node.js
      const patientId = crypto.randomUUID();

      // Insertar en cq_patients
      await db.insert(schema.cqPatients).values({
        id: patientId,
        fechaNacimiento: p.fechaNacimiento,
        sexo: p.sexo,
        ubigeo: '150101', // Ubigeo por defecto (Lima)
      });

      // Insertar en cq_patient_pii
      await db.insert(schema.cqPatientPii).values({
        patientId: patientId,
        dni: p.dni,
        nombres: p.nombres,
        apellidos: p.apellidos,
        historiaClinica: `HC-${p.dni}` // Generamos un HC de ejemplo
      });

      console.log(`✅ Paciente inyectado: DNI: ${p.dni} - ${p.nombres} ${p.apellidos}`);
    }

    console.log("¡Inyección de datos completada exitosamente!");
  } catch (err) {
    console.error("Error inyectando pacientes:", err);
  } finally {
    process.exit(0);
  }
}

main();
