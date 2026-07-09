const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

const competencies = [
  { id: 7, name: 'Responsabilidad', questions: [
    'Cumplo mis compromisos aunque nadie me supervise.',
    'Organizo mi trabajo antes de comenzar.',
    'Me considero una persona disciplinada.',
    'Entrego mis tareas dentro de los plazos establecidos.',
    'Si cometo un error lo reconozco inmediatamente.',
    'A veces dejo tareas importantes para último momento.',
    'Me cuesta mantener una rutina de trabajo.',
    'Soy constante incluso cuando pierdo la motivación.'
  ], inverses: [6, 7] },
  { id: 8, name: 'Orientación al Logro', questions: [
    'Siempre intento superar mis resultados anteriores.',
    'Disfruto trabajar con metas.',
    'Me motiva recibir nuevos desafíos.',
    'Busco aprender para mejorar mi desempeño.',
    'Me esfuerzo por ser uno de los mejores.',
    'Cuando alcanzo el mínimo requerido dejo de esforzarme.',
    'No me interesa competir conmigo mismo.',
    'Me siento satisfecho únicamente cuando doy mi máximo esfuerzo.'
  ], inverses: [6, 7] },
  { id: 9, name: 'Trabajo Bajo Presión', questions: [
    'Mantengo la calma en momentos difíciles.',
    'Puedo trabajar con varias tareas simultáneamente.',
    'El estrés no afecta fácilmente mis decisiones.',
    'Me adapto a cambios repentinos.',
    'En situaciones críticas logro mantener el control.',
    'Cuando hay mucha presión pierdo la concentración.',
    'Los problemas inesperados me bloquean.',
    'Puedo priorizar tareas cuando el tiempo es limitado.'
  ], inverses: [6, 7] },
  { id: 10, name: 'Adaptabilidad', questions: [
    'Me adapto rápidamente a nuevas formas de trabajar.',
    'Disfruto aprender nuevas herramientas.',
    'Los cambios representan oportunidades.',
    'Acepto con facilidad nuevas responsabilidades.',
    'Aprendo rápido nuevos procedimientos.',
    'Prefiero hacer siempre las cosas igual.',
    'Me incomodan los cambios frecuentes.',
    'Me ajusto fácilmente a distintos equipos.'
  ], inverses: [6, 7] },
  { id: 11, name: 'Trabajo en Equipo', questions: [
    'Disfruto colaborar con otras personas.',
    'Escucho las opiniones de los demás.',
    'Me gusta compartir conocimientos.',
    'Ayudo a mis compañeros cuando lo necesitan.',
    'Valoro el éxito colectivo.',
    'Prefiero trabajar solo.',
    'Me molestan las opiniones diferentes.',
    'Respeto las decisiones del equipo.'
  ], inverses: [6, 7] },
  { id: 12, name: 'Orientación al Cliente', questions: [
    'Intento comprender las necesidades del cliente.',
    'Mantengo la cortesía aun cuando el cliente está molesto.',
    'Escucho antes de responder.',
    'Busco solucionar los problemas del cliente.',
    'Me esfuerzo por generar una buena experiencia.',
    'Pierdo la paciencia fácilmente con clientes difíciles.',
    'Considero que algunos clientes no merecen esfuerzo adicional.',
    'Me gusta ayudar a las personas.'
  ], inverses: [6, 7] },
  { id: 13, name: 'Integridad', questions: [
    'Siempre digo la verdad en mi trabajo.',
    'Respeto las políticas de la empresa.',
    'Actúo correctamente aunque nadie me vea.',
    'Cumplo las normas establecidas.',
    'Soy transparente cuando cometo errores.',
    'Romper una regla es aceptable si nadie lo descubre.',
    'A veces oculto información para evitar problemas.',
    'Considero que la honestidad es indispensable.'
  ], inverses: [6, 7] },
  { id: 14, name: 'Inteligencia Emocional', questions: [
    'Identifico fácilmente mis emociones.',
    'Controlo mis impulsos.',
    'Escucho sin reaccionar impulsivamente.',
    'Manejo adecuadamente los conflictos.',
    'Sé separar los problemas personales del trabajo.',
    'Me enojo con facilidad.',
    'Suelo responder impulsivamente cuando me contradicen.',
    'Mantengo una actitud positiva ante las dificultades.'
  ], inverses: [6, 7] },
  { id: 15, name: 'Iniciativa', questions: [
    'Propongo nuevas ideas para mejorar procesos.',
    'Me gusta aprender más de lo que me solicitan.',
    'Busco soluciones antes de pedir ayuda.',
    'Tomo acción cuando identifico un problema.',
    'Me gusta asumir nuevos retos.',
    'Espero que otros resuelvan los problemas.',
    'Evito asumir responsabilidades adicionales.',
    'Me considero una persona proactiva.'
  ], inverses: [6, 7] },
  { id: 16, name: 'Resiliencia', questions: [
    'Me recupero rápidamente después de un fracaso.',
    'Aprendo de mis errores.',
    'Las críticas me ayudan a mejorar.',
    'Mantengo la motivación después de una mala experiencia.',
    'Persevero hasta alcanzar mis objetivos.',
    'Me desanimo fácilmente cuando algo sale mal.',
    'Si fracaso prefiero abandonar.',
    'Considero los errores como oportunidades de aprendizaje.'
  ], inverses: [6, 7] }
];

async function seedClean() {
  let client;
  try {
    client = await pool.connect();
    console.log('🌱 CREANDO TPL-80 LIMPIO Y CORRECTO\n');

    const examId = 27;
    await client.query('BEGIN');

    // Limpiar todo
    const oldQuestions = await client.query(
      `SELECT DISTINCT q.id FROM exam_questions eq
       INNER JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1`,
      [examId]
    );

    for (const q of oldQuestions.rows) {
      await client.query('DELETE FROM exam_answers WHERE question_id = $1', [q.id]);
      await client.query('DELETE FROM question_options WHERE question_id = $1', [q.id]);
      await client.query('DELETE FROM exam_questions WHERE question_id = $1', [q.id]);
      await client.query('DELETE FROM questions WHERE id = $1', [q.id]);
    }

    console.log('✅ BD limpia\n');

    // Crear nuevas preguntas CON competency_id desde el inicio
    let questionOrder = 1;
    const options = [
      { text: 'Totalmente en desacuerdo', score: 1 },
      { text: 'En desacuerdo', score: 2 },
      { text: 'Ni de acuerdo ni en desacuerdo', score: 3 },
      { text: 'De acuerdo', score: 4 },
      { text: 'Totalmente de acuerdo', score: 5 }
    ];

    for (const comp of competencies) {
      console.log(`📋 ${comp.name}:`);

      for (let i = 0; i < comp.questions.length; i++) {
        const isInverse = comp.inverses.includes(i + 1);

        // IMPORTANTE: Especificar competency_id en el INSERT
        const questionResult = await client.query(
          `INSERT INTO questions (title, type, competency_id, is_inverse)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [comp.questions[i], 'likert_5', comp.id, isInverse]
        );

        const qId = questionResult.rows[0].id;

        // Opciones
        for (const opt of options) {
          await client.query(
            `INSERT INTO question_options (question_id, text, score)
             VALUES ($1, $2, $3)`,
            [qId, opt.text, opt.score]
          );
        }

        // Vincular a examen
        await client.query(
          `INSERT INTO exam_questions (exam_id, question_id, question_order)
           VALUES ($1, $2, $3)`,
          [examId, qId, questionOrder]
        );

        questionOrder++;
      }

      console.log(`   ✅ ${comp.questions.length} preguntas\n`);
    }

    await client.query('COMMIT');

    console.log(`🎉 TPL-80 CREADO CORRECTAMENTE\n`);
    console.log(`📊 RESUMEN: 80 preguntas, 10 competencias, 20 inversas`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client) await client.query('ROLLBACK').catch(() => {});
    process.exit(1);
  } finally {
    if (client) client.release();
  }
}

seedClean();
