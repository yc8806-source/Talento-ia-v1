const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('🔄 Agregando columna is_inverse a tabla questions...\n');

    await pool.query(
      `ALTER TABLE questions
       ADD COLUMN IF NOT EXISTS is_inverse BOOLEAN DEFAULT false`
    );

    console.log('✅ Columna is_inverse agregada exitosamente');

    // Verificar que la columna existe
    const checkColumn = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'questions' AND column_name = 'is_inverse'`
    );

    if (checkColumn.rows.length > 0) {
      console.log('✅ Verificación exitosa - columna existe\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
