const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestData() {
  try {
    console.log('🌱 CREANDO DATOS DE PRUEBA...\n');

    // 1. Crear candidato
    const candidateResult = await pool.query(
      `INSERT INTO candidates (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Test', 'Candidate', 'test@example.com', '5551234567']
    );
    const candidateId = candidateResult.rows[0].id;
    console.log(`✅ Candidato creado: ID ${candidateId}`);

    // 2. Crear vacante
    const vacancyResult = await pool.query(
      `INSERT INTO vacancies (title, description, department, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Asesor Inbound - Test', 'Posición de prueba para evaluación', 'Contact Center', 'open']
    );
    const vacancyId = vacancyResult.rows[0].id;
    console.log(`✅ Vacante creada: ID ${vacancyId}`);

    // 3. Asignar candidato a vacante
    const token = crypto.randomBytes(16).toString('hex');
    const cvResult = await pool.query(
      `INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status, token)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [candidateId, vacancyId, 'pending', token]
    );
    const cvId = cvResult.rows[0].id;
    console.log(`✅ Asignación creada: ID ${cvId}`);

    // 4. Obtener IDs de exámenes
    const examsResult = await pool.query(
      `SELECT id, name FROM exams ORDER BY id LIMIT 5`
    );
    console.log(`\n✅ Exámenes disponibles: ${examsResult.rows.length}`);

    // 5. Asignar exámenes a la vacante
    for (let i = 0; i < examsResult.rows.length; i++) {
      await pool.query(
        `INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order)
         VALUES ($1, $2, $3)`,
        [vacancyId, examsResult.rows[i].id, i + 1]
      );
      console.log(`   - Asignado: ${examsResult.rows[i].name}`);
    }

    console.log(`\n📊 DATOS DE PRUEBA CREADOS:\n`);
    console.log(`   Candidato: Test Candidate (${candidateId})`);
    console.log(`   Email: test@example.com`);
    console.log(`   Vacante: Asesor Inbound - Test (${vacancyId})`);
    console.log(`   CV ID: ${cvId}`);
    console.log(`   Token: ${token}\n`);
    console.log(`🔗 URL DE PRUEBA:`);
    console.log(`   http://localhost:3001/evaluacion/${token}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestData();
