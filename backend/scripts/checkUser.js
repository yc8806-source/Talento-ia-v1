const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkUser() {
  try {
    console.log('🔍 Verificando usuario admin...\n');

    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      ['admin@talent-ia.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuario admin NO existe en la BD');
      console.log('\n📝 Insertando usuario admin...');

      await pool.query(
        'INSERT INTO users (email, password_hash, firstName, lastName, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin@talent-ia.com', '$2a$10$8YJbmhW3hkVqBpYaJOQGe.A8KqQ5XELZKdVHEqmCNvT8l6qZ/YA0i', 'Admin', 'Talent IA', 'administrador']
      );
      console.log('✅ Usuario admin insertado correctamente');
    } else {
      const user = result.rows[0];
      console.log('✅ Usuario admin EXISTE:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password Hash: ${user.password_hash}`);
      console.log(`   Role: ${user.role}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
