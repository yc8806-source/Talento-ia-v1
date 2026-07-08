const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  try {
    console.log('🔍 Verificando tabla vacancies...\n');

    // 1. Verificar que existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'vacancies'
      )
    `);
    console.log('✅ Tabla existe:', tableExists.rows[0].exists);

    // 2. Ver estructura
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vacancies'
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Columnas:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // 3. Contar registros
    const count = await pool.query('SELECT COUNT(*) as total FROM vacancies');
    console.log(`\n📊 Total de vacancies: ${count.rows[0].total}`);

    // 4. Ver datos
    const data = await pool.query('SELECT * FROM vacancies');
    console.log('\n📄 Datos:');
    console.log(JSON.stringify(data.rows, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
