const pool = require('../src/config/database');

// Nombres y datos realistas
const firstNames = [
  'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Luis', 'Isabel',
  'Miguel', 'Carmen', 'José', 'Rosa', 'Francisco', 'Dolores', 'Antonio', 'Pilar'
];

const lastNames = [
  'García', 'Martínez', 'López', 'Rodríguez', 'Pérez', 'Sánchez', 'Fernández', 'Torres',
  'Ramirez', 'Morales', 'Flores', 'Rivera', 'Jiménez', 'Castillo', 'Herrera', 'Mendoza'
];

const operations = ['Televentas', 'Cobranzas', 'Inbound', 'eCare'];

function generateRandomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateRandomPhone() {
  const prefixes = ['300', '301', '302', '303', '304', '305'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0');
  return `+57 ${prefix} ${number}`;
}

function generateCandidates(count) {
  const candidates = [];
  const usedEmails = new Set();

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    let email = generateRandomEmail(firstName, lastName);

    // Evitar duplicados
    while (usedEmails.has(email)) {
      email = generateRandomEmail(firstName, lastName);
    }
    usedEmails.add(email);

    const operation = operations[Math.floor(Math.random() * operations.length)];

    candidates.push({
      name: `${firstName} ${lastName}`,
      email,
      phone: generateRandomPhone(),
      operation
    });
  }

  return candidates;
}

async function seedCandidates() {
  try {
    console.log('🌱 Iniciando seeding de candidatos...\n');

    // Obtener vacantes
    const vacanciesResult = await pool.query(
      'SELECT id, title FROM vacancies ORDER BY id'
    );

    if (vacanciesResult.rows.length === 0) {
      console.log('❌ No hay vacantes en la base de datos.');
      console.log('Por favor ejecuta: npm run seed:vacancies');
      process.exit(1);
    }

    console.log(`✅ ${vacanciesResult.rows.length} vacantes encontradas:\n`);
    vacanciesResult.rows.forEach(v => console.log(`  • ${v.title} (ID: ${v.id})`));
    console.log('\n');

    // Generar candidatos
    const candidatesPerVacancy = 5;
    const totalCandidates = vacanciesResult.rows.length * candidatesPerVacancy;
    const candidates = generateCandidates(totalCandidates);

    console.log(`📝 Generando ${totalCandidates} candidatos (${candidatesPerVacancy} por vacante)...\n`);

    let candidatesCreated = 0;
    let assignmentsCreated = 0;
    let skipped = 0;

    // Crear candidatos y asignarlos a vacantes
    for (let i = 0; i < vacanciesResult.rows.length; i++) {
      const vacancy = vacanciesResult.rows[i];
      console.log(`📋 Asignando candidatos a: ${vacancy.title}`);

      for (let j = 0; j < candidatesPerVacancy; j++) {
        const candidateIndex = i * candidatesPerVacancy + j;
        const candidate = candidates[candidateIndex];

        try {
          // Verificar si el candidato ya existe
          const existingCheck = await pool.query(
            'SELECT id FROM candidates WHERE email = $1',
            [candidate.email]
          );

          let candidateId;

          if (existingCheck.rows.length > 0) {
            candidateId = existingCheck.rows[0].id;
            skipped++;
          } else {
            // Crear nuevo candidato
            const [firstName, lastName] = candidate.name.split(' ');
            const candidateResult = await pool.query(
              'INSERT INTO candidates (first_name, last_name, email, phone, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
              [firstName, lastName || firstName, candidate.email, candidate.phone, 1]
            );

            candidateId = candidateResult.rows[0].id;
            candidatesCreated++;
          }

          // Asignar a vacante (si no está ya asignado)
          try {
            await pool.query(
              'INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status) VALUES ($1, $2, $3)',
              [candidateId, vacancy.id, 'invited']
            );
            assignmentsCreated++;
          } catch (assignError) {
            // Ya está asignado, ignorar
          }
        } catch (error) {
          console.error(`   ✗ Error con candidato: ${error.message}`);
        }
      }

      console.log(`   ✓ ${candidatesPerVacancy} candidatos procesados\n`);
    }

    console.log('📊 Resumen de Seeding:');
    console.log(`   • Total candidatos creados: ${candidatesCreated}`);
    console.log(`   • Total candidatos existentes: ${skipped}`);
    console.log(`   • Total asignaciones: ${assignmentsCreated}`);
    console.log(`   • Candidatos por vacante: ${candidatesPerVacancy}\n`);

    console.log('✨ Seeding de candidatos completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

seedCandidates();
