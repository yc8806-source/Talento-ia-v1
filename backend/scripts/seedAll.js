const { Pool } = require('pg');

// Conexión directa a Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function seedAll() {
  try {
    console.log('🌱 Cargando todas las pruebas en Railway...\n');

    // 1. EXÁMENES BASE
    console.log('1️⃣  Creando exámenes base...');
    const exams = [
      { name: 'Test de Competencias Técnicas', desc: 'Evaluación de habilidades técnicas', time: 60 },
      { name: 'Test de Soft Skills', desc: 'Evaluación de habilidades blandas', time: 45 },
      { name: 'Test de Lógica', desc: 'Evaluación de pensamiento lógico', time: 50 },
      { name: 'Test Específico', desc: 'Conocimientos del puesto', time: 40 }
    ];

    for (const exam of exams) {
      await pool.query(
        'INSERT INTO exams (name, description, max_time_minutes) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [exam.name, exam.desc, exam.time]
      );
    }
    console.log('✅ Exámenes creados\n');

    // 2. COMPETENCIAS
    console.log('2️⃣  Creando competencias...');
    const competencies = [
      'Comunicación', 'Liderazgo', 'Trabajo en Equipo', 'Resolución de Problemas',
      'Adaptabilidad', 'Empatía', 'Gestión del Tiempo'
    ];

    for (const comp of competencies) {
      await pool.query(
        'INSERT INTO competencies (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [comp]
      );
    }
    console.log('✅ Competencias creadas\n');

    // 3. PREGUNTAS DE SOFT SKILLS
    console.log('3️⃣  Creando preguntas de Soft Skills...');
    const softSkillsQuestions = [
      { title: '¿Qué tan clara es tu comunicación verbal?', comp: 'Comunicación' },
      { title: '¿Qué tan cómodo te sientes liderando equipos?', comp: 'Liderazgo' },
      { title: '¿Qué tan bien colaboras en equipo?', comp: 'Trabajo en Equipo' },
      { title: '¿Qué tan efectivo eres resolviendo problemas?', comp: 'Resolución de Problemas' },
      { title: '¿Qué tan adaptable eres a cambios?', comp: 'Adaptabilidad' },
      { title: '¿Qué tan empático eres?', comp: 'Empatía' },
      { title: '¿Qué tan bueno es tu manejo del tiempo?', comp: 'Gestión del Tiempo' }
    ];

    for (const q of softSkillsQuestions) {
      const compResult = await pool.query('SELECT id FROM competencies WHERE name = $1', [q.comp]);
      if (compResult.rows.length > 0) {
        const qResult = await pool.query(
          'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
          [q.title, 'likert', compResult.rows[0].id]
        );

        // Agregar opciones Likert (1-5)
        const questionId = qResult.rows[0].id;
        const options = [
          { value: 'Muy en desacuerdo', score: 1 },
          { value: 'En desacuerdo', score: 2 },
          { value: 'Neutral', score: 3 },
          { value: 'De acuerdo', score: 4 },
          { value: 'Muy de acuerdo', score: 5 }
        ];

        for (const opt of options) {
          await pool.query(
            'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [questionId, opt.value, opt.score]
          );
        }
      }
    }
    console.log('✅ Preguntas de Soft Skills creadas\n');

    // 4. VINCULAR EXÁMENES CON PREGUNTAS
    console.log('4️⃣  Vinculando exámenes con preguntas...');
    const examQuestion = await pool.query(
      'SELECT id FROM exams WHERE name = $1 LIMIT 1',
      ['Test de Soft Skills']
    );

    if (examQuestion.rows.length > 0) {
      const examId = examQuestion.rows[0].id;
      const allQuestions = await pool.query(
        'SELECT id FROM questions LIMIT 7'
      );

      for (let i = 0; i < allQuestions.rows.length; i++) {
        await pool.query(
          'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [examId, allQuestions.rows[i].id, i + 1]
        );
      }
    }
    console.log('✅ Exámenes vinculados con preguntas\n');

    console.log('🎉 ¡TODAS LAS PRUEBAS CARGADAS EXITOSAMENTE!\n');
    console.log('📊 Resumen:');
    console.log('   ✅ 4 Exámenes base creados');
    console.log('   ✅ 7 Competencias creadas');
    console.log('   ✅ 7 Preguntas de Soft Skills creadas');
    console.log('   ✅ Examen vinculado con preguntas\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAll();
