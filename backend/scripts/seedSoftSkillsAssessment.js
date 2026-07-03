const pool = require('../src/config/database');

async function seedSoftSkillsAssessment() {
  try {
    console.log('🌱 Creando Evaluación de Competencias Blandas...');

    // Verificar si el examen ya existe
    let examResult = await pool.query(
      `SELECT id FROM exams WHERE name = $1`,
      ['Evaluación de Competencias Blandas']
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
          'Evaluación de Competencias Blandas',
          'Evaluación de habilidades interpersonales y profesionales mediante escala Likert',
          15,
          60,
          1
        ]
      );

      examId = examResult.rows[0].id;
      console.log(`✅ Examen creado: ID ${examId}`);
    }

    // Preguntas por competencia
    const competencies = [
      {
        name: 'Comunicación',
        id: 1,
        questions: [
          '¿Qué tan clara y efectiva es tu comunicación verbal con colegas?',
          'Puedo explicar ideas complejas de forma que otros las entiendan fácilmente',
          '¿Con qué frecuencia solicito feedback para mejorar mi comunicación?'
        ]
      },
      {
        name: 'Liderazgo',
        id: 2,
        questions: [
          '¿Qué tan cómodo te sientes tomando decisiones en situaciones de incertidumbre?',
          'Inspiro a otros a alcanzar objetivos comunes',
          '¿Con qué frecuencia motivas a tu equipo en momentos difíciles?'
        ]
      },
      {
        name: 'Trabajo en Equipo',
        id: 3,
        questions: [
          '¿Qué tan bien colaboras con compañeros de diferentes áreas?',
          'Contribuyo activamente a los objetivos del equipo incluso cuando me cuesta trabajo',
          '¿Con qué frecuencia ayudo a otros colegas sin que me lo pidan?'
        ]
      },
      {
        name: 'Resolución de Problemas',
        id: 4,
        questions: [
          '¿Qué tan efectivo eres identificando la raíz de los problemas?',
          'Genero múltiples soluciones antes de elegir la mejor',
          '¿Con qué frecuencia aprendes de los problemas que enfrentas?'
        ]
      },
      {
        name: 'Adaptabilidad',
        id: 5,
        questions: [
          '¿Qué tan bien te adaptas a cambios inesperados?',
          'Veo los cambios como oportunidades de crecimiento',
          '¿Con qué frecuencia ajustas tu estrategia cuando las circunstancias cambian?'
        ]
      },
      {
        name: 'Empatía',
        id: 6,
        questions: [
          '¿Qué tan bien entiendes las emociones y perspectivas de otros?',
          'Considero el bienestar emocional de mis colegas en mis decisiones',
          '¿Con qué frecuencia muestro apoyo genuino a quienes atraviesan dificultades?'
        ]
      },
      {
        name: 'Gestión del Tiempo',
        id: 7,
        questions: [
          '¿Qué tan bien priorizas tareas importantes versus urgentes?',
          'Completo mis tareas dentro de los plazos establecidos',
          '¿Con qué frecuencia planificas tu trabajo para maximizar productividad?'
        ]
      },
      {
        name: 'Proactividad',
        id: 8,
        questions: [
          '¿Con qué frecuencia identificas oportunidades antes de que otros las vean?',
          'Tomo iniciativa para mejorar procesos sin esperar instrucciones',
          '¿Qué tan activo eres buscando desarrollo profesional?'
        ]
      },
      {
        name: 'Integridad',
        id: 9,
        questions: [
          '¿Qué tan consistente eres en mantener tus principios éticos?',
          'Actúo honestamente incluso cuando es inconveniente',
          '¿Con qué frecuencia admites tus errores y asumes responsabilidad?'
        ]
      },
      {
        name: 'Creatividad',
        id: 10,
        questions: [
          '¿Qué tan frecuentemente generas ideas innovadoras?',
          'Busco formas nuevas y mejores de hacer las cosas',
          '¿Con qué frecuencia desafías el status quo constructivamente?'
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
    console.log('\n✨ Evaluación de Competencias Blandas lista para usar');
    console.log(`   Exam ID: ${examId}`);
    console.log('   Duración: 15 minutos');
    console.log('   Tipo: Likert Scale (1-5)');
    console.log(`   Total preguntas: ${totalQuestionsCreated}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedSoftSkillsAssessment();
