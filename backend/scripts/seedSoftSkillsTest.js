require('dotenv').config();
const pool = require('../src/config/database');

const softSkillsQuestions = [
  {
    num: 1,
    competency: 'Comunicación',
    text: 'Un compañero interpreta mal una instrucción que diste. ¿Qué haces primero?',
    options: [
      { text: 'Le indico que debería haber entendido.', correct: false },
      { text: 'Aclaro el objetivo, pregunto qué entendió y reformulo la instrucción.', correct: true },
      { text: 'Pido a otra persona que se lo explique.', correct: false },
      { text: 'Dejo que lo resuelva como pueda.', correct: false }
    ]
  },
  {
    num: 2,
    competency: 'Comunicación',
    text: 'En una reunión alguien te interrumpe repetidamente. ¿Cómo respondes?',
    options: [
      { text: 'Interrumpo también para recuperar la palabra.', correct: false },
      { text: 'Me quedo en silencio para evitar conflicto.', correct: false },
      { text: 'Mantengo la calma y pido terminar la idea antes de escuchar su punto.', correct: true },
      { text: 'Finalizo la reunión.', correct: false }
    ]
  },
  {
    num: 3,
    competency: 'Comunicación',
    text: 'Debes comunicar una decisión que puede generar resistencia. ¿Cuál es el mejor enfoque?',
    options: [
      { text: 'Comunicarla sin explicaciones para evitar debate.', correct: false },
      { text: 'Explicar razones, impacto esperado y abrir espacio para preguntas.', correct: true },
      { text: 'Enviar un mensaje breve y evitar conversaciones.', correct: false },
      { text: 'Esperar a que otros la comuniquen.', correct: false }
    ]
  },
  {
    num: 4,
    competency: 'Comunicación',
    text: 'Recibes un correo ambiguo de un cliente. ¿Qué haces?',
    options: [
      { text: 'Interpreto lo que probablemente quiso decir.', correct: false },
      { text: 'Respondo copiando a todo el equipo.', correct: false },
      { text: 'Pido aclaración concreta antes de actuar.', correct: true },
      { text: 'No respondo hasta que vuelva a escribir.', correct: false }
    ]
  },
  {
    num: 5,
    competency: 'Comunicación',
    text: 'Cuando das retroalimentación a alguien, lo más efectivo es:',
    options: [
      { text: 'Hablar de su personalidad.', correct: false },
      { text: 'Señalar hechos concretos, impacto y acordar mejoras.', correct: true },
      { text: 'Esperar a la evaluación anual.', correct: false },
      { text: 'Decir únicamente lo negativo.', correct: false }
    ]
  },
  {
    num: 6,
    competency: 'Comunicación',
    text: 'Un colega se muestra a la defensiva ante una observación. ¿Qué haces?',
    options: [
      { text: 'Subo el tono para demostrar autoridad.', correct: false },
      { text: 'Evito el tema.', correct: false },
      { text: 'Escucho su perspectiva y vuelvo a hechos observables.', correct: true },
      { text: 'Lo reporto inmediatamente.', correct: false }
    ]
  },
  {
    num: 7,
    competency: 'Comunicación',
    text: '¿Cuál demuestra escucha activa?',
    options: [
      { text: 'Preparar la respuesta mientras la otra persona habla.', correct: false },
      { text: 'Mirar el teléfono para tomar notas.', correct: false },
      { text: 'Parafrasear lo entendido y hacer preguntas pertinentes.', correct: true },
      { text: 'Interrumpir para acelerar la conversación.', correct: false }
    ]
  },
  {
    num: 8,
    competency: 'Comunicación',
    text: 'En una presentación te hacen una pregunta que no sabes responder.',
    options: [
      { text: 'Invento una respuesta convincente.', correct: false },
      { text: 'Digo que no tengo el dato y me comprometo a verificarlo.', correct: true },
      { text: 'Cambio de tema.', correct: false },
      { text: 'Culpo a quien preparó la información.', correct: false }
    ]
  },
  {
    num: 9,
    competency: 'Comunicación',
    text: 'Cuando necesitas expresar desacuerdo con un superior:',
    options: [
      { text: 'Lo contradigo públicamente.', correct: false },
      { text: 'No digo nada aunque vea un riesgo.', correct: false },
      { text: 'Expongo respetuosamente argumentos, datos y una alternativa.', correct: true },
      { text: 'Comento el desacuerdo con compañeros.', correct: false }
    ]
  },
  {
    num: 10,
    competency: 'Comunicación',
    text: 'Un mensaje urgente requiere coordinación entre varias áreas. ¿Qué haces?',
    options: [
      { text: 'Envío un mensaje general sin responsables.', correct: false },
      { text: 'Defino objetivo, responsables, plazos y canal de seguimiento.', correct: true },
      { text: 'Espero instrucciones de cada área.', correct: false },
      { text: 'Resuelvo solo lo que me corresponde.', correct: false }
    ]
  },
  {
    num: 11,
    competency: 'Trabajo en equipo',
    text: 'Tu equipo tiene un objetivo exigente y una persona está sobrecargada.',
    options: [
      { text: 'Le digo que debe organizarse mejor.', correct: false },
      { text: 'Ofrezco apoyo y reviso cómo redistribuir tareas sin perder responsabilidades.', correct: true },
      { text: 'Hago todo por esa persona.', correct: false },
      { text: 'Ignoro la situación.', correct: false }
    ]
  },
  {
    num: 12,
    competency: 'Trabajo en equipo',
    text: 'Dos compañeros tienen un conflicto que afecta el trabajo.',
    options: [
      { text: 'Tomo partido por quien conozco más.', correct: false },
      { text: 'Dejo que lo resuelvan solos aunque afecte al equipo.', correct: false },
      { text: 'Facilito una conversación centrada en hechos, acuerdos y objetivo común.', correct: true },
      { text: 'Informo a todos sobre el conflicto.', correct: false }
    ]
  },
  {
    num: 13,
    competency: 'Trabajo en equipo',
    text: 'Un integrante recibe reconocimiento por un trabajo al que contribuiste.',
    options: [
      { text: 'Reclamo públicamente el mérito.', correct: false },
      { text: 'Me alegro por el resultado y converso en privado si necesito aclarar contribuciones.', correct: true },
      { text: 'Dejo de colaborar con esa persona.', correct: false },
      { text: 'Explico al jefe todo lo que hice.', correct: false }
    ]
  },
  {
    num: 14,
    competency: 'Trabajo en equipo',
    text: 'El equipo debe tomar una decisión y tu propuesta no es elegida.',
    options: [
      { text: 'Me desentiendo de la ejecución.', correct: false },
      { text: 'Apoyo el acuerdo y contribuyo a que funcione.', correct: true },
      { text: 'Intento demostrar que mi idea era mejor.', correct: false },
      { text: 'Espero que fracase.', correct: false }
    ]
  },
  {
    num: 15,
    competency: 'Trabajo en equipo',
    text: 'Un nuevo integrante comete errores durante su adaptación.',
    options: [
      { text: 'Lo excluyo de tareas importantes.', correct: false },
      { text: 'Le doy instrucciones claras, feedback y oportunidades para aprender.', correct: true },
      { text: 'Hago sus tareas permanentemente.', correct: false },
      { text: 'Lo critico frente al equipo.', correct: false }
    ]
  },
  {
    num: 16,
    competency: 'Trabajo en equipo',
    text: 'Un compañero tiene una fortaleza que complementa tu debilidad.',
    options: [
      { text: 'Evito pedir ayuda para parecer competente.', correct: false },
      { text: 'Aprovecho la colaboración y también comparto mis fortalezas.', correct: true },
      { text: 'Delego todo en esa persona.', correct: false },
      { text: 'Compito para demostrar que puedo hacerlo mejor.', correct: false }
    ]
  },
  {
    num: 17,
    competency: 'Trabajo en equipo',
    text: 'En una reunión alguien propone una idea diferente a la habitual.',
    options: [
      { text: 'La descarto por ser poco convencional.', correct: false },
      { text: 'Pregunto cómo podría funcionar y evalúo sus méritos.', correct: true },
      { text: 'Cambio de tema.', correct: false },
      { text: 'Espero que otra persona la critique.', correct: false }
    ]
  },
  {
    num: 18,
    competency: 'Trabajo en equipo',
    text: 'El éxito de un proyecto depende de varias áreas.',
    options: [
      { text: 'Cada área debe resolver lo suyo.', correct: false },
      { text: 'Establezco coordinación, dependencias y puntos de seguimiento.', correct: true },
      { text: 'Solo coordino cuando aparece un problema.', correct: false },
      { text: 'Centralizo todas las decisiones.', correct: false }
    ]
  },
  {
    num: 19,
    competency: 'Trabajo en equipo',
    text: 'Un compañero te pide ayuda cuando tienes una tarea importante.',
    options: [
      { text: 'Siempre digo que sí aunque incumpla mi tarea.', correct: false },
      { text: 'Evalúo prioridades y acuerdo una ayuda realista o alternativa.', correct: true },
      { text: 'Digo que no sin escuchar.', correct: false },
      { text: 'Hago su tarea completa.', correct: false }
    ]
  },
  {
    num: 20,
    competency: 'Trabajo en equipo',
    text: 'El equipo celebra un resultado positivo.',
    options: [
      { text: 'Destaco principalmente mi aporte.', correct: false },
      { text: 'Reconozco contribuciones y aprendizajes colectivos.', correct: true },
      { text: 'Evito celebrar porque aún hay trabajo.', correct: false },
      { text: 'Aprovecho para pedir beneficios personales.', correct: false }
    ]
  }
];

async function seedSoftSkillsTest() {
  try {
    console.log('🌱 Iniciando creación del TEST DE SOFT SKILLS...\n');

    // Crear el exam
    const examResult = await pool.query(
      'INSERT INTO exams (name, description, type, max_time_minutes) VALUES ($1, $2, $3, $4) RETURNING id',
      [
        'TEST DE SOFT SKILLS',
        '80 preguntas para evaluación de habilidades blandas. Instrumento orientativo para selección, desarrollo y evaluación de talento.',
        'soft_skills',
        45
      ]
    );

    const examId = examResult.rows[0].id;
    console.log(`✅ Exam creado: "TEST DE SOFT SKILLS" (ID: ${examId})\n`);

    let questionCount = 0;
    for (const question of softSkillsQuestions) {
      const qResult = await pool.query(
        'INSERT INTO questions (exam_id, title, type, description) VALUES ($1, $2, $3, $4) RETURNING id',
        [examId, question.text, 'multiple_choice', question.competency]
      );

      const questionId = qResult.rows[0].id;

      // Insertar opciones con score
      for (let i = 0; i < question.options.length; i++) {
        const option = question.options[i];
        const score = option.correct ? 2 : 0; // 2 puntos para respuesta correcta, 0 para incorrecta
        await pool.query(
          'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
          [questionId, option.text, score, i + 1]
        );
      }

      questionCount++;
      console.log(`✓ Pregunta ${question.num} insertada (${question.competency})`);
    }

    console.log(`\n✅ Se han insertado ${questionCount} preguntas de ejemplo`);
    console.log(`📌 Nota: Se insertaron 20 preguntas de ejemplo (Comunicación y Trabajo en equipo)`);
    console.log(`\n🔄 PRÓXIMO PASO: Completar el resto de las 80 preguntas`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedSoftSkillsTest();
