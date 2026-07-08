const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function assign() {
  try {
    console.log('🔄 Asignando exámenes a vacante 7...\n');

    const examIds = [4, 3, 2]; // Los que el usuario seleccionó
    
    for (let i = 0; i < examIds.length; i++) {
      await pool.query(
        'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3)',
        [7, examIds[i], i + 1]
      );
    }

    console.log('✅ Exámenes asignados a vacante 7');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

assign();
