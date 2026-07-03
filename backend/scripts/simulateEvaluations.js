const pool = require('../src/config/database');

// Función para obtener score aleatorio ponderado
function getRandomScore() {
  const randomVal = Math.random();
  // 60% de probabilidad de buenos scores (70-100)
  // 25% de probabilidad de scores medios (50-70)
  // 15% de probabilidad de scores bajos (20-50)

  if (randomVal < 0.6) {
    return Math.floor(Math.random() * 30 + 70); // 70-100
  } else if (randomVal < 0.85) {
    return Math.floor(Math.random() * 20 + 50); // 50-70
  } else {
    return Math.floor(Math.random() * 30 + 20); // 20-50
  }
}

async function simulateEvaluations() {
  try {
    console.log('🎯 Simulando evaluaciones de candidatos...\n');

    // Obtener todas las evaluaciones en estado "in_progress"
    const evaluationsResult = await pool.query(
      `SELECT
        e.id,
        e.candidate_vacancy_id,
        e.exam_id,
        e.access_token,
        c.first_name,
        c.last_name,
        ex.name as exam_name
       FROM evaluations e
       INNER JOIN candidate_vacancies cv ON e.candidate_vacancy_id = cv.id
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN exams ex ON e.exam_id = ex.id
       WHERE e.status = 'in_progress'
       LIMIT 20`
    );

    if (evaluationsResult.rows.length === 0) {
      console.log('❌ No hay evaluaciones en progreso.');
      process.exit(1);
    }

    console.log(`✅ ${evaluationsResult.rows.length} evaluaciones encontradas\n`);

    let answersSubmitted = 0;
    let evaluationsCompleted = 0;

    for (const evaluation of evaluationsResult.rows) {
      console.log(
        `📝 ${evaluation.first_name} ${evaluation.last_name} - ${evaluation.exam_name}`
      );

      try {
        // Obtener preguntas del examen
        const questionsResult = await pool.query(
          `SELECT q.id, q.competency_id
           FROM exam_questions eq
           INNER JOIN questions q ON eq.question_id = q.id
           WHERE eq.exam_id = $1
           ORDER BY eq.question_order`,
          [evaluation.exam_id]
        );

        // Para cada pregunta, seleccionar una opción aleatoria
        for (const question of questionsResult.rows) {
          // Obtener opciones de la pregunta con sus puntajes
          const optionsResult = await pool.query(
            'SELECT id, score FROM question_options WHERE question_id = $1 ORDER BY option_order',
            [question.id]
          );

          if (optionsResult.rows.length > 0) {
            // Seleccionar opción aleatoria (con sesgo hacia mejores respuestas)
            let selectedOptionIndex;
            if (Math.random() < 0.7) {
              // 70% de probabilidad de seleccionar una de las mejores opciones
              selectedOptionIndex = Math.max(
                0,
                optionsResult.rows.length - 2
              );
            } else {
              // 30% de probabilidad de seleccionar cualquier opción
              selectedOptionIndex = Math.floor(
                Math.random() * optionsResult.rows.length
              );
            }

            const selectedOption = optionsResult.rows[selectedOptionIndex];
            const responseTime = Math.floor(Math.random() * 60 + 10); // 10-70 segundos

            // Guardar respuesta con score_obtained
            await pool.query(
              `INSERT INTO evaluation_answers
               (evaluation_id, question_id, question_option_id, score_obtained, response_time_seconds)
               VALUES ($1, $2, $3, $4, $5)`,
              [evaluation.id, question.id, selectedOption.id, selectedOption.score, responseTime]
            );

            answersSubmitted++;
          }
        }

        // Marcar evaluación como completada
        await pool.query(
          'UPDATE evaluations SET status = $1, completed_at = NOW() WHERE id = $2',
          ['completed', evaluation.id]
        );

        evaluationsCompleted++;

        // Calcular y guardar resultados
        const answersResult = await pool.query(
          `SELECT ea.score_obtained, q.competency_id
           FROM evaluation_answers ea
           INNER JOIN questions q ON ea.question_id = q.id
           WHERE ea.evaluation_id = $1`,
          [evaluation.id]
        );

        // Agrupar por competencia
        const competencyScores = {};
        answersResult.rows.forEach(row => {
          if (!competencyScores[row.competency_id]) {
            competencyScores[row.competency_id] = 0;
          }
          competencyScores[row.competency_id] += row.score_obtained;
        });

        // Guardar resultados
        for (const [competencyId, totalScore] of Object.entries(
          competencyScores
        )) {
          const maxScore = 500; // Máximo aproximado

          try {
            await pool.query(
              `INSERT INTO evaluation_results
               (candidate_vacancy_id, competency_id, total_score, max_possible_score, calculated_at)
               VALUES ($1, $2, $3, $4, NOW())
               ON CONFLICT (candidate_vacancy_id, competency_id) DO UPDATE SET
                 total_score = EXCLUDED.total_score`,
              [
                evaluation.candidate_vacancy_id,
                competencyId,
                totalScore,
                maxScore
              ]
            );
          } catch (resultError) {
            // Ignorar errores en la grabación de resultados
          }
        }

        console.log(
          `   ✓ Completada (${questionsResult.rows.length} preguntas respondidas)\n`
        );
      } catch (error) {
        console.error(
          `   ✗ Error: ${error.message}`
        );
      }
    }

    console.log('📊 Resumen de Evaluaciones Simuladas:');
    console.log(`   • Total evaluaciones completadas: ${evaluationsCompleted}`);
    console.log(`   • Total respuestas guardadas: ${answersSubmitted}`);
    console.log(`   • Promedio de respuestas por evaluación: ${(answersSubmitted / evaluationsCompleted).toFixed(1)}\n`);

    console.log('✨ Simulación completada exitosamente!');
    console.log(
      '💡 Ahora puedes revisar los resultados en el dashboard de candidatos.'
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante simulación:', error);
    process.exit(1);
  }
}

simulateEvaluations();
