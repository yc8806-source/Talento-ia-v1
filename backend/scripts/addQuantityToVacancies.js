const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function addColumn() {
  try {
    console.log('🔄 Agregando columnas a tabla vacancies...\n');

    // Verificar si las columnas ya existen
    const checkColumn = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'vacancies' AND column_name = 'available_positions'
      )
    `);

    if (checkColumn.rows[0].exists) {
      console.log('✅ La columna available_positions ya existe');
    } else {
      await pool.query(`
        ALTER TABLE vacancies
        ADD COLUMN available_positions INTEGER DEFAULT 1,
        ADD COLUMN filled_positions INTEGER DEFAULT 0
      `);
      console.log('✅ Columnas agregadas: available_positions, filled_positions');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addColumn();
