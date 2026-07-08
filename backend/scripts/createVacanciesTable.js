const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createVacanciesTable() {
  try {
    console.log('🔄 Creando tabla vacancies...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vacancies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabla vacancies creada correctamente');

    // Verificar que se creó
    const result = await pool.query('SELECT COUNT(*) FROM vacancies');
    console.log(`📊 Vacancies en la BD: ${result.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createVacanciesTable();
