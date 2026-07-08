const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('🔍 Verificando columnas de tabla candidates...\n');

    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'candidates'
      ORDER BY ordinal_position
    `);

    console.log('Columnas en tabla candidates:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
