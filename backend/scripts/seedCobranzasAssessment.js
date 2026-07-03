const pool = require('../src/config/database');

async function seedCobranzasAssessment() {
  try {
    console.log('🌱 Creando Evaluación de Habilidades de Cobranzas Telefónicas...');

    // Verificar si el examen ya existe
    let examResult = await pool.query(
      `SELECT id FROM exams WHERE name = $1`,
      ['Evaluación de Habilidades de Cobranzas Telefónicas']
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
          'Evaluación de Habilidades de Cobranzas Telefónicas',
          'Evaluación de competencias críticas para asesores de cobranzas - Persuasión, manejo de presión, empatía estratégica, negociación de pagos, etc.',
          22,
          70,
          1
        ]
      );

      examId = examResult.rows[0].id;
      console.log(`✅ Examen creado: ID ${examId}`);
    }

    // Competencias para cobranzas (IDs 41-50)
    const competencies = [
      {
        name: 'Persuasión Ética',
        id: 41,
        questions: [
          'Logro convencer a deudores de pagar sin ser agresivo',
          'Uso argumentos lógicos para demostrar por qué es importante pagar',
          '¿Con qué efectividad convences a alguien de hacer algo que no quiere?'
        ]
      },
      {
        name: 'Manejo de Objeciones de Pago',
        id: 42,
        questions: [
          'Ante "no tengo dinero", tengo respuestas y alternativas preparadas',
          'Diferencio excusas válidas de pretextos para no pagar',
          '¿Con qué frecuencia conviertes una objeción en un compromiso de pago?'
        ]
      },
      {
        name: 'Empatía Estratégica',
        id: 43,
        questions: [
          'Puedo ser empático sin perder el objetivo de cobro',
          'Entiendo las dificultades del deudor pero mantengo firmeza',
          '¿Con qué balance manejas empatía y firmeza en cobranzas?'
        ]
      },
      {
        name: 'Negociación de Planes de Pago',
        id: 44,
        questions: [
          'Estructuro planes de pago que benefician a ambas partes',
          'Negoció números realistas que el deudor pueda cumplir',
          '¿Con qué frecuencia logras acuerdos de pago sostenibles?'
        ]
      },
      {
        name: 'Inteligencia Emocional',
        id: 45,
        questions: [
          'Mantengo la calma con deudores agresivos o insultantes',
          'No me ofendo personalmente por la actitud del cliente',
          '¿Con qué efectividad manejas tus emociones bajo presión?'
        ]
      },
      {
        name: 'Comunicación Clara y Directa',
        id: 46,
        questions: [
          'Comunico claramente el monto adeudado y las opciones de pago',
          'Mis mensajes son concisos y sin ambigüedades',
          '¿Con qué claridad transmites información en una llamada de cobranza?'
        ]
      },
      {
        name: 'Persistencia sin Agresión',
        id: 47,
        questions: [
          'Insisto profesionalmente en el pago sin ser agresivo',
          'No me rindo fácilmente pero respeto los límites legales',
          '¿Con qué balance equilibras insistencia y respeto?'
        ]
      },
      {
        name: 'Documentación y Seguimiento',
        id: 48,
        questions: [
          'Registro meticulosamente cada llamada y promesa de pago',
          'Realizo seguimientos consistentes a compromisos incumplidos',
          '¿Con qué disciplina documentas y das seguimiento?'
        ]
      },
      {
        name: 'Orientación a Resultados',
        id: 49,
        questions: [
          'Me enfoco obsesivamente en cumplir metas de cobranza',
          'Persevero hasta lograr el pago o confirmar imposibilidad',
          '¿Con qué consistencia alcanzan tus metas de cobranza?'
        ]
      },
      {
        name: 'Gestión del Estrés y Resiliencia',
        id: 50,
        questions: [
          'Manejo el estrés de rechazos y presión de metas',
          'No me desmoralizó por clientes que cuelgan o gritan',
          '¿Con qué facilidad recuperas motivación después de rechazos?'
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
    console.log('\n✨ Evaluación de Habilidades de Cobranzas Telefónicas lista para usar');
    console.log(`   Exam ID: ${examId}`);
    console.log('   Duración: 22 minutos');
    console.log('   Tipo: Likert Scale (1-5)');
    console.log(`   Total preguntas: ${totalQuestionsCreated}`);
    console.log('   Score mínimo: 70%');
    console.log('\n   📌 Competencias específicas para Cobranzas:');
    competencies.forEach((c, i) => {
      console.log(`      ${i + 1}. ${c.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedCobranzasAssessment();
