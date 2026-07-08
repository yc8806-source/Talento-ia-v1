const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function seedExams() {
  try {
    console.log('🔄 Agregando exámenes de prueba...\n');

    const exams = [
      {
        name: 'Test de Competencias Técnicas',
        description: 'Evaluación de habilidades técnicas en programación',
        max_time_minutes: 60,
        type: 'technical'
      },
      {
        name: 'Test de Soft Skills',
        description: 'Evaluación de habilidades blandas y comunicación',
        max_time_minutes: 45,
        type: 'soft_skills'
      },
      {
        name: 'Test de Lógica y Razonamiento',
        description: 'Evaluación de pensamiento lógico y resolución de problemas',
        max_time_minutes: 50,
        type: 'logical'
      },
      {
        name: 'Test de Conocimientos Específicos',
        description: 'Evaluación de conocimientos específicos del puesto',
        max_time_minutes: 40,
        type: 'specific'
      }
    ];

    for (const exam of exams) {
      const result = await pool.query(
        'INSERT INTO exams (name, description, max_time_minutes, type) VALUES ($1, $2, $3, $4) RETURNING *',
        [exam.name, exam.description, exam.max_time_minutes, exam.type]
      );
      console.log(`✅ Examen creado: "${exam.name}" (ID: ${result.rows[0].id})`);
    }

    // Verificar total
    const count = await pool.query('SELECT COUNT(*) as total FROM exams');
    console.log(`\n📊 Total de exámenes en la BD: ${count.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

seedExams();
