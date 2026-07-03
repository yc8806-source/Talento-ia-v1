const pool = require('../src/config/database');

async function seedServicioClienteAssessment() {
  try {
    console.log('🌱 Creando Evaluación de Habilidades de Servicio al Cliente...');

    let examResult = await pool.query(
      `SELECT id FROM exams WHERE name = $1`,
      ['Evaluación de Habilidades de Servicio al Cliente']
    );

    let examId;
    if (examResult.rows.length > 0) {
      examId = examResult.rows[0].id;
      console.log(`ℹ️  Examen ya existe: ID ${examId}`);
    } else {
      examResult = await pool.query(
        `INSERT INTO exams (name, description, max_time_minutes, min_score, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          'Evaluación de Habilidades de Servicio al Cliente',
          'Evaluación de competencias para especialistas en servicio al cliente - Empatía, paciencia, resolución de problemas, manejo de quejas',
          18,
          65,
          1
        ]
      );
      examId = examResult.rows[0].id;
      console.log(`✅ Examen creado: ID ${examId}`);
    }

    // Competencias para Servicio al Cliente
    const competencies = [
      {
        name: 'Empatía y Comprensión',
        id: 51,
        questions: [
          'Me pongo en el lugar del cliente para entender sus frustraciones',
          'Reconozco y valido los sentimientos del cliente',
          '¿Con qué facilidad logras conectar emocionalmente con clientes molestos?'
        ]
      },
      {
        name: 'Paciencia',
        id: 52,
        questions: [
          'Mantengo la calma con clientes que hablan lentamente o repiten cosas',
          'No me impaciento con clientes que necesitan explicaciones detalladas',
          '¿Con qué paciencia tratas a clientes difíciles?'
        ]
      },
      {
        name: 'Comunicación Clara',
        id: 53,
        questions: [
          'Explico soluciones de forma clara y comprensible',
          'Evito jerga técnica cuando hablo con clientes',
          '¿Con qué claridad transmites información compleja?'
        ]
      },
      {
        name: 'Resolución de Problemas',
        id: 54,
        questions: [
          'Identifico rápidamente la raíz del problema del cliente',
          'Busco activamente soluciones que satisfagan al cliente',
          '¿Con qué efectividad resuelves problemas del cliente?'
        ]
      },
      {
        name: 'Manejo de Quejas',
        id: 55,
        questions: [
          'Escucho quejas sin ponerme a la defensiva',
          'Utilizo quejas como oportunidades para mejorar la relación',
          '¿Con qué efectividad conviertes una queja en satisfacción?'
        ]
      },
      {
        name: 'Profesionalismo',
        id: 56,
        questions: [
          'Mantengo una actitud profesional incluso en situaciones difíciles',
          'Represento bien a la empresa en cada interacción',
          '¿Con qué consistencia mantienes estándares profesionales?'
        ]
      },
      {
        name: 'Escucha Activa',
        id: 57,
        questions: [
          'Escucho completamente antes de ofrecer soluciones',
          'Hago preguntas clarificadoras para entender mejor',
          '¿Con qué efectividad aplicas la escucha activa?'
        ]
      },
      {
        name: 'Conocimiento de Producto',
        id: 58,
        questions: [
          'Conozco bien los productos y servicios que ofrecemos',
          'Puedo explicar características y beneficios claramente',
          '¿Con qué profundidad dominas nuestros productos?'
        ]
      },
      {
        name: 'Gestión del Tiempo',
        id: 59,
        questions: [
          'Resuelvo problemas eficientemente sin apurar al cliente',
          'Manejo múltiples clientes sin perder atención',
          '¿Con qué balance logras velocidad sin sacrificar calidad?'
        ]
      },
      {
        name: 'Actitud Positiva',
        id: 60,
        questions: [
          'Transmito optimismo y disposición de ayudar',
          'Mi actitud positiva influye favorablemente en el cliente',
          '¿Con qué consistencia mantienes una actitud positiva?'
        ]
      }
    ];

    let totalQuestionsCreated = 0;

    for (const comp of competencies) {
      for (const questionText of comp.questions) {
        const qResult = await pool.query(
          `INSERT INTO questions (title, type, competency_id)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [questionText, 'likert', comp.id]
        );

        if (qResult.rows.length > 0) {
          const questionId = qResult.rows[0].id;
          await pool.query(
            `INSERT INTO exam_questions (exam_id, question_id, question_order)
             VALUES ($1, $2, $3)`,
            [examId, questionId, totalQuestionsCreated + 1]
          );
          totalQuestionsCreated++;
        }
      }
    }

    console.log(`✅ ${totalQuestionsCreated} preguntas creadas`);
    console.log('\n✨ Evaluación de Servicio al Cliente lista');
    console.log(`   Exam ID: ${examId}`);
    console.log('   Duración: 18 minutos');
    console.log(`   Total preguntas: ${totalQuestionsCreated}`);
    console.log('   Score mínimo: 65%');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedServicioClienteAssessment();
