const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

// Simple hash function (not for production)
function simpleHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function testUserCreation() {
  try {
    console.log('\n🧪 TEST DE CREACIÓN DE USUARIOS\n');
    console.log('=' .repeat(70));

    // Test 1: Verificar que la tabla existe con columnas correctas
    console.log('\n1️⃣ Verificando estructura de tabla users...');
    const schemaCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('first_name', 'last_name', 'firstName', 'lastName')
      ORDER BY column_name
    `);

    if (schemaCheck.rows.length === 0) {
      console.log('❌ ERROR: No se encontraron columnas de nombres!');
      return;
    }

    const hasCorrectColumns = schemaCheck.rows.some(r => r.column_name === 'first_name');
    if (hasCorrectColumns) {
      console.log('✅ Columnas correctas (snake_case): first_name, last_name');
    } else {
      console.log('❌ ERROR: Columnas en camelCase (firstName, lastName)');
      return;
    }

    // Test 2: Crear un usuario de prueba
    console.log('\n2️⃣ Creando usuario de prueba...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const hashedPassword = simpleHash(testPassword);

    const createResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [testEmail, hashedPassword, 'Test', 'User', 'candidate']
    );

    if (createResult.rows.length === 0) {
      console.log('❌ ERROR: No se creó el usuario');
      return;
    }

    const newUser = createResult.rows[0];
    console.log(`✅ Usuario creado exitosamente:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Nombre: ${newUser.first_name} ${newUser.last_name}`);
    console.log(`   Role: ${newUser.role}`);

    // Test 3: Verificar que el usuario fue guardado correctamente
    console.log('\n3️⃣ Verificando integridad de datos...');
    const verifyResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [newUser.id]
    );

    if (verifyResult.rows.length === 0) {
      console.log('❌ ERROR: Usuario no se puede recuperar de la BD');
      return;
    }

    const retrievedUser = verifyResult.rows[0];

    if (retrievedUser.first_name === 'Test' && retrievedUser.last_name === 'User') {
      console.log('✅ Datos guardados correctamente en BD');
      console.log(`   first_name: ${retrievedUser.first_name}`);
      console.log(`   last_name: ${retrievedUser.last_name}`);
    } else {
      console.log('❌ ERROR: Datos no coinciden');
      console.log(`   Esperado: first_name='Test', last_name='User'`);
      console.log(`   Recibido: first_name='${retrievedUser.first_name}', last_name='${retrievedUser.last_name}'`);
      return;
    }

    // Test 4: Verificar roles
    console.log('\n4️⃣ Verificando validación de roles...');
    const adminCheck = await pool.query('SELECT role FROM users WHERE email = $1', ['admin@talent-ia.com']);

    if (adminCheck.rows.length > 0) {
      const adminRole = adminCheck.rows[0].role;
      console.log(`✅ Admin user existe con role: '${adminRole}'`);

      if (adminRole === 'admin') {
        console.log('   ✅ Role es correcto: \'admin\'');
      } else if (adminRole === 'administrador') {
        console.log('   ⚠️  WARNING: Role sigue siendo \'administrador\' (español)');
        console.log('   Considerando actualizar manualmente en BD');
      }
    } else {
      console.log('⚠️  Admin user no encontrado (podría ser normal si es primera vez)');
    }

    // Test 5: Probar creación de usuario RRHH
    console.log('\n5️⃣ Creando usuario RRHH de prueba...');
    const rrhhEmail = `rrhh_${Date.now()}@example.com`;
    const rrhhResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role`,
      [rrhhEmail, hashedPassword, 'HR', 'Analyst', 'rrhh_analyst']
    );

    if (rrhhResult.rows.length > 0) {
      const rrhhUser = rrhhResult.rows[0];
      console.log('✅ Usuario RRHH creado exitosamente');
      console.log(`   Email: ${rrhhUser.email}`);
      console.log(`   Nombre: ${rrhhUser.first_name} ${rrhhUser.last_name}`);
      console.log(`   Role: ${rrhhUser.role}`);
    } else {
      console.log('❌ ERROR: No se creó el usuario RRHH');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ TODOS LOS TESTS COMPLETADOS EXITOSAMENTE\n');

  } catch (error) {
    console.error('\n❌ ERROR EN LOS TESTS:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testUserCreation();
