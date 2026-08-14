const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkAssignments() {
  try {
    console.log('📊 ESTRUCTURA DE evaluation_assignments:\n');
    const cols = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'evaluation_assignments'
       ORDER BY ordinal_position`
    );

    cols.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

    console.log('\n📈 DATOS EN evaluation_assignments:\n');
    const data = await pool.query(
      `SELECT * FROM evaluation_assignments LIMIT 5`
    );

    if (data.rows.length > 0) {
      console.log(JSON.stringify(data.rows[0], null, 2));
    } else {
      console.log('  (tabla vacía)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAssignments();
