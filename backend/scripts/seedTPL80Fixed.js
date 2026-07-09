const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

const competencies = [
  {
    name: 'Responsabilidad',
    competencyId: 7,
    questions: [
      { text: 'Cumplo mis compromisos aunque nadie me supervise.', inverse: false },
      { text: 'Organizo mi trabajo antes de comenzar.', inverse: false },
      { text: 'Me considero una persona disciplinada.', inverse: false },
      { text: 'Entrego mis tareas dentro de los plazos establecidos.', inverse: false },
      { text: 'Si cometo un error lo reconozco inmediatamente.', inverse: false },
      { text: 'A veces dejo tareas importantes para último momento.', inverse: true },
      { text: 'Me cuesta mantener una rutina de trabajo.', inverse: true },
      { text: 'Soy constante incluso cuando pierdo la motivación.', inverse: false }
    ]
  },
  {
    name: 'Orientación al Logro',
    competencyId: 8,
    questions: [
      { text: 'Siempre intento superar mis resultados anteriores.', inverse: false },
      { text: 'Disfruto trabajar con metas.', inverse: false },
      { text: 'Me motiva recibir nuevos desafíos.', inverse: false },
      { text: 'Busco aprender para mejorar mi desempeño.', inverse: false },
      { text: 'Me esfuerzo por ser uno de los mejores.', inverse: false },
      { text: 'Cuando alcanzo el mínimo requerido dejo de esforzarme.', inverse: true },
      { text: 'No me interesa competir conmigo mismo.', inverse: true },
      { text: 'Me siento satisfecho únicamente cuando doy mi máximo esfuerzo.', inverse: false }
    ]
  },
  {
    name: 'Trabajo Bajo Presión',
    competencyId: 9,
    questions: [
      { text: 'Mantengo la calma en momentos difíciles.', inverse: false },
      { text: 'Puedo trabajar con varias tareas simultáneamente.', inverse: false },
      { text: 'El estrés no afecta fácilmente mis decisiones.', inverse: false },
      { text: 'Me adapto a cambios repentinos.', inverse: false },
      { text: 'En situaciones críticas logro mantener el control.', inverse: false },
      { text: 'Cuando hay mucha presión pierdo la concentración.', inverse: true },
      { text: 'Los problemas inesperados me bloquean.', inverse: true },
      { text: 'Puedo priorizar tareas cuando el tiempo es limitado.', inverse: false }
    ]
  },
  {
    name: 'Adaptabilidad',
    competencyId: 10,
    questions: [
      { text: 'Me adapto rápidamente a nuevas formas de trabajar.', inverse: false },
      { text: 'Disfruto aprender nuevas herramientas.', inverse: false },
      { text: 'Los cambios representan oportunidades.', inverse: false },
      { text: 'Acepto con facilidad nuevas responsabilidades.', inverse: false },
      { text: 'Aprendo rápido nuevos procedimientos.', inverse: false },
      { text: 'Prefiero hacer siempre las cosas igual.', inverse: true },
      { text: 'Me incomodan los cambios frecuentes.', inverse: true },
      { text: 'Me ajusto fácilmente a distintos equipos.', inverse: false }
    ]
  },
  {
    name: 'Trabajo en Equipo',
    competencyId: 11,
    questions: [
      { text: 'Disfruto colaborar con otras personas.', inverse: false },
      { text: 'Escucho las opiniones de los demás.', inverse: false },
      { text: 'Me gusta compartir conocimientos.', inverse: false },
      { text: 'Ayudo a mis compañeros cuando lo necesitan.', inverse: false },
      { text: 'Valoro el éxito colectivo.', inverse: false },
      { text: 'Prefiero trabajar solo.', inverse: true },
      { text: 'Me molestan las opiniones diferentes.', inverse: true },
      { text: 'Respeto las decisiones del equipo.', inverse: false }
    ]
  },
  {
    name: 'Orientación al Cliente',
    competencyId: 12,
    questions: [
      { text: 'Intento comprender las necesidades del cliente.', inverse: false },
      { text: 'Mantengo la cortesía aun cuando el cliente está molesto.', inverse: false },
      { text: 'Escucho antes de responder.', inverse: false },
      { text: 'Busco solucionar los problemas del cliente.', inverse: false },
      { text: 'Me esfuerzo por generar una buena experiencia.', inverse: false },
      { text: 'Pierdo la paciencia fácilmente con clientes difíciles.', inverse: true },
      { text: 'Considero que algunos clientes no merecen esfuerzo adicional.', inverse: true },
      { text: 'Me gusta ayudar a las personas.', inverse: false }
    ]
  },
  {
    name: 'Integridad',
    competencyId: 13,
    questions: [
      { text: 'Siempre digo la verdad en mi trabajo.', inverse: false },
      { text: 'Respeto las políticas de la empresa.', inverse: false },
      { text: 'Actúo correctamente aunque nadie me vea.', inverse: false },
      { text: 'Cumplo las normas establecidas.', inverse: false },
      { text: 'Soy transparente cuando cometo errores.', inverse: false },
      { text: 'Romper una regla es aceptable si nadie lo descubre.', inverse: true },
      { text: 'A veces oculto información para evitar problemas.', inverse: true },
      { text: 'Considero que la honestidad es indispensable.', inverse: false }
    ]
  },
  {
    name: 'Inteligencia Emocional',
    competencyId: 14,
    questions: [
      { text: 'Identifico fácilmente mis emociones.', inverse: false },
      { text: 'Controlo mis impulsos.', inverse: false },
      { text: 'Escucho sin reaccionar impulsivamente.', inverse: false },
      { text: 'Manejo adecuadamente los conflictos.', inverse: false },
      { text: 'Sé separar los problemas personales del trabajo.', inverse: false },
      { text: 'Me enojo con facilidad.', inverse: true },
      { text: 'Suelo responder impulsivamente cuando me contradicen.', inverse: true },
      { text: 'Mantengo una actitud positiva ante las dificultades.', inverse: false }
    ]
  },
  {
    name: 'Iniciativa',
    competencyId: 15,
    questions: [
      { text: 'Propongo nuevas ideas para mejorar procesos.', inverse: false },
      { text: 'Me gusta aprender más de lo que me solicitan.', inverse: false },
      { text: 'Busco soluciones antes de pedir ayuda.', inverse: false },
      { text: 'Tomo acción cuando identifico un problema.', inverse: false },
      { text: 'Me gusta asumir nuevos retos.', inverse: false },
      { text: 'Espero que otros resuelvan los problemas.', inverse: true },
      { text: 'Evito asumir responsabilidades adicionales.', inverse: true },
      { text: 'Me considero una persona proactiva.', inverse: false }
    ]
  },
  {
    name: 'Resiliencia',
    competencyId: 16,
    questions: [
      { text: 'Me recupero rápidamente después de un fracaso.', inverse: false },
      { text: 'Aprendo de mis errores.', inverse: false },
      { text: 'Las críticas me ayudan a mejorar.', inverse: false },
      { text: 'Mantengo la motivación después de una mala experiencia.', inverse: false },
      { text: 'Persevero hasta alcanzar mis objetivos.', inverse: false },
      { text: 'Me desanimo fácilmente cuando algo sale mal.', inverse: true },
      { text: 'Si fracaso prefiero abandonar.', inverse: true },
      { text: 'Considero los errores como oportunidades de aprendizaje.', inverse: false }
    ]
  }
];

async function seedTPL80Fixed() {
  let client;
  try {
    client = await pool.connect();
    console.log('🌱 RECREANDO TPL-80 CON COMPETENCIAS CORRECTAS\n');

    // Limpiar preguntas y opciones del TPL-80 anterior
    const examId = 27;
    await client.query('BEGIN');

    // Obtener y borrar preguntas antiguas (incluyendo respuestas)
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

    console.log('✅ Preguntas anteriores eliminadas\n');

    // Crear nuevas preguntas con competencias correctas
    let questionOrder = 1;
    let totalQuestions = 0;

    for (const competency of competencies) {
      console.log(`📋 ${competency.name} (ID: ${competency.competencyId}):`);

      for (const q of competency.questions) {
        // Crear pregunta CON competency_id correcto
        const questionResult = await client.query(
          `INSERT INTO questions (title, type, competency_id, is_inverse)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [q.text, 'likert_5', competency.competencyId, q.inverse]
        );

        const questionId = questionResult.rows[0].id;

        // Crear opciones Likert (1-5)
        const options = [
          { text: 'Totalmente en desacuerdo', score: 1 },
          { text: 'En desacuerdo', score: 2 },
          { text: 'Ni de acuerdo ni en desacuerdo', score: 3 },
          { text: 'De acuerdo', score: 4 },
          { text: 'Totalmente de acuerdo', score: 5 }
        ];

        for (const opt of options) {
          await client.query(
            `INSERT INTO question_options (question_id, text, score)
             VALUES ($1, $2, $3)`,
            [questionId, opt.text, opt.score]
          );
        }

        // Vincular a examen
        await client.query(
          `INSERT INTO exam_questions (exam_id, question_id, question_order)
           VALUES ($1, $2, $3)`,
          [examId, questionId, questionOrder]
        );

        questionOrder++;
        totalQuestions++;
      }

      console.log(`   ✅ ${competency.questions.length} preguntas insertadas`);
    }

    await client.query('COMMIT');

    console.log(`\n🎉 TPL-80 RECREADO EXITOSAMENTE\n`);
    console.log(`📊 RESUMEN:`);
    console.log(`   Examen ID: ${examId}`);
    console.log(`   Total de preguntas: ${totalQuestions}`);
    console.log(`   Total de competencias: ${competencies.length}`);
    console.log(`   Preguntas inversas: 20`);
    console.log(`   Scoring por competencia: 8-40 puntos\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client) await client.query('ROLLBACK').catch(() => {});
    process.exit(1);
  } finally {
    if (client) client.release();
  }
}

seedTPL80Fixed();
