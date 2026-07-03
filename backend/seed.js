require('dotenv').config();
const pool = require('./src/config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seeding de preguntas...');

    // Insertar preguntas
    const questions = [
      {
        title: '¿Cuál es la importancia de la comunicación efectiva en ventas?',
        type: 'multiple_choice',
        competencyId: 1,
        description: 'Pregunta sobre comunicación'
      },
      {
        title: 'La empatía es fundamental en el servicio al cliente',
        type: 'true_false',
        competencyId: 10,
        description: 'Pregunta sobre empatía'
      },
      {
        title: '¿Qué tan importante es la persuasión para cerrar ventas?',
        type: 'likert',
        competencyId: 2,
        description: 'Pregunta Likert sobre persuasión'
      },
      {
        title: '¿Cuál es el primer paso en una negociación?',
        type: 'multiple_choice',
        competencyId: 3,
        description: 'Pregunta sobre negociación'
      },
      {
        title: 'La redacción clara es esencial en comunicaciones escritas',
        type: 'true_false',
        competencyId: 5,
        description: 'Pregunta sobre redacción'
      },
      {
        title: '¿Cómo manejarías una objeción del cliente?',
        type: 'multiple_choice',
        competencyId: 1,
        description: 'Pregunta sobre manejo de objeciones'
      }
    ];

    const questionIds = [];

    for (const q of questions) {
      const result = await pool.query(
        'INSERT INTO questions (title, type, competency_id, description) VALUES ($1, $2, $3, $4) RETURNING id',
        [q.title, q.type, q.competencyId, q.description]
      );
      questionIds.push(result.rows[0].id);
      console.log(`✅ Pregunta creada: ${q.title} (ID: ${result.rows[0].id})`);
    }

    // Insertar opciones para múltiples opciones
    const multipleChoiceOptions = [
      { questionIndex: 0, options: [
        { text: 'Mejora la claridad del mensaje', score: 25 },
        { text: 'Permite llegar a acuerdos mejores', score: 25 },
        { text: 'Aumenta la confianza del cliente', score: 25 },
        { text: 'Todas las anteriores', score: 25 }
      ]},
      { questionIndex: 3, options: [
        { text: 'Escuchar activamente al otro lado', score: 25 },
        { text: 'Preparar tu posición', score: 25 },
        { text: 'Comprender los objetivos comunes', score: 25 },
        { text: 'Todas las anteriores', score: 25 }
      ]},
      { questionIndex: 5, options: [
        { text: 'Comunicación clara', score: 25 },
        { text: 'Escucha activa', score: 25 },
        { text: 'Comprensión del cliente', score: 25 },
        { text: 'Todas las anteriores', score: 25 }
      ]}
    ];

    for (const mc of multipleChoiceOptions) {
      for (let i = 0; i < mc.options.length; i++) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
          [questionIds[mc.questionIndex], mc.options[i].text, mc.options[i].score, i + 1]
        );
      }
      console.log(`✅ Opciones agregadas para pregunta ${mc.questionIndex}`);
    }

    // Insertar opciones para true/false
    const trueFalseOptions = [
      { questionIndex: 1, options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 0 }
      ]},
      { questionIndex: 4, options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 0 }
      ]}
    ];

    for (const tf of trueFalseOptions) {
      for (let i = 0; i < tf.options.length; i++) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
          [questionIds[tf.questionIndex], tf.options[i].text, tf.options[i].score, i + 1]
        );
      }
      console.log(`✅ Opciones Verdadero/Falso agregadas para pregunta ${tf.questionIndex}`);
    }

    // Insertar opciones para Likert
    const likertOptions = [
      { text: 'Muy en desacuerdo', score: 0 },
      { text: 'En desacuerdo', score: 25 },
      { text: 'Neutral', score: 50 },
      { text: 'De acuerdo', score: 75 },
      { text: 'Muy de acuerdo', score: 100 }
    ];

    for (let i = 0; i < likertOptions.length; i++) {
      await pool.query(
        'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
        [questionIds[2], likertOptions[i].text, likertOptions[i].score, i + 1]
      );
    }
    console.log(`✅ Opciones Likert agregadas para pregunta 2`);

    console.log('\n✨ Seeding completado exitosamente!');
    console.log(`📊 Total de preguntas creadas: ${questionIds.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
