const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function diagnose() {
  try {
    console.log('🔍 DIAGNÓSTICO DE IDs DE OPCIONES\n');

    // Verificar si los IDs de opciones son únicos globalmente
    const duplicateIds = await pool.query(`
      SELECT id, COUNT(*) as count
      FROM question_options
      GROUP BY id
      HAVING COUNT(*) > 1
    `);

    console.log(`IDs de opciones duplicados: ${duplicateIds.rows.length}\n`);

    if (duplicateIds.rows.length > 0) {
      console.log('⚠️  PROBLEMA ENCONTRADO - IDs duplicados:');
      duplicateIds.rows.forEach(row => {
        console.log(`   ID ${row.id} aparece ${row.count} veces`);
      });
    }

    // Ver estructura de opciones
    console.log('\n📋 OPCIONES POR PREGUNTA:\n');
    const options = await pool.query(`
      SELECT
        q.id as question_id,
        q.title,
        COUNT(qo.id) as option_count,
        string_agg(DISTINCT qo.id::text, ', ') as option_ids
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      GROUP BY q.id, q.title
      LIMIT 10
    `);

    options.rows.forEach(row => {
      console.log(`Q${row.question_id}: ${row.title}`);
      console.log(`   Opciones: ${row.option_count}, IDs: [${row.option_ids}]\n`);
    });

    // Contar total
    const total = await pool.query('SELECT COUNT(*) as count FROM question_options');
    console.log(`Total de opciones en la BD: ${total.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnose();
