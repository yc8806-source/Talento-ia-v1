const pool = require('../src/config/database');

async function seedTeleventasAssessment() {
  try {
    console.log('🌱 Creando Evaluación de Habilidades de Televentas...');

    // Verificar si el examen ya existe
    let examResult = await pool.query(
      `SELECT id FROM exams WHERE name = $1`,
      ['Evaluación de Habilidades de Televentas']
    );

    let examId;
    if (examResult.rows.length > 0) {
      examId = examResult.rows[0].id;
      console.log(`ℹ️  Examen ya existe: ID ${examId}`);
    } else {
      // Crear el examen
      examResult = await pool.query(
        `INSERT INTO exams (name, description, max_time_minutes, min_score, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          'Evaluación de Habilidades de Televentas',
          'Evaluación de competencias críticas para asesores de televentas - Manejo de objeciones, persuasión, cierre de ventas, etc.',
          20,
          65,
          1
        ]
      );

      examId = examResult.rows[0].id;
      console.log(`✅ Examen creado: ID ${examId}`);
    }

    // Competencias para televentas
    const competencies = [
      {
        name: 'Manejo de Objeciones',
        id: 11,
        questions: [
          'Cuando un cliente dice "es muy caro", tengo respuestas preparadas',
          'Anticipo las objeciones antes de que el cliente las mencione',
          '¿Con qué frecuencia conviertes una objeción en una oportunidad de venta?'
        ]
      },
      {
        name: 'Persuasión y Negociación',
        id: 12,
        questions: [
          'Puedo convencer a clientes de ver el valor de nuestros productos',
          'Negoció siempre buscando un resultado win-win',
          '¿Con qué facilidad logras que clientes acepten propuestas?'
        ]
      },
      {
        name: 'Escucha Activa',
        id: 13,
        questions: [
          'Identifico las verdaderas necesidades del cliente escuchando atentamente',
          'Hago preguntas estratégicas para entender el problema del cliente',
          '¿Con qué frecuencia escuchas más que hablas en una llamada?'
        ]
      },
      {
        name: 'Comunicación Clara',
        id: 14,
        questions: [
          'Mi mensaje de ventas es claro y conciso',
          'Adapto mi lenguaje al nivel de comprensión del cliente',
          '¿Con qué claridad explicas características y beneficios?'
        ]
      },
      {
        name: 'Empatía y Rapport',
        id: 15,
        questions: [
          'Logro crear conexión emocional con los clientes rápidamente',
          'Comprendo y valido las preocupaciones del cliente',
          '¿Con qué frecuencia los clientes se sienten cómodos contigo?'
        ]
      },
      {
        name: 'Cierre de Ventas',
        id: 16,
        questions: [
          'Identifico el momento correcto para cerrar la venta',
          'No tengo miedo de pedir la venta directamente',
          '¿Con qué éxito cierras las oportunidades que generaste?'
        ]
      },
      {
        name: 'Gestión del Rechazo',
        id: 17,
        questions: [
          'Un "no" me motiva a mejorar mi abordaje',
          'No me desanimo por rechazos consecutivos',
          '¿Con qué rapidez te recuperas de una venta perdida?'
        ]
      },
      {
        name: 'Orientación a Resultados',
        id: 18,
        questions: [
          'Persigo agresivamente el cumplimiento de mis metas de ventas',
          'Me establezco objetivos desafiantes y los alcanzo',
          '¿Con qué consistencia cumples o superas tus cuotas?'
        ]
      },
      {
        name: 'Control Emocional',
        id: 19,
        questions: [
          'Mantengo la calma ante clientes difíciles o agresivos',
          'No permito que el rechazo afecte mi profesionalismo',
          '¿Con qué efectividad manejas situaciones de estrés?'
        ]
      },
      {
        name: 'Seguimiento y Follow-up',
        id: 20,
        questions: [
          'Doy seguimiento consistente a oportunidades abiertas',
          'Registro y organizo mi pipeline de clientes meticulosamente',
          '¿Con qué disciplina realizas el seguimiento post-venta?'
        ]
      }
    ];

    let totalQuestionsCreated = 0;

    // Insertar preguntas en tabla questions primero
    for (const comp of competencies) {
      for (const questionText of comp.questions) {
        const qResult = await pool.query(
          `INSERT INTO questions (title, type, competency_id)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [questionText, 'likert', comp.id]
        );

        // Luego vincular a exam
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

    console.log(`✅ ${totalQuestionsCreated} preguntas Likert creadas`);
    console.log(`✅ Competencias: ${competencies.map(c => c.name).join(', ')}`);
    console.log('\n✨ Evaluación de Habilidades de Televentas lista para usar');
    console.log(`   Exam ID: ${examId}`);
    console.log('   Duración: 20 minutos');
    console.log('   Tipo: Likert Scale (1-5)');
    console.log(`   Total preguntas: ${totalQuestionsCreated}`);
    console.log('\n   📌 Competencias específicas para Televentas:');
    competencies.forEach((c, i) => {
      console.log(`      ${i + 1}. ${c.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTeleventasAssessment();
