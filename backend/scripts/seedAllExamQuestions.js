const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function seedAllExamQuestions() {
  try {
    console.log('🌱 Cargando preguntas para todos los exámenes...\n');

    // 1. TEST DE LÓGICA Y RAZONAMIENTO
    console.log('1️⃣  Creando preguntas de Lógica y Razonamiento...');
    const logicQuestions = [
      'Si 5 + 3 = 8, entonces 8 + 4 = ?',
      '¿Cuál es el siguiente número en la serie: 2, 4, 8, 16, ?',
      '¿Cuál de estas figuras no pertenece al grupo?',
      'Si A > B y B > C, ¿cuál es la relación entre A y C?',
      'En una carrera, Juan llegó antes que María. María llegó antes que Pedro. ¿Quién llegó primero?'
    ];

    let logicExamId = await getExamId('Test de Lógica y Razonamiento');
    for (let i = 0; i < logicQuestions.length; i++) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [logicQuestions[i], 'multiple_choice', 4] // competency_id = 4 es Resolución de Problemas
      );

      const questionId = qResult.rows[0].id;

      // Opciones de respuesta
      const options = [
        { text: 'Opción A', score: 0 },
        { text: 'Opción B', score: 100 },
        { text: 'Opción C', score: 0 },
        { text: 'Opción D', score: 0 }
      ];

      for (const opt of options) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [questionId, opt.text, opt.score]
        );
      }

      // Vincular con examen
      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [logicExamId, questionId, i + 1]
      );
    }
    console.log('✅ 5 preguntas de Lógica creadas\n');

    // 2. TEST DE COMPETENCIAS TÉCNICAS
    console.log('2️⃣  Creando preguntas de Competencias Técnicas...');
    const techQuestions = [
      '¿Cuál es el resultado de 2^8?',
      '¿Qué es una variable en programación?',
      '¿Cuál es la diferencia entre un array y una lista?',
      '¿Qué es un bucle for?',
      '¿Cuál es el propósito de una función?'
    ];

    let techExamId = await getExamId('Test de Competencias Técnicas');
    for (let i = 0; i < techQuestions.length; i++) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [techQuestions[i], 'multiple_choice', 1] // Comunicación/Técnica
      );

      const questionId = qResult.rows[0].id;

      const options = [
        { text: 'Opción A', score: 0 },
        { text: 'Opción B', score: 100 },
        { text: 'Opción C', score: 0 },
        { text: 'Opción D', score: 0 }
      ];

      for (const opt of options) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [questionId, opt.text, opt.score]
        );
      }

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [techExamId, questionId, i + 1]
      );
    }
    console.log('✅ 5 preguntas Técnicas creadas\n');

    // 3. TEST DE CONOCIMIENTOS ESPECÍFICOS
    console.log('3️⃣  Creando preguntas de Conocimientos Específicos...');
    const specificQuestions = [
      '¿Cuáles son las responsabilidades principales de este puesto?',
      '¿Qué habilidades considers más importantes para tener éxito aquí?',
      '¿Cuál es tu experiencia previa en este tipo de rol?',
      '¿Cómo manejarías una situación conflictiva con un cliente?',
      '¿Qué te motiva a trabajar en esta posición?'
    ];

    let specificExamId = await getExamId('Test Específico');
    for (let i = 0; i < specificQuestions.length; i++) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [specificQuestions[i], 'multiple_choice', 2] // Liderazgo
      );

      const questionId = qResult.rows[0].id;

      const options = [
        { text: 'Opción A', score: 0 },
        { text: 'Opción B', score: 100 },
        { text: 'Opción C', score: 0 },
        { text: 'Opción D', score: 0 }
      ];

      for (const opt of options) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [questionId, opt.text, opt.score]
        );
      }

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [specificExamId, questionId, i + 1]
      );
    }
    console.log('✅ 5 preguntas Específicas creadas\n');

    console.log('🎉 ¡TODAS LAS PREGUNTAS CARGADAS!\n');
    console.log('📊 Resumen:');
    console.log('   ✅ Test de Lógica: 5 preguntas');
    console.log('   ✅ Test Técnico: 5 preguntas');
    console.log('   ✅ Test Específico: 5 preguntas');
    console.log('   ✅ Total: 15 nuevas preguntas cargadas\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function getExamId(examName) {
  const result = await pool.query('SELECT id FROM exams WHERE name = $1', [examName]);
  if (result.rows.length === 0) {
    throw new Error(`Examen no encontrado: ${examName}`);
  }
  return result.rows[0].id;
}

seedAllExamQuestions();
