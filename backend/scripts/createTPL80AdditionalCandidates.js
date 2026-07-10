const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createAdditionalCandidates() {
  try {
    console.log('🎯 CREANDO 3 CANDIDATOS ADICIONALES DE PRUEBA\n');

    const patterns = [
      {
        name: 'Valentina',
        email: 'valentina@vencorp.com',
        pattern: 'high-selective',
        description: 'Respuestas ALTAS en primeras 40, BAJAS en últimas 40',
        getOption: (questionOrder, optionsLength) => {
          // Primeras 40 preguntas: altas (opción 4-5)
          // Últimas 40 preguntas: bajas (opción 1-2)
          return questionOrder <= 40 ? Math.min(4, optionsLength - 1) : 0;
        }
      },
      {
        name: 'Fernando',
        email: 'fernando@vencorp.com',
        pattern: 'low-selective',
        description: 'Respuestas BAJAS en primeras 40, ALTAS en últimas 40',
        getOption: (questionOrder, optionsLength) => {
          // Primeras 40 preguntas: bajas (opción 1-2)
          // Últimas 40 preguntas: altas (opción 4-5)
          return questionOrder <= 40 ? 0 : Math.min(4, optionsLength - 1);
        }
      },
      {
        name: 'Gabriela',
        email: 'gabriela@vencorp.com',
        pattern: 'moderate',
        description: 'Respuestas MODERADAS (opción 3 - Ni acuerdo ni desacuerdo)',
        getOption: (questionOrder, optionsLength) => {
          // Siempre opción media (3)
          return Math.floor(optionsLength / 2);
        }
      }
    ];

    const results = [];

    for (const patternData of patterns) {
      console.log(`\n📝 Creando candidato: ${patternData.name}`);
      console.log(`   ${patternData.description}`);

      // Crear candidato
      const candidateResult = await pool.query(
        `INSERT INTO candidates (first_name, last_name, email, phone)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [patternData.name, 'Prueba', patternData.email, '555' + Math.random().toString().slice(2, 7)]
      );
      const candidateId = candidateResult.rows[0].id;

      // Crear vacante
      const vacancyResult = await pool.query(
        `INSERT INTO vacancies (title, description, department, status)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Asesor Inbound - Análisis de Patrones', `${patternData.description}`, 'Contact Center', 'open']
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
        `SELECT eq.question_order, q.id
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

        const selectedIdx = patternData.getOption(question.question_order, optionsResult.rows.length);
        const selectedOptionId = optionsResult.rows[selectedIdx].id;

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

    console.log(`\n🎉 3 CANDIDATOS ADICIONALES CREADOS\n`);
    console.log(`═══════════════════════════════════════════════════\n`);

    results.forEach(r => {
      console.log(`📊 ${r.name.toUpperCase()}`);
      console.log(`   CV ID: ${r.cvId}`);
      console.log(`   Email: ${r.email}`);
      console.log(`   Preguntas: ${r.questionsAnswered}/80`);
      console.log(`   Resultados: https://talento-ia-v1-frontend.onrender.com/resultados/${r.cvId}`);
      console.log();
    });

    console.log(`═══════════════════════════════════════════════════\n`);
    console.log(`✅ Lista completa de 6 candidatos de prueba creada\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdditionalCandidates();
