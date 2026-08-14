const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
  try {
    // 1. Ver todas las tablas
    console.log('📋 TABLAS EN LA BD:\n');
    const tables = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );

    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // 2. Ver estructura de evaluations
    console.log('\n📊 ESTRUCTURA DE evaluations:\n');
    const evalCols = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'evaluations'
       ORDER BY ordinal_position`
    );

    evalCols.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

    // 3. Ver si existe evaluation_exams
    console.log('\n🔍 Buscando tabla evaluation_exams:\n');
    const evalExamCheck = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'evaluation_exams'
       )`
    );

    if (evalExamCheck.rows[0].exists) {
      console.log('  ✅ evaluation_exams EXISTE');
      const evalExamCols = await pool.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = 'evaluation_exams'
         ORDER BY ordinal_position`
      );
      evalExamCols.rows.forEach(row => console.log(`     - ${row.column_name}: ${row.data_type}`));
    } else {
      console.log('  ❌ evaluation_exams NO EXISTE');
    }

    // 4. Ver datos en evaluations
    console.log('\n📈 ÚLTIMAS EVALUACIONES:\n');
    const evals = await pool.query(
      `SELECT id, candidate_vacancy_id, exam_id, status, created_at
       FROM evaluations
       ORDER BY created_at DESC
       LIMIT 5`
    );

    evals.rows.forEach(row => {
      console.log(`  - ID ${row.id}: CV${row.candidate_vacancy_id}, Exam${row.exam_id}, ${row.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();
