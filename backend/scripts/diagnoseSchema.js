const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function diagnoseSchema() {
  try {
    console.log('🔍 DIAGNÓSTICO DE SCHEMA\n');
    console.log('=' .repeat(60));

    // Revisar tabla users
    console.log('\n📋 Columnas de tabla USERS:');
    console.log('-' .repeat(60));
    const usersResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY column_name
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ Tabla users NO EXISTE!');
    } else {
      usersResult.rows.forEach(col => {
        const indicator = col.column_name.includes('Name') ? '❌' : '✅';
        console.log(`${indicator} ${col.column_name} (${col.data_type})`);
      });
    }

    // Revisar tabla candidates
    console.log('\n📋 Columnas de tabla CANDIDATES:');
    console.log('-' .repeat(60));
    const candidatesResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'candidates'
      ORDER BY column_name
    `);

    if (candidatesResult.rows.length === 0) {
      console.log('❌ Tabla candidates NO EXISTE!');
    } else {
      candidatesResult.rows.forEach(col => {
        const indicator = col.column_name.includes('name') && !col.column_name.includes('_') ? '❌' : '✅';
        console.log(`${indicator} ${col.column_name} (${col.data_type})`);
      });
    }

    // Contar usuarios
    console.log('\n📊 Estadísticas:');
    console.log('-' .repeat(60));
    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`Total de usuarios: ${countResult.rows[0].count}`);

    const candidatesCount = await pool.query('SELECT COUNT(*) as count FROM candidates');
    console.log(`Total de candidatos: ${candidatesCount.rows[0].count}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    console.log('\nSiguiente paso: Ejecutar node scripts/fixSchemaCorrect.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

diagnoseSchema();
