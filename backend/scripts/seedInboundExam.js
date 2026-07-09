const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function seedInboundExam() {
  try {
    console.log('🌱 Creando Examen Profesional - Asesor Inbound...\n');

    // 1. Crear el examen
    const examResult = await pool.query(
      `INSERT INTO exams (name, description, max_time_minutes, type)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        'Evaluación Asesor Inbound - Profesional',
        'Evaluación integral de competencias para Asesores de Contact Center Inbound. Incluye evaluación de comunicación, empatía, resolución de problemas y orientación al cliente.',
        45,
        'inbound'
      ]
    );

    const examId = examResult.rows[0].id;
    console.log(`✅ Examen creado: ID ${examId}\n`);

    // 2. SECCIÓN 1: COMUNICACIÓN VERBAL (5 preguntas - Multiple Choice)
    console.log('1️⃣  COMUNICACIÓN VERBAL (5 preguntas)');
    const communicationQuestions = [
      {
        title: 'Un cliente te llama molesto porque no entiende un proceso. ¿Cuál es tu mejor respuesta?',
        options: [
          { text: 'Le explico rápidamente para ahorrar tiempo', score: 20 },
          { text: 'Escucho su inquietud y explico paso a paso de forma clara', score: 100 },
          { text: 'Lo transfiero a otro asesor', score: 0 },
          { text: 'Le digo que lea el manual de instrucciones', score: 10 }
        ]
      },
      {
        title: 'Durante una llamada, el cliente habla muy rápido y no entiendes bien. ¿Qué haces?',
        options: [
          { text: 'Finges que entendiste para evitar molestar', score: 0 },
          { text: 'Políticamente pido que hable más lentamente y repita la información', score: 100 },
          { text: 'Cuelgas la llamada', score: 0 },
          { text: 'Realizas lo que crees que pidió', score: 20 }
        ]
      },
      {
        title: 'Un cliente está buscando un producto específico. ¿Cómo lo abordas?',
        options: [
          { text: 'Le ofreces el primero que encuentres', score: 10 },
          { text: 'Haces preguntas para entender exactamente qué necesita', score: 100 },
          { text: 'Le vendes el más caro', score: 0 },
          { text: 'Le dices que no tienes disponible sin verificar', score: 5 }
        ]
      },
      {
        title: 'Tu cliente te dice "No me interesa". ¿Cuál es la mejor respuesta?',
        options: [
          { text: 'Cuelgas la llamada', score: 0 },
          { text: 'Insistes agresivamente', score: 5 },
          { text: 'Preguntas qué específicamente no le interesa y ofreces alternativas', score: 100 },
          { text: 'Le cobras igual por tu tiempo', score: 0 }
        ]
      },
      {
        title: 'Un cliente da retroalimentación negativa sobre el servicio. ¿Qué haces?',
        options: [
          { text: 'La ignoras', score: 0 },
          { text: 'Te pones a la defensiva', score: 10 },
          { text: 'Escuchas, reconoces su perspectiva y buscas mejorar', score: 100 },
          { text: 'Le dices que tiene razón pero no haces nada', score: 20 }
        ]
      }
    ];

    let questionOrder = 1;
    for (const q of communicationQuestions) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [q.title, 'multiple_choice', 1] // Comunicación
      );

      const questionId = qResult.rows[0].id;

      for (const opt of q.options) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3)',
          [questionId, opt.text, opt.score]
        );
      }

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
        [examId, questionId, questionOrder++]
      );
    }
    console.log('   ✅ 5 preguntas de Comunicación creadas\n');

    // 3. SECCIÓN 2: ESCUCHA ACTIVA (4 preguntas - Multiple Choice)
    console.log('2️⃣  ESCUCHA ACTIVA (4 preguntas)');
    const listeningQuestions = [
      {
        title: 'Un cliente comienza explicando un problema complejo. ¿Cuál es tu actitud?',
        options: [
          { text: 'Interrumpes para acelerar', score: 5 },
          { text: 'Dejas que termine y tomas notas de puntos clave', score: 100 },
          { text: 'Piensas en lo que vas a decir mientras habla', score: 20 },
          { text: 'Atiende otras cosas mientras escuchas', score: 0 }
        ]
      },
      {
        title: 'El cliente expresa una necesidad implícita (no lo dice directamente). ¿Haces?',
        options: [
          { text: 'Esperas a que lo diga claramente', score: 30 },
          { text: 'Haces preguntas de clarificación para confirmar tu entendimiento', score: 100 },
          { text: 'Asumes lo que crees que quiere', score: 20 },
          { text: 'Finges entender perfectamente', score: 0 }
        ]
      },
      {
        title: 'Un cliente expresa frustración. ¿Cuál es tu respuesta más empática?',
        options: [
          { text: '"No te preocupes, es fácil de resolver"', score: 20 },
          { text: '"Entiendo tu frustración, déjame ayudarte"', score: 100 },
          { text: '"Este es un problema común"', score: 30 },
          { text: 'Cambias rápidamente de tema', score: 5 }
        ]
      },
      {
        title: 'Durante la llamada, el cliente hace varias preguntas. ¿Qué haces?',
        options: [
          { text: 'Respondes rápidamente todas a la vez', score: 20 },
          { text: 'Respondes una por una, confirmando que entendiste bien', score: 100 },
          { text: 'Respondes las que recuerdas', score: 10 },
          { text: 'Solo respondes la primera', score: 5 }
        ]
      }
    ];

    for (const q of listeningQuestions) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [q.title, 'multiple_choice', 2] // Escucha activa
      );

      const questionId = qResult.rows[0].id;

      for (const opt of q.options) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3)',
          [questionId, opt.text, opt.score]
        );
      }

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
        [examId, questionId, questionOrder++]
      );
    }
    console.log('   ✅ 4 preguntas de Escucha Activa creadas\n');

    // 4. SECCIÓN 3: EMPATÍA E INTELIGENCIA EMOCIONAL (5 preguntas - Multiple Choice)
    console.log('3️⃣  EMPATÍA E INTELIGENCIA EMOCIONAL (5 preguntas)');
    const empathyQuestions = [
      {
        title: 'Un cliente te cuenta que ha tenido problemas con tu compañía anteriormente. ¿Respondes:',
        options: [
          { text: '"Eso no fue culpa mía"', score: 0 },
          { text: '"Lamento la experiencia que tuviste. Quiero hacer las cosas bien esta vez"', score: 100 },
          { text: '"Eso ocurrió hace mucho"', score: 10 },
          { text: '"Tienes que aceptar que los errores suceden"', score: 5 }
        ]
      },
      {
        title: 'Un cliente está en una situación estresante. ¿Cuál es tu mejor acción?',
        options: [
          { text: 'Resuelves rápidamente sin considerar su estado emocional', score: 20 },
          { text: 'Reconoces su estrés, lo tranquilizas y luego resuelves', score: 100 },
          { text: 'Le dices que se calme', score: 15 },
          { text: 'Ignoras su estado emocional', score: 0 }
        ]
      },
      {
        title: 'Un cliente se equivocó en su pedido. ¿Cómo lo abordas?',
        options: [
          { text: '"Tu culpa por no leer bien"', score: 0 },
          { text: '"Entiendo el error. Veamos cómo podemos arreglarlo"', score: 100 },
          { text: '"No puedo hacer nada"', score: 5 },
          { text: '"Eso cuesta dinero arreglarlo"', score: 10 }
        ]
      },
      {
        title: 'Detectas que un cliente está desmotivado. ¿Qué haces?',
        options: [
          { text: 'Lo ignoras y sigues con el proceso', score: 0 },
          { text: 'Indagas qué lo desmotiva y ofreces soluciones', score: 100 },
          { text: 'Le das un descuento sin preguntar', score: 30 },
          { text: 'Aceleras la llamada', score: 10 }
        ]
      },
      {
        title: 'Un cliente te agradece por tu ayuda. ¿Cómo respondes?',
        options: [
          { text: '"Está bien, es mi trabajo"', score: 30 },
          { text: '"Fue un placer ayudarte. Espero poder seguir sirviendo"', score: 100 },
          { text: 'No respondes', score: 0 },
          { text: '"Habla con el gerente si quieres dar feedback"', score: 5 }
        ]
      }
    ];

    for (const q of empathyQuestions) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [q.title, 'multiple_choice', 6] // Empatía
      );

      const questionId = qResult.rows[0].id;

      for (const opt of q.options) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3)',
          [questionId, opt.text, opt.score]
        );
      }

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
        [examId, questionId, questionOrder++]
      );
    }
    console.log('   ✅ 5 preguntas de Empatía creadas\n');

    // 5. SECCIÓN 4: ORIENTACIÓN AL CLIENTE Y RESOLUCIÓN (5 preguntas - Multiple Choice)
    console.log('4️⃣  ORIENTACIÓN AL CLIENTE Y RESOLUCIÓN (5 preguntas)');
    const orientationQuestions = [
      {
        title: 'Tu objetivo es resolver la necesidad del cliente o vender. ¿Cuál priorizas?',
        options: [
          { text: 'Resolver su necesidad aunque no haya venta', score: 100 },
          { text: 'Vender aunque no resuelva su necesidad', score: 0 },
          { text: 'Ambas por igual', score: 70 },
          { text: 'Depende del cliente', score: 40 }
        ]
      },
      {
        title: 'Un cliente tiene un problema que requiere verificación. ¿Haces:',
        options: [
          { text: 'Lo dejas esperando sin decirle nada', score: 0 },
          { text: 'Le dices que espere, informas qué verificarás y le das un tiempo estimado', score: 100 },
          { text: 'Cuelgas y lo llamas después', score: 30 },
          { text: 'Le dices que no puedes verificar', score: 10 }
        ]
      },
      {
        title: 'Un cliente solicita algo que no es posible hacer. ¿Cuál es tu enfoque?',
        options: [
          { text: '"No es posible"', score: 10 },
          { text: '"No es posible, pero puedo ofrecerte esta alternativa"', score: 100 },
          { text: 'Desconectas la llamada', score: 0 },
          { text: '"Habla con el gerente"', score: 20 }
        ]
      },
      {
        title: 'Encuentras una oportunidad para mejorar la experiencia del cliente. ¿Haces:',
        options: [
          { text: 'No haces nada', score: 0 },
          { text: 'La propones y explicas cómo beneficia al cliente', score: 100 },
          { text: 'La haces sin preguntar', score: 40 },
          { text: 'Esperas que te lo pida', score: 30 }
        ]
      },
      {
        title: 'Después de resolver, ¿qué haces?',
        options: [
          { text: 'Cuelgas inmediatamente', score: 0 },
          { text: 'Confirmas que quedó satisfecho y ofreces seguimiento', score: 100 },
          { text: '"Gracias, adiós"', score: 40 },
          { text: 'Esperas a que cuelgue', score: 20 }
        ]
      }
    ];

    for (const q of orientationQuestions) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [q.title, 'multiple_choice', 3] // Orientación al cliente
      );

      const questionId = qResult.rows[0].id;

      for (const opt of q.options) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3)',
          [questionId, opt.text, opt.score]
        );
      }

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
        [examId, questionId, questionOrder++]
      );
    }
    console.log('   ✅ 5 preguntas de Orientación al Cliente creadas\n');

    // 6. SECCIÓN 5: EVALUACIÓN DE COMPETENCIAS - LIKERT SCALE (10 preguntas)
    console.log('5️⃣  EVALUACIÓN DE COMPETENCIAS - LIKERT SCALE (10 preguntas)');
    const likertQuestions = [
      'Tengo la capacidad de mantener la calma bajo presión',
      'Soy capaz de adaptar mi comunicación según el tipo de cliente',
      'Comprendo rápidamente las necesidades implícitas del cliente',
      'Puedo resolver problemas buscando soluciones creativas',
      'Demuestro genuina preocupación por la satisfacción del cliente',
      'Sigo los procesos y políticas de la compañía consistentemente',
      'Tengo facilidad para trabajar con diferentes tipos de personalidades',
      'Tomo decisiones considerando tanto al cliente como a la compañía',
      'Soy proactivo en mejorar la experiencia del cliente',
      'Manejo bien el estrés y la frustración del cliente sin tomarla personalmente'
    ];

    const likertOptions = [
      { text: 'Totalmente en desacuerdo', score: 1 },
      { text: 'En desacuerdo', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'De acuerdo', score: 4 },
      { text: 'Totalmente de acuerdo', score: 5 }
    ];

    const competencyIds = [1, 1, 2, 4, 6, 1, 3, 2, 3, 6]; // Asignar a diferentes competencias

    for (let i = 0; i < likertQuestions.length; i++) {
      const qResult = await pool.query(
        'INSERT INTO questions (title, type, competency_id) VALUES ($1, $2, $3) RETURNING id',
        [likertQuestions[i], 'likert', competencyIds[i]]
      );

      const questionId = qResult.rows[0].id;

      for (const opt of likertOptions) {
        await pool.query(
          'INSERT INTO question_options (question_id, text, score) VALUES ($1, $2, $3)',
          [questionId, opt.text, opt.score]
        );
      }

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
        [examId, questionId, questionOrder++]
      );
    }
    console.log('   ✅ 10 preguntas Likert de Competencias creadas\n');

    // 7. Resumen final
    console.log('🎉 EXAMEN COMPLETO CREADO\n');
    console.log('📊 Resumen del Examen:');
    console.log(`   Nombre: Evaluación Asesor Inbound - Profesional`);
    console.log(`   ID del Examen: ${examId}`);
    console.log(`   Duración: 45 minutos`);
    console.log(`   Total Preguntas: 25`);
    console.log(`     - 15 Multiple Choice (situaciones reales)`);
    console.log(`     - 10 Likert Scale (autoevaluación competencias)\n`);
    console.log('📚 Competencias Evaluadas:');
    console.log(`   1. Comunicación Verbal (5 preguntas)`);
    console.log(`   2. Escucha Activa (4 preguntas)`);
    console.log(`   3. Empatía e Inteligencia Emocional (5 preguntas)`);
    console.log(`   4. Orientación al Cliente y Resolución de Problemas (5 preguntas)`);
    console.log(`   5. Evaluación de Competencias Generales (10 preguntas Likert)\n`);
    console.log('✅ Examen listo para asignar a vacantes\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedInboundExam();
