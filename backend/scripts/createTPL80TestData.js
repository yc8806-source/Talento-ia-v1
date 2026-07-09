const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTPL80TestData() {
  try {
    console.log('🌱 CREANDO DATOS DE PRUEBA PARA TPL-80\n');

    // 1. Crear candidato
    const candidateResult = await pool.query(
      `INSERT INTO candidates (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Juan', 'Pérez', 'juan.perez@example.com', '5559876543']
    );
    const candidateId = candidateResult.rows[0].id;
    console.log(`✅ Candidato creado: Juan Pérez (ID ${candidateId})`);

    // 2. Crear vacante
    const vacancyResult = await pool.query(
      `INSERT INTO vacancies (title, description, department, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Gerente de Operaciones - Test TPL-80', 'Evaluación de personalidad laboral completa', 'Operaciones', 'open']
    );
    const vacancyId = vacancyResult.rows[0].id;
    console.log(`✅ Vacante creada (ID ${vacancyId})`);

    // 3. Asignar candidato a vacante con token
    const token = crypto.randomBytes(16).toString('hex');
    const cvResult = await pool.query(
      `INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status, token)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [candidateId, vacancyId, 'pending', token]
    );
    const cvId = cvResult.rows[0].id;
    console.log(`✅ Candidato asignado a vacante (ID ${cvId})`);

    // 4. Obtener TPL-80
    const examResult = await pool.query(
      `SELECT id FROM exams WHERE name LIKE '%TPL-80%' LIMIT 1`
    );

    if (examResult.rows.length === 0) {
      console.error('❌ No se encontró el TPL-80. Ejecuta seedTPL80.js primero.');
      process.exit(1);
    }

    const examId = examResult.rows[0].id;

    // 5. Asignar TPL-80 a la vacante
    await pool.query(
      `INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [vacancyId, examId, 1]
    );
    console.log(`✅ TPL-80 asignado a vacante\n`);

    // 6. Obtener todas las preguntas del TPL-80
    const questionsResult = await pool.query(
      `SELECT q.id, q.competency_id, q.is_inverse, eq.question_order
       FROM exam_questions eq
       INNER JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1
       ORDER BY eq.question_order`,
      [examId]
    );

    console.log(`📝 Simulando respuestas del candidato:\n`);

    // 7. Simular respuestas (patrón: mayoría respuestas altas con algunas bajas)
    let answeredCount = 0;
    for (const question of questionsResult.rows) {
      // Obtener opciones disponibles
      const optionsResult = await pool.query(
        `SELECT id, score FROM question_options WHERE question_id = $1 ORDER BY score`,
        [question.id]
      );

      // Generar respuesta pseudo-aleatoria pero consistente
      let selectedOptionIndex;
      if (question.question_order % 10 < 3) {
        selectedOptionIndex = 0; // Bajo (1)
      } else if (question.question_order % 10 < 7) {
        selectedOptionIndex = 3; // Alto (4)
      } else {
        selectedOptionIndex = 4; // Muy alto (5)
      }

      const selectedOption = optionsResult.rows[selectedOptionIndex];
      if (!selectedOption) continue;

      // Guardar respuesta
      await pool.query(
        `INSERT INTO exam_answers (candidate_id, exam_id, question_id, answer_value, time_spent_seconds)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (candidate_id, exam_id, question_id) DO UPDATE SET answer_value = $4`,
        [candidateId, examId, question.id, selectedOption.id, Math.floor(Math.random() * 30) + 10]
      );

      answeredCount++;
      if (answeredCount % 20 === 0) {
        console.log(`   ${answeredCount}/80 respuestas guardadas...`);
      }
    }

    console.log(`   ✅ ${answeredCount}/80 respuestas completadas\n`);

    // 8. Marcar evaluación como completada
    await pool.query(
      `UPDATE candidate_vacancies SET status = $1 WHERE id = $2`,
      ['completed', cvId]
    );

    console.log(`📊 DATOS DE PRUEBA CREADOS:\n`);
    console.log(`   Candidato: Juan Pérez`);
    console.log(`   Email: juan.perez@example.com`);
    console.log(`   Vacante: Gerente de Operaciones - Test TPL-80`);
    console.log(`   Candidate-Vacancy ID: ${cvId}`);
    console.log(`   Token: ${token}\n`);
    console.log(`🔗 URLS PARA ACCEDER:\n`);
    console.log(`   Evaluación por token:`);
    console.log(`   https://talento-ia-v1-frontend.onrender.com/evaluacion?token=${token}\n`);
    console.log(`   Resultados (requiere autenticación):`);
    console.log(`   https://talento-ia-v1-frontend.onrender.com/resultados/${cvId}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTPL80TestData();
