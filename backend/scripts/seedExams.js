const pool = require('../src/config/database');

// Definición de exámenes
// Nota: Usar competencias que existan en tu BD
const examsDefinition = [
  {
    name: 'Evaluación Integral de Competencias',
    description: 'Evaluación completa de competencias clave',
    maxTimeMinutes: 90,
    minScore: 60,
    competencies: [
      'Comunicación',
      'Comunicación escrita',
      'Empatía',
      'Resolución de problemas',
      'Servicio al cliente',
      'Tolerancia a la presión'
    ],
    questionsPerCompetency: 5
  },
  {
    name: 'Evaluación de Comunicación y Servicio',
    description: 'Enfocada en comunicación y servicio al cliente',
    maxTimeMinutes: 60,
    minScore: 65,
    competencies: [
      'Comunicación escrita',
      'Servicio al cliente'
    ],
    questionsPerCompetency: 4
  },
  {
    name: 'Evaluación de Excelencia Operacional',
    description: 'Competencias para roles operacionales',
    maxTimeMinutes: 60,
    minScore: 70,
    competencies: [
      'Atención al detalle',
      'Tolerancia a la presión',
      'Orientación a resultados'
    ],
    questionsPerCompetency: 4
  },
  {
    name: 'Evaluación de Resolución y Adaptación',
    description: 'Orientada a solución de problemas y flexibilidad',
    maxTimeMinutes: 45,
    minScore: 60,
    competencies: [
      'Resolución de problemas',
      'Empatía'
    ],
    questionsPerCompetency: 4
  }
];

async function seedExams() {
  try {
    console.log('🌱 Iniciando seeding de exámenes...\n');

    // Obtener competencias
    const competenciesResult = await pool.query(
      'SELECT id, name FROM competencies ORDER BY name'
    );

    if (competenciesResult.rows.length === 0) {
      console.log('❌ No hay competencias en la base de datos.');
      process.exit(1);
    }

    // Mapeo de competencias
    const competencyMap = {};
    competenciesResult.rows.forEach(c => {
      competencyMap[c.name] = c.id;
    });

    let examsCreated = 0;
    let questionsAssigned = 0;

    // Crear cada examen
    for (const examDef of examsDefinition) {
      try {
        console.log(`📋 Creando examen: ${examDef.name}`);

        // Crear examen
        const examResult = await pool.query(
          'INSERT INTO exams (name, description, max_time_minutes, min_score, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [examDef.name, examDef.description, examDef.maxTimeMinutes, examDef.minScore, 1]
        );

        const examId = examResult.rows[0].id;
        examsCreated++;

        // Obtener preguntas para cada competencia
        let questionOrder = 1;

        for (const competencyName of examDef.competencies) {
          if (!competencyMap[competencyName]) {
            console.log(`   ⚠️  Competencia '${competencyName}' no encontrada`);
            continue;
          }

          const competencyId = competencyMap[competencyName];

          // Obtener preguntas de esta competencia
          const questionsResult = await pool.query(
            'SELECT id FROM questions WHERE competency_id = $1 LIMIT $2',
            [competencyId, examDef.questionsPerCompetency]
          );

          // Asignar preguntas al examen
          for (const question of questionsResult.rows) {
            await pool.query(
              'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
              [examId, question.id, questionOrder]
            );
            questionOrder++;
            questionsAssigned++;
          }

          console.log(`   ✓ ${questionsResult.rows.length} preguntas asignadas de ${competencyName}`);
        }

        console.log(`   ✓ Examen creado (ID: ${examId})\n`);
      } catch (error) {
        console.error(`   ✗ Error creando examen: ${error.message}`);
      }
    }

    console.log('📊 Resumen de Seeding:');
    console.log(`   • Total exámenes creados: ${examsCreated}`);
    console.log(`   • Total preguntas asignadas: ${questionsAssigned}\n`);

    console.log('✨ Seeding de exámenes completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

seedExams();
