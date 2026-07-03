const pool = require('../src/config/database');

async function seedEcareAssessment() {
  try {
    console.log('🌱 Creando Evaluación de Habilidades de E-care...');

    let examResult = await pool.query(
      `SELECT id FROM exams WHERE name = $1`,
      ['Evaluación de Habilidades de E-care']
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
          'Evaluación de Habilidades de E-care',
          'Evaluación de competencias para especialistas en atención digital - Chat, email, redes sociales. Escritura profesional, velocidad, multitarea digital',
          20,
          68,
          1
        ]
      );
      examId = examResult.rows[0].id;
      console.log(`✅ Examen creado: ID ${examId}`);
    }

    // Competencias para E-care
    const competencies = [
      {
        name: 'Escritura Clara y Profesional',
        id: 61,
        questions: [
          'Mis mensajes son gramaticalmente correctos y profesionales',
          'Uso lenguaje claro sin errores de ortografía',
          '¿Con qué calidad escribes en tus respuestas digitales?'
        ]
      },
      {
        name: 'Empatía Digital',
        id: 62,
        questions: [
          'Transmito comprensión y calidez a través del texto',
          'Mi tono escrito es amable incluso en situaciones difíciles',
          '¿Con qué efectividad comunicas empatía por escrito?'
        ]
      },
      {
        name: 'Velocidad de Respuesta',
        id: 63,
        questions: [
          'Respondo rápidamente sin sacrificar calidad',
          'Mantengo tiempo de respuesta dentro de los estándares',
          '¿Con qué velocidad típicamente respondes?'
        ]
      },
      {
        name: 'Multitarea Digital',
        id: 64,
        questions: [
          'Manejo múltiples chats o emails simultáneamente',
          'No me olvido de clientes cuando hay muchos en cola',
          '¿Con qué efectividad manejas múltiples conversaciones?'
        ]
      },
      {
        name: 'Manejo de Cliente Enojado (Texto)',
        id: 65,
        questions: [
          'No me ofendo por mensajes agresivos o malhumorados',
          'Logro calmar al cliente incluso en modo escrito',
          '¿Con qué habilidad neutralizas mensajes negativos?'
        ]
      },
      {
        name: 'Conocimiento Técnico Digital',
        id: 66,
        questions: [
          'Conozco las herramientas de chat, email y redes que usamos',
          'Puedo usar las funciones de los sistemas efectivamente',
          '¿Con qué destreza usas nuestras plataformas digitales?'
        ]
      },
      {
        name: 'Documentación y Registro',
        id: 67,
        questions: [
          'Registro las conversaciones y problemas correctamente',
          'Dejo notas claras para seguimiento futuro',
          '¿Con qué diligencia documentas cada interacción?'
        ]
      },
      {
        name: 'Organización y Priorización',
        id: 68,
        questions: [
          'Priorizo correctamente los mensajes urgentes',
          'Organizo mi workload para no perder ningún cliente',
          '¿Con qué orden mantienes tu bandeja de entrada?'
        ]
      },
      {
        name: 'Resolución Rápida',
        id: 69,
        questions: [
          'Busco resolver problemas en la primera interacción',
          'Evito hacer que el cliente escriba múltiples mensajes',
          '¿Con qué frecuencia resuelves en la primera respuesta?'
        ]
      },
      {
        name: 'Adaptabilidad a Canales',
        id: 70,
        questions: [
          'Adapto mi tono según el canal (chat vs email vs redes)',
          'Entiendo las expectativas diferentes de cada plataforma',
          '¿Con qué facilidad te adaptas entre canales digitales?'
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
    console.log('\n✨ Evaluación de E-care lista');
    console.log(`   Exam ID: ${examId}`);
    console.log('   Duración: 20 minutos');
    console.log(`   Total preguntas: ${totalQuestionsCreated}`);
    console.log('   Score mínimo: 68%');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedEcareAssessment();
