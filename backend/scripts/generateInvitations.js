const pool = require('../src/config/database');
const crypto = require('crypto');

async function generateInvitations() {
  try {
    console.log('📧 Generando invitaciones de evaluación...\n');

    // Obtener todas las asignaciones de candidatos a vacantes
    const assignmentsResult = await pool.query(
      `SELECT
        cv.id as candidate_vacancy_id,
        cv.candidate_id,
        cv.vacancy_id,
        c.first_name,
        c.last_name,
        c.email,
        v.title as vacancy_title
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       ORDER BY cv.vacancy_id, c.first_name`
    );

    if (assignmentsResult.rows.length === 0) {
      console.log('❌ No hay candidatos asignados a vacantes.');
      process.exit(1);
    }

    console.log(`✅ ${assignmentsResult.rows.length} candidatos encontrados\n`);

    let invitationsCreated = 0;
    let evaluationsStarted = 0;

    // Para cada candidato-vacante, generar invitaciones para los exámenes
    for (const assignment of assignmentsResult.rows) {
      // Obtener los exámenes asignados a esta vacante
      const examsResult = await pool.query(
        `SELECT e.id, e.name, e.description, e.max_time_minutes
         FROM exams e
         INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
         WHERE ve.vacancy_id = $1
         ORDER BY ve.exam_order`,
        [assignment.vacancy_id]
      );

      console.log(
        `📋 ${assignment.first_name} ${assignment.last_name} - ${assignment.vacancy_title}`
      );

      for (const exam of examsResult.rows) {
        try {
          // Generar token de acceso único
          const accessToken = crypto.randomBytes(32).toString('hex');
          const invitationToken = crypto.randomBytes(16).toString('hex');

          // Crear evaluación con estado "in_progress"
          const evaluationResult = await pool.query(
            `INSERT INTO evaluations
             (candidate_vacancy_id, exam_id, status, access_token, started_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id`,
            [assignment.candidate_vacancy_id, exam.id, 'in_progress', accessToken]
          );

          const evaluationId = evaluationResult.rows[0].id;
          evaluationsStarted++;

          // Generar URL de invitación
          const invitationUrl = `http://localhost:3001/evaluacion/${invitationToken}`;

          console.log(`   ✓ ${exam.name}`);
          console.log(`     Token: ${invitationToken.substring(0, 8)}...`);
          console.log(`     URL: ${invitationUrl}\n`);

          invitationsCreated++;
        } catch (error) {
          console.error(`   ✗ Error generando invitación: ${error.message}`);
        }
      }

      console.log('');
    }

    console.log('📊 Resumen de Invitaciones:');
    console.log(`   • Total candidatos procesados: ${assignmentsResult.rows.length}`);
    console.log(`   • Total invitaciones generadas: ${invitationsCreated}`);
    console.log(`   • Total evaluaciones creadas: ${evaluationsStarted}\n`);

    console.log('✨ Invitaciones generadas exitosamente!');
    console.log(
      '💡 Consejo: Los candidatos pueden acceder con sus tokens de invitación.'
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante generación de invitaciones:', error);
    process.exit(1);
  }
}

generateInvitations();
