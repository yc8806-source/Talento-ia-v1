const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function updateHash() {
  try {
    console.log('🔄 Generando nuevo hash bcrypt para password123...');

    const password = 'password123';
    const newHash = await bcrypt.hash(password, 10);

    console.log(`✅ Nuevo hash generado: ${newHash}`);

    console.log('\n🔄 Actualizando usuario admin en BD...');

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [newHash, 'admin@talent-ia.com']
    );

    console.log('✅ Usuario admin actualizado correctamente');
    console.log('\n🧪 Verificando comparación de password...');

    const match = await bcrypt.compare(password, newHash);
    console.log(`✅ bcrypt.compare() result: ${match}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateHash();
