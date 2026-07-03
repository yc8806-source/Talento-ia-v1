const pool = require('../src/config/database');

async function seedCompetencies() {
  try {
    console.log('🌱 Insertando competencias de soft skills...');

    // Competencias para soft skills
    const competencies = [
      { name: 'Comunicación', category: 'Interpersonal' },
      { name: 'Liderazgo', category: 'Management' },
      { name: 'Trabajo en Equipo', category: 'Interpersonal' },
      { name: 'Resolución de Problemas', category: 'Cognitivo' },
      { name: 'Adaptabilidad', category: 'Comportamental' },
      { name: 'Empatía', category: 'Interpersonal' },
      { name: 'Gestión del Tiempo', category: 'Personal' },
      { name: 'Proactividad', category: 'Comportamental' },
      { name: 'Integridad', category: 'Ético' },
      { name: 'Creatividad', category: 'Cognitivo' }
    ];

    let inserted = 0;
    for (const comp of competencies) {
      const result = await pool.query(
        `INSERT INTO competencies (name, category)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [comp.name, comp.category]
      );
      if (result.rows.length > 0) {
        inserted++;
      }
    }

    console.log(`✅ ${inserted} nuevas competencias insertadas`);
    console.log('✅ Competencias disponibles:');
    competencies.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.category})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedCompetencies();
