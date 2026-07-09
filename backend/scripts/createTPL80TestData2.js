const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTPL80TestData2() {
  try {
    console.log('🌱 CREANDO DATOS DE PRUEBA PARA TPL-80 (v2)\n');

    // 1. Crear candidato
    const candidateResult = await pool.query(
      `INSERT INTO candidates (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Andrea', 'Cuellar', 'andrea@vencorp.com', '5551234567']
    );
    const candidateId = candidateResult.rows[0].id;
    console.log(`✅ Candidato creado: Andrea Cuellar (ID ${candidateId})`);

    // 2. Crear vacante
    const vacancyResult = await pool.query(
      `INSERT INTO vacancies (title, description, department, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Asesor Inbound - Test', 'Evaluación de personalidad laboral completa', 'Contact Center', 'open']
    );
    const vacancyId = vacancyResult.rows[0].id;
    console.log(`✅ Vacante creada (ID ${vacancyId})`);

    // 3. Asignar candidato a vacante
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
      console.error('❌ No se encontró el TPL-80.');
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

    // 6. Obtener TODAS las preguntas del TPL-80 con sus opciones
    const questionsWithOptionsResult = await pool.query(
      `SELECT
        eq.question_order,
        q.id as question_id,
        q.competency_id,
        comp.name as competency_name,
        q.is_inverse,
        array_agg(qo.id) as option_ids,
        array_agg(qo.score) as option_scores
       FROM exam_questions eq
       INNER JOIN questions q ON eq.question_id = q.id
       INNER JOIN competencies comp ON q.competency_id = comp.id
       LEFT JOIN question_options qo ON q.id = qo.question_id
       WHERE eq.exam_id = $1
       GROUP BY eq.question_order, q.id, q.competency_id, comp.name, q.is_inverse
       ORDER BY eq.question_order`,
      [examId]
    );

    console.log(`📝 Procesando ${questionsWithOptionsResult.rows.length} preguntas:\n`);

    let answeredCount = 0;
    const competencyCount = {};

    for (const question of questionsWithOptionsResult.rows) {
      // Validar que la pregunta tenga opciones
      if (!question.option_ids || question.option_ids.length === 0) {
        console.warn(`⚠️ Pregunta ${question.question_id} sin opciones`);
        continue;
      }

      // Seleccionar opción basada en el orden
      let selectedIndex;
      if (question.question_order % 10 < 3) {
        selectedIndex = 0; // Score 1
      } else if (question.question_order % 10 < 7) {
        selectedIndex = 3; // Score 4
      } else {
        selectedIndex = 4; // Score 5
      }

      // Asegurar que el índice esté dentro del rango
      if (selectedIndex >= question.option_ids.length) {
        selectedIndex = question.option_ids.length - 1;
      }

      const selectedOptionId = question.option_ids[selectedIndex];

      // Guardar respuesta
      await pool.query(
        `INSERT INTO exam_answers (candidate_id, exam_id, question_id, answer_value, time_spent_seconds)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (candidate_id, exam_id, question_id) DO UPDATE SET answer_value = $4`,
        [candidateId, examId, question.question_id, selectedOptionId, Math.floor(Math.random() * 30) + 10]
      );

      // Contar por competencia
      if (!competencyCount[question.competency_id]) {
        competencyCount[question.competency_id] = {
          name: question.competency_name,
          count: 0
        };
      }
      competencyCount[question.competency_id].count++;

      answeredCount++;
    }

    console.log(`✅ ${answeredCount}/80 respuestas completadas\n`);

    console.log(`📊 RESPUESTAS POR COMPETENCIA:`);
    Object.values(competencyCount).forEach(comp => {
      console.log(`   ${comp.name}: ${comp.count} respuestas`);
    });

    // Marcar como completada
    await pool.query(
      `UPDATE candidate_vacancies SET status = $1 WHERE id = $2`,
      ['completed', cvId]
    );

    console.log(`\n📊 DATOS DE PRUEBA CREADOS:\n`);
    console.log(`   Candidato: Andrea Cuellar`);
    console.log(`   Vacante: Asesor Inbound - Test`);
    console.log(`   Candidate-Vacancy ID: ${cvId}\n`);
    console.log(`🔗 RESULTADOS:`);
    console.log(`   https://talento-ia-v1-frontend.onrender.com/resultados/${cvId}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTPL80TestData2();
