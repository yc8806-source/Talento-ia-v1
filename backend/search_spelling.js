const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function searchSpellingTest() {
  try {
    console.log('🔍 Buscando tablas de spelling/grammar...');

    // Verificar si existen las tablas
    const tablesResult = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name LIKE '%spelling%'`
    );

    console.log('\n📋 Tablas encontradas:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    }

    // Si existen las tablas, buscar los tests
    if (tablesResult.rows.length > 0) {
      console.log('\n🔍 Buscando tests de ortografía...');

      try {
        const testsResult = await pool.query(
          `SELECT id, title, description, difficulty, test_type, language
           FROM spelling_grammar_tests`
        );

        console.log('\n📚 Tests encontrados:');
        if (testsResult.rows.length > 0) {
          testsResult.rows.forEach(test => {
            console.log(`\n   ID: ${test.id}`);
            console.log(`   Título: ${test.title}`);
            console.log(`   Descripción: ${test.description}`);
            console.log(`   Tipo: ${test.test_type}`);
            console.log(`   Idioma: ${test.language}`);
          });
        } else {
          console.log('   ⚠️ No hay tests en la tabla');
        }
      } catch (error) {
        console.log('   ⚠️ No se pudo consultar spelling_grammar_tests:', error.message);
      }
    } else {
      console.log('   ⚠️ Las tablas de spelling/grammar no existen');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

searchSpellingTest();
