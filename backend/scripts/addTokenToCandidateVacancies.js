const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function addColumn() {
  try {
    console.log('🔄 Agregando columna token a candidate_vacancies...\n');

    // Verificar si la columna ya existe
    const checkColumn = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'candidate_vacancies' AND column_name = 'token'
      )
    `);

    if (checkColumn.rows[0].exists) {
      console.log('✅ La columna token ya existe');
    } else {
      await pool.query(`
        ALTER TABLE candidate_vacancies
        ADD COLUMN token VARCHAR(256) UNIQUE
      `);
      console.log('✅ Columna token agregada correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addColumn();
