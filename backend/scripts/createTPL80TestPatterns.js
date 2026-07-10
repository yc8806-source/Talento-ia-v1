const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestPatterns() {
  try {
    console.log('🧪 CREANDO 3 CANDIDATOS CON PATRONES DIFERENTES\n');

    // Patrones de respuesta
    const patterns = [
      {
        name: 'Carlos',
        email: 'carlos@vencorp.com',
        pattern: 'high',
        description: 'Todas respuestas ALTAS (Muy de acuerdo)'
      },
      {
        name: 'Diana',
        email: 'diana@vencorp.com',
        pattern: 'low',
        description: 'Todas respuestas BAJAS (Muy en desacuerdo)'
      },
      {
        name: 'Eduardo',
        email: 'eduardo@vencorp.com',
        pattern: 'mixed',
        description: 'Respuestas MIXTAS'
      }
    ];

    const results = [];

    for (const patternData of patterns) {
      console.log(`\n📝 Creando candidato: ${patternData.name} (${patternData.description})`);

      // Crear candidato
      const candidateResult = await pool.query(
        `INSERT INTO candidates (first_name, last_name, email, phone)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [patternData.name, 'Test', patternData.email, '555' + Math.random().toString().slice(2, 7)]
      );
      const candidateId = candidateResult.rows[0].id;

      // Crear vacante
      const vacancyResult = await pool.query(
        `INSERT INTO vacancies (title, description, department, status)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Asesor Inbound - Pattern Test', `Patrón: ${patternData.description}`, 'Contact Center', 'open']
      );
      const vacancyId = vacancyResult.rows[0].id;

      // Asignar candidato a vacante
      const token = crypto.randomBytes(16).toString('hex');
      const cvResult = await pool.query(
        `INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status, token)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [candidateId, vacancyId, 'pending', token]
      );
      const cvId = cvResult.rows[0].id;

      // Obtener TPL-80
      const examResult = await pool.query(
        `SELECT id FROM exams WHERE name LIKE '%TPL-80%' LIMIT 1`
      );
      const examId = examResult.rows[0].id;

      // Asignar TPL-80
      await pool.query(
        `INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [vacancyId, examId, 1]
      );

      // Obtener todas las preguntas
      const questionsResult = await pool.query(
        `SELECT eq.question_order, q.id, q.is_inverse
         FROM exam_questions eq
         INNER JOIN questions q ON eq.question_id = q.id
         WHERE eq.exam_id = $1
         ORDER BY eq.question_order`,
        [examId]
      );

      // Generar respuestas según patrón
      let answeredCount = 0;
      for (const question of questionsResult.rows) {
        const optionsResult = await pool.query(
          `SELECT id FROM question_options WHERE question_id = $1 ORDER BY score`,
          [question.id]
        );

        if (optionsResult.rows.length === 0) continue;

        let selectedOptionId;
        if (patternData.pattern === 'high') {
          // Todas altas: seleccionar última opción (5 = Totalmente de acuerdo)
          selectedOptionId = optionsResult.rows[4].id;
        } else if (patternData.pattern === 'low') {
          // Todas bajas: seleccionar primera opción (1 = Totalmente en desacuerdo)
          selectedOptionId = optionsResult.rows[0].id;
        } else {
          // Mixtas: variar según el patrón de respuesta
          if (question.question_order % 5 === 0) selectedOptionId = optionsResult.rows[0].id; // 1 = bajo
          else if (question.question_order % 5 === 1) selectedOptionId = optionsResult.rows[1].id; // 2
          else if (question.question_order % 5 === 2) selectedOptionId = optionsResult.rows[2].id; // 3 = medio
          else if (question.question_order % 5 === 3) selectedOptionId = optionsResult.rows[3].id; // 4
          else selectedOptionId = optionsResult.rows[4].id; // 5 = alto
        }

        await pool.query(
          `INSERT INTO exam_answers (candidate_id, exam_id, question_id, answer_value, time_spent_seconds)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (candidate_id, exam_id, question_id) DO UPDATE SET answer_value = $4`,
          [candidateId, examId, question.id, selectedOptionId, Math.floor(Math.random() * 30) + 10]
        );

        answeredCount++;
      }

      // Marcar como completada
      await pool.query(
        `UPDATE candidate_vacancies SET status = $1 WHERE id = $2`,
        ['completed', cvId]
      );

      results.push({
        name: patternData.name,
        cvId: cvId,
        pattern: patternData.pattern,
        email: patternData.email,
        questionsAnswered: answeredCount
      });

      console.log(`✅ ${answeredCount}/80 respuestas completadas`);
    }

    console.log(`\n🎉 3 CANDIDATOS DE PRUEBA CREADOS\n`);
    console.log(`═══════════════════════════════════════════════════\n`);

    results.forEach(r => {
      console.log(`📊 ${r.name.toUpperCase()} - ${r.pattern.toUpperCase()}`);
      console.log(`   CV ID: ${r.cvId}`);
      console.log(`   Email: ${r.email}`);
      console.log(`   Preguntas: ${r.questionsAnswered}/80`);
      console.log(`   Resultados: https://talento-ia-v1-frontend.onrender.com/resultados/${r.cvId}`);
      console.log();
    });

    console.log(`═══════════════════════════════════════════════════\n`);
    console.log(`✅ Listo para verificar resultados mañana\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestPatterns();
