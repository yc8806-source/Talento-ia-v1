const pool = require('../src/config/database');

// Definición de vacantes con exámenes asociados
const vacanciesDefinition = [
  {
    title: 'Ejecutivo de Televentas',
    description: 'Buscamos un profesional con excelentes habilidades de comunicación y servicio al cliente para liderar procesos de venta telefónica.',
    operation: 'Televentas',
    exams: [
      'Evaluación de Comunicación y Servicio',  // ID: 4
      'Evaluación de Excelencia Operacional'    // ID: 5
    ]
  },
  {
    title: 'Especialista en Cobranzas',
    description: 'Se requiere profesional con capacidad de negociación, tolerancia a la presión y excelentes habilidades de resolución de problemas.',
    operation: 'Cobranzas',
    exams: [
      'Evaluación de Resolución y Adaptación',  // ID: 6
      'Evaluación Integral de Competencias'     // ID: 3
    ]
  },
  {
    title: 'Representante de Atención Inbound',
    description: 'Profesional orientado al servicio al cliente, con excelentes habilidades de comunicación y capacidad de respuesta rápida.',
    operation: 'Inbound',
    exams: [
      'Evaluación de Comunicación y Servicio',  // ID: 4
      'Evaluación Integral de Competencias'     // ID: 3
    ]
  },
  {
    title: 'Especialista en eCare',
    description: 'Experto en atención digital con habilidades de escritura clara, empatía y resolución eficiente de casos.',
    operation: 'eCare',
    exams: [
      'Evaluación Integral de Competencias',    // ID: 3
      'Evaluación de Comunicación y Servicio'   // ID: 4
    ]
  },
  {
    title: 'Supervisor de Televentas',
    description: 'Líder con capacidad de motivar equipos, resolver problemas y orientación clara a resultados.',
    operation: 'Televentas',
    exams: [
      'Evaluación Integral de Competencias',    // ID: 3
      'Evaluación de Excelencia Operacional'    // ID: 5
    ]
  },
  {
    title: 'Agente de Cobranzas Senior',
    description: 'Profesional con experiencia en recuperación de cartera, capacidad de negociación y manejo de presión.',
    operation: 'Cobranzas',
    exams: [
      'Evaluación Integral de Competencias',    // ID: 3
      'Evaluación de Resolución y Adaptación'   // ID: 6
    ]
  }
];

async function seedVacancies() {
  try {
    console.log('🌱 Iniciando seeding de vacantes...\n');

    // Obtener exámenes para mapearlos
    const examsResult = await pool.query(
      'SELECT id, name FROM exams ORDER BY name'
    );

    if (examsResult.rows.length === 0) {
      console.log('❌ No hay exámenes en la base de datos.');
      console.log('Por favor ejecuta: npm run seed:exams');
      process.exit(1);
    }

    // Mapeo de exámenes por nombre
    const examMap = {};
    examsResult.rows.forEach(e => {
      examMap[e.name] = e.id;
    });

    console.log(`✅ ${examsResult.rows.length} exámenes encontrados:\n`);
    examsResult.rows.forEach(e => console.log(`  • ${e.name} (ID: ${e.id})`));
    console.log('\n');

    let vacanciesCreated = 0;
    let examsAssigned = 0;

    // Crear cada vacante
    for (const vacancyDef of vacanciesDefinition) {
      try {
        console.log(`📋 Creando vacante: ${vacancyDef.title}`);

        // Crear vacante
        const vacancyResult = await pool.query(
          'INSERT INTO vacancies (title, description, created_by) VALUES ($1, $2, $3) RETURNING id',
          [vacancyDef.title, vacancyDef.description, 1]
        );

        const vacancyId = vacancyResult.rows[0].id;
        vacanciesCreated++;

        // Asignar exámenes
        let examOrder = 1;
        for (const examName of vacancyDef.exams) {
          if (!examMap[examName]) {
            console.log(`   ⚠️  Examen '${examName}' no encontrado`);
            continue;
          }

          const examId = examMap[examName];

          await pool.query(
            'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3)',
            [vacancyId, examId, examOrder]
          );

          console.log(`   ✓ Examen asignado: ${examName}`);
          examsAssigned++;
          examOrder++;
        }

        console.log(`   ✓ Vacante creada (ID: ${vacancyId})\n`);
      } catch (error) {
        console.error(`   ✗ Error creando vacante: ${error.message}`);
      }
    }

    console.log('📊 Resumen de Seeding:');
    console.log(`   • Total vacantes creadas: ${vacanciesCreated}`);
    console.log(`   • Total exámenes asignados: ${examsAssigned}`);
    console.log(`   • Operaciones cubiertas: Televentas, Cobranzas, Inbound, eCare\n`);

    console.log('✨ Seeding de vacantes completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

seedVacancies();
