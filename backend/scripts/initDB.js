const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  try {
    console.log('🔄 Inicializando base de datos de Railway...');

    const sqlFile = path.join(__dirname, 'initRailway.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    await pool.query(sql);
    console.log('✅ Base de datos inicializada correctamente');
    console.log('✅ Admin user creado: admin@talent-ia.com / password123');

  } catch (error) {
    console.error('❌ Error al inicializar BD:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDB();
