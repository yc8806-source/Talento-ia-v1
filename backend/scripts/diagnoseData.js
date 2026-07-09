const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function diagnoseData() {
  try {
    console.log('🔍 DIAGNÓSTICO DE DATOS EN BASE DE DATOS\n');

    // 1. Contar tablas
    console.log('📊 CONTEOS:\n');

    const exams = await pool.query('SELECT COUNT(*) as count FROM exams');
    console.log(`   Exámenes: ${exams.rows[0].count}`);

    const questions = await pool.query('SELECT COUNT(*) as count FROM questions');
    console.log(`   Preguntas: ${questions.rows[0].count}`);

    const candidates = await pool.query('SELECT COUNT(*) as count FROM candidates');
    console.log(`   Candidatos: ${candidates.rows[0].count}`);

    const vacancies = await pool.query('SELECT COUNT(*) as count FROM vacancies');
    console.log(`   Vacantes: ${vacancies.rows[0].count}`);

    const candidateVacancies = await pool.query('SELECT COUNT(*) as count FROM candidate_vacancies');
    console.log(`   Candidato-Vacantes: ${candidateVacancies.rows[0].count}`);

    const examAnswers = await pool.query('SELECT COUNT(*) as count FROM exam_answers');
    console.log(`   Respuestas de Examen: ${examAnswers.rows[0].count}`);

    const competencies = await pool.query('SELECT COUNT(*) as count FROM competencies');
    console.log(`   Competencias: ${competencies.rows[0].count}`);

    // 2. Detalles de vacantes
    console.log('\n\n🏢 VACANTES:\n');
    const vacancyDetails = await pool.query(`
      SELECT id, title, description, status
      FROM vacancies
      LIMIT 10
    `);

    if (vacancyDetails.rows.length === 0) {
      console.log('   ❌ No hay vacantes');
    } else {
      vacancyDetails.rows.forEach(v => {
        console.log(`   • ${v.title} (ID: ${v.id}) - Estado: ${v.status}`);
      });
    }

    // 3. Detalles de candidatos y su estado
    console.log('\n\n👥 CANDIDATOS-VACANTES:\n');
    const cvDetails = await pool.query(`
      SELECT
        cv.id,
        c.first_name,
        c.last_name,
        v.title,
        cv.status,
        cv.token
      FROM candidate_vacancies cv
      INNER JOIN candidates c ON cv.candidate_id = c.id
      INNER JOIN vacancies v ON cv.vacancy_id = v.id
      LIMIT 10
    `);

    if (cvDetails.rows.length === 0) {
      console.log('   ❌ No hay candidatos asignados a vacantes');
    } else {
      cvDetails.rows.forEach(cv => {
        console.log(`   • ${cv.first_name} ${cv.last_name} → ${cv.title}`);
        console.log(`     ID: ${cv.id}, Estado: ${cv.status}, Token: ${cv.token.substring(0, 16)}...`);
      });
    }

    // 4. Respuestas por candidato
    console.log('\n\n📝 RESPUESTAS DE EXAMEN:\n');
    const answersDetails = await pool.query(`
      SELECT
        c.first_name,
        c.last_name,
        e.name as exam_name,
        COUNT(ea.id) as respuestas
      FROM exam_answers ea
      INNER JOIN candidates c ON ea.candidate_id = c.id
      INNER JOIN exams e ON ea.exam_id = e.id
      GROUP BY c.first_name, c.last_name, e.name
      LIMIT 10
    `);

    if (answersDetails.rows.length === 0) {
      console.log('   ❌ No hay respuestas de examen registradas');
    } else {
      answersDetails.rows.forEach(a => {
        console.log(`   • ${a.first_name} ${a.last_name} - ${a.exam_name}: ${a.respuestas} respuestas`);
      });
    }

    // 5. Exámenes asignados a vacantes
    console.log('\n\n🎯 EXÁMENES ASIGNADOS A VACANTES:\n');
    const assignedExams = await pool.query(`
      SELECT
        v.title as vacante,
        e.name as examen,
        ve.exam_order as orden
      FROM vacancy_exams ve
      INNER JOIN vacancies v ON ve.vacancy_id = v.id
      INNER JOIN exams e ON ve.exam_id = e.id
      ORDER BY v.id, ve.exam_order
      LIMIT 10
    `);

    if (assignedExams.rows.length === 0) {
      console.log('   ❌ No hay exámenes asignados a vacantes');
    } else {
      assignedExams.rows.forEach(a => {
        console.log(`   • ${a.vacante} → ${a.examen} (orden: ${a.orden})`);
      });
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnoseData();
