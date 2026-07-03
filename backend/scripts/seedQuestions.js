const pool = require('../src/config/database');

// Banco de preguntas organizado por competencias
// Nota: Usar las competencias que existen en tu BD
const questionBank = {
  'Comunicación escrita': [
    {
      title: '¿Qué tan clara y bien estructurada es tu escritura profesional?',
      type: 'likert',
      description: 'Evaluación de claridad en escritura',
      options: [
        { text: 'Muy deficiente', score: 20 },
        { text: 'Deficiente', score: 40 },
        { text: 'Regular', score: 60 },
        { text: 'Bueno', score: 80 },
        { text: 'Muy bueno', score: 100 }
      ]
    },
    {
      title: 'Tu correo profesional es:',
      type: 'multiple_choice',
      description: 'Calidad de comunicación escrita',
      options: [
        { text: 'Desorganizado e impreciso', score: 20 },
        { text: 'Claro pero podría mejorar', score: 60 },
        { text: 'Claro, conciso y bien estructurado', score: 100 },
        { text: 'Muy breve, falta contexto', score: 40 }
      ]
    },
    {
      title: 'Reviso mis textos antes de enviar para detectar errores.',
      type: 'true_false',
      description: 'Cuidado en la redacción',
      options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 30 }
      ]
    },
    {
      title: '¿Cómo adaptas tu escritura según la audiencia?',
      type: 'multiple_choice',
      description: 'Adaptación de estilo de escritura',
      options: [
        { text: 'Escribo igual para todos', score: 25 },
        { text: 'Intento adaptar pero no siempre lo logro', score: 60 },
        { text: 'Adapto tono, vocabulario y nivel de detalle según audiencia', score: 95 },
        { text: 'No considero importante adaptar', score: 15 }
      ]
    },
    {
      title: '¿Utilizas herramientas para mejorar la calidad de tu escritura?',
      type: 'likert',
      description: 'Uso de herramientas de escritura',
      options: [
        { text: 'Nunca', score: 20 },
        { text: 'Raramente', score: 40 },
        { text: 'A veces', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    }
  ],
  'Comunicación': [
    {
      title: '¿Cómo describes tu capacidad para comunicar ideas complejas de forma clara?',
      type: 'likert',
      description: 'Evaluación de claridad en la comunicación de conceptos difíciles',
      options: [
        { text: 'Muy deficiente', score: 20 },
        { text: 'Deficiente', score: 40 },
        { text: 'Regular', score: 60 },
        { text: 'Bueno', score: 80 },
        { text: 'Muy bueno', score: 100 }
      ]
    },
    {
      title: 'Un colega no entiende tu explicación. ¿Qué haces?',
      type: 'multiple_choice',
      description: 'Capacidad de adaptarse ante malinterpretaciones',
      options: [
        { text: 'Repites la explicación de la misma manera', score: 20 },
        { text: 'Usas un ejemplo similar para aclarar', score: 60 },
        { text: 'Cambias completamente tu enfoque con ejemplos prácticos y visuales', score: 100 },
        { text: 'Pides que te explique dónde está confundido', score: 80 }
      ]
    },
    {
      title: '¿Con qué frecuencia solicitas feedback sobre tu comunicación?',
      type: 'likert',
      description: 'Disposición a mejorar habilidades de comunicación',
      options: [
        { text: 'Nunca', score: 20 },
        { text: 'Raramente', score: 40 },
        { text: 'Ocasionalmente', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    },
    {
      title: 'Tienes que presentar malas noticias a tu equipo. ¿Cómo lo haces?',
      type: 'multiple_choice',
      description: 'Comunicación de información negativa o difícil',
      options: [
        { text: 'Lo anuncias directamente sin contextualización', score: 30 },
        { text: 'Explicas el contexto pero de forma abrupta', score: 50 },
        { text: 'Contextualizas la situación, explicas acciones y ofreces soluciones', score: 100 },
        { text: 'Lo mencionas de pasada o lo evitas', score: 10 }
      ]
    },
    {
      title: '¿Qué tan activamente escuchas durante conversaciones de trabajo?',
      type: 'likert',
      description: 'Capacidad de escucha activa',
      options: [
        { text: 'Raramente', score: 20 },
        { text: 'Ocasionalmente', score: 40 },
        { text: 'Moderadamente', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    }
  ],
  'Orientación a resultados': [
    {
      title: '¿Con qué frecuencia estableces objetivos SMART?',
      type: 'likert',
      description: 'Definición clara de objetivos',
      options: [
        { text: 'Nunca', score: 20 },
        { text: 'Raramente', score: 40 },
        { text: 'A veces', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    },
    {
      title: 'Cuando enfrentas un objetivo difícil, tu actitud es:',
      type: 'multiple_choice',
      description: 'Perseverancia en objetivos',
      options: [
        { text: 'Esperar a ver si es posible', score: 25 },
        { text: 'Intentar pero rendirse ante dificultades', score: 45 },
        { text: 'Trabajar persistentemente hasta alcanzarlo', score: 95 },
        { text: 'Buscar excusas por qué no se puede lograr', score: 15 }
      ]
    },
    {
      title: '¿Haces seguimiento regular a tus progreso?',
      type: 'likert',
      description: 'Monitoreo de resultados',
      options: [
        { text: 'Raramente', score: 20 },
        { text: 'Ocasionalmente', score: 40 },
        { text: 'Regularmente', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Constantemente', score: 100 }
      ]
    },
    {
      title: '¿Documentas y celebras tus logros?',
      type: 'multiple_choice',
      description: 'Reconocimiento de resultados',
      options: [
        { text: 'Raramente', score: 30 },
        { text: 'Solo internamente', score: 50 },
        { text: 'Sí, comunico logros y aprendo de ellos', score: 90 },
        { text: 'Los asumo como normales sin destacar', score: 40 }
      ]
    },
    {
      title: '¿Tu motivación viene principalmente de alcanzar resultados?',
      type: 'true_false',
      description: 'Motivación por resultados',
      options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 30 }
      ]
    }
  ],
  'Empatía': [
    {
      title: '¿Cómo mantienes relaciones positivas con tu equipo?',
      type: 'multiple_choice',
      description: 'Construcción de relaciones',
      options: [
        { text: 'Solo interactúo en contexto laboral', score: 30 },
        { text: 'Mantengo relaciones profesionales cordiales', score: 60 },
        { text: 'Muestro interés genuino en el bienestar personal de mi equipo', score: 95 },
        { text: 'Intento ser amigo de todos', score: 50 }
      ]
    },
    {
      title: 'Un compañero está pasando por dificultades personales. ¿Qué haces?',
      type: 'multiple_choice',
      description: 'Sensibilidad ante circunstancias personales',
      options: [
        { text: 'Nada, su vida personal no es mi asunto', score: 10 },
        { text: 'Lo reconozco pero no me involucro', score: 40 },
        { text: 'Le preguntas cómo está y le ofreces apoyo si lo necesita', score: 90 },
        { text: 'Le das la baja laboral automáticamente', score: 60 }
      ]
    },
    {
      title: '¿Qué tan bien entiendes las emociones de otros?',
      type: 'likert',
      description: 'Inteligencia emocional',
      options: [
        { text: 'Muy poco', score: 20 },
        { text: 'Poco', score: 40 },
        { text: 'Moderadamente', score: 60 },
        { text: 'Bastante bien', score: 80 },
        { text: 'Muy bien', score: 100 }
      ]
    },
    {
      title: 'Cuando alguien comete un error, tu respuesta es:',
      type: 'multiple_choice',
      description: 'Empatía ante errores ajenos',
      options: [
        { text: 'Criticar duramente para evitar que repita', score: 20 },
        { text: 'Señalar el error de forma directa', score: 50 },
        { text: 'Entender qué pasó, apoyar en la solución y aprender juntos', score: 95 },
        { text: 'Pretender que no sucedió', score: 15 }
      ]
    },
    {
      title: '¿Consideras los sentimientos de otros al tomar decisiones?',
      type: 'likert',
      description: 'Consideración en toma de decisiones',
      options: [
        { text: 'Nunca', score: 10 },
        { text: 'Raramente', score: 30 },
        { text: 'A veces', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    }
  ],
  'Resolución de problemas': [
    {
      title: 'Ante un problema complejo, tu primer paso es:',
      type: 'multiple_choice',
      description: 'Enfoque para resolver problemas',
      options: [
        { text: 'Actuar rápidamente sin analizar', score: 20 },
        { text: 'Recopilar información relevante y analizar causas raíz', score: 95 },
        { text: 'Consultar con otros antes de pensar', score: 40 },
        { text: 'Esperar a ver si se resuelve solo', score: 10 }
      ]
    },
    {
      title: '¿Qué tan bien identificas causas raíz de problemas?',
      type: 'likert',
      description: 'Análisis de problemas',
      options: [
        { text: 'Muy deficiente', score: 20 },
        { text: 'Deficiente', score: 40 },
        { text: 'Regular', score: 60 },
        { text: 'Bueno', score: 80 },
        { text: 'Muy bueno', score: 100 }
      ]
    },
    {
      title: 'Generas múltiples soluciones antes de elegir una.',
      type: 'true_false',
      description: 'Pensamiento creativo en soluciones',
      options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 30 }
      ]
    },
    {
      title: 'Cuando una solución no funciona, tu reacción es:',
      type: 'multiple_choice',
      description: 'Adaptabilidad en soluciones',
      options: [
        { text: 'Insistir en la misma solución', score: 20 },
        { text: 'Rendirse y abandonar el problema', score: 10 },
        { text: 'Analizar por qué falló y ajustar el enfoque', score: 95 },
        { text: 'Culpar a otros de la falla', score: 15 }
      ]
    },
    {
      title: '¿Implementas y haces seguimiento a las soluciones?',
      type: 'likert',
      description: 'Ejecución de soluciones',
      options: [
        { text: 'Raramente', score: 20 },
        { text: 'Ocasionalmente', score: 40 },
        { text: 'Regularmente', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    }
  ],
  'Servicio al cliente': [
    {
      title: 'Tu enfoque principal con clientes es:',
      type: 'multiple_choice',
      description: 'Orientación al cliente',
      options: [
        { text: 'Cumplir los requisitos mínimos', score: 40 },
        { text: 'Satisfacer sus necesidades estándar', score: 60 },
        { text: 'Entender profundamente sus necesidades y exceder expectativas', score: 95 },
        { text: 'Solo responder cuando pregunten', score: 25 }
      ]
    },
    {
      title: '¿Con qué frecuencia solicitas feedback de clientes?',
      type: 'likert',
      description: 'Búsqueda de retroalimentación',
      options: [
        { text: 'Nunca', score: 20 },
        { text: 'Raramente', score: 40 },
        { text: 'A veces', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    },
    {
      title: 'Un cliente insatisfecho llama. Tu reacción es:',
      type: 'multiple_choice',
      description: 'Manejo de clientes difíciles',
      options: [
        { text: 'Defenderme y explicar por qué tengo razón', score: 25 },
        { text: 'Escuchar pero sin comprometer', score: 50 },
        { text: 'Escuchar empáticamente, comprender y resolver proactivamente', score: 95 },
        { text: 'Transferir a otro departamento', score: 35 }
      ]
    },
    {
      title: '¿Buscas anticipar necesidades del cliente?',
      type: 'likert',
      description: 'Proactividad con clientes',
      options: [
        { text: 'Raramente', score: 20 },
        { text: 'Ocasionalmente', score: 40 },
        { text: 'Regularmente', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    },
    {
      title: 'Mantienes relaciones positivas a largo plazo con clientes.',
      type: 'true_false',
      description: 'Relaciones duraderas',
      options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 25 }
      ]
    }
  ],
  'Tolerancia a la presión': [
    {
      title: '¿Cómo reaccionas en situaciones de presión?',
      type: 'multiple_choice',
      description: 'Manejo de estrés',
      options: [
        { text: 'Me paralizo o me desmotivo', score: 20 },
        { text: 'Trabajo pero con ansiedad', score: 40 },
        { text: 'Mantengo enfoque y rindimiento bajo presión', score: 95 },
        { text: 'Solo trabajo bien en presión', score: 70 }
      ]
    },
    {
      title: 'Tu capacidad para manejar múltiples tareas urgentes:',
      type: 'likert',
      description: 'Gestión de urgencias',
      options: [
        { text: 'Muy deficiente', score: 20 },
        { text: 'Deficiente', score: 40 },
        { text: 'Regular', score: 60 },
        { text: 'Buena', score: 80 },
        { text: 'Muy buena', score: 100 }
      ]
    },
    {
      title: 'Tienes técnicas para manejar el estrés laboral.',
      type: 'true_false',
      description: 'Gestión personal del estrés',
      options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 30 }
      ]
    },
    {
      title: 'Cuando hay plazos ajustados, tu respuesta es:',
      type: 'multiple_choice',
      description: 'Reacción a plazos urgentes',
      options: [
        { text: 'Abandonar o dejar tareas incompletas', score: 15 },
        { text: 'Trabajar mucho pero con errores', score: 45 },
        { text: 'Priorizar y entregar con calidad', score: 95 },
        { text: 'Culpar las circunstancias', score: 20 }
      ]
    },
    {
      title: '¿Mantienes tu bienestar personal bajo presión?',
      type: 'likert',
      description: 'Equilibrio y autocuidado',
      options: [
        { text: 'Nunca', score: 10 },
        { text: 'Raramente', score: 30 },
        { text: 'A veces', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    }
  ],
  'Atención al detalle': [
    {
      title: '¿Con qué frecuencia cometes errores por falta de atención?',
      type: 'multiple_choice',
      description: 'Tasa de errores',
      options: [
        { text: 'Muy frecuentemente', score: 20 },
        { text: 'Ocasionalmente', score: 40 },
        { text: 'Raramente', score: 80 },
        { text: 'Casi nunca', score: 100 }
      ]
    },
    {
      title: 'Tu capacidad para identificar inconsistencias es:',
      type: 'likert',
      description: 'Detección de errores',
      options: [
        { text: 'Muy baja', score: 20 },
        { text: 'Baja', score: 40 },
        { text: 'Regular', score: 60 },
        { text: 'Alta', score: 80 },
        { text: 'Muy alta', score: 100 }
      ]
    },
    {
      title: 'Verificas tu trabajo antes de entregarlo.',
      type: 'true_false',
      description: 'Revisión antes de entrega',
      options: [
        { text: 'Verdadero', score: 100 },
        { text: 'Falso', score: 25 }
      ]
    },
    {
      title: 'Cuando trabajas en detalles complejos:',
      type: 'multiple_choice',
      description: 'Trabajo detallado',
      options: [
        { text: 'Me aburro y cometo errores', score: 25 },
        { text: 'Trabajo bien pero necesito confirmaciones', score: 60 },
        { text: 'Mantengo precisión sin necesidad de supervisión', score: 95 },
        { text: 'Delego estos trabajos', score: 30 }
      ]
    },
    {
      title: '¿Utilizas sistemas o listas para evitar olvidos?',
      type: 'likert',
      description: 'Uso de herramientas organizativas',
      options: [
        { text: 'Nunca', score: 20 },
        { text: 'Raramente', score: 40 },
        { text: 'A veces', score: 60 },
        { text: 'Frecuentemente', score: 80 },
        { text: 'Siempre', score: 100 }
      ]
    }
  ]
};

async function seedQuestions() {
  try {
    console.log('🌱 Iniciando seeding de preguntas...\n');

    // Obtener todas las competencias
    const competenciesResult = await pool.query(
      'SELECT id, name FROM competencies ORDER BY name'
    );

    if (competenciesResult.rows.length === 0) {
      console.log('❌ No hay competencias en la base de datos.');
      console.log('Por favor crea competencias primero.');
      process.exit(1);
    }

    console.log(`✅ ${competenciesResult.rows.length} competencias encontradas:\n`);
    competenciesResult.rows.forEach(c => console.log(`  • ${c.name} (ID: ${c.id})`));
    console.log('\n');

    // Mapeo de competencias
    const competencyMap = {};
    competenciesResult.rows.forEach(c => {
      competencyMap[c.name] = c.id;
    });

    let totalQuestionsCreated = 0;
    let totalOptionsCreated = 0;

    // Crear preguntas para cada competencia
    for (const [competencyName, questions] of Object.entries(questionBank)) {
      if (!competencyMap[competencyName]) {
        console.log(`⚠️  Competencia '${competencyName}' no encontrada, saltando...`);
        continue;
      }

      const competencyId = competencyMap[competencyName];
      console.log(`📝 Agregando preguntas para: ${competencyName} (ID: ${competencyId})`);

      for (const question of questions) {
        try {
          // Crear pregunta
          const questionResult = await pool.query(
            'INSERT INTO questions (title, type, competency_id, description) VALUES ($1, $2, $3, $4) RETURNING id',
            [question.title, question.type, competencyId, question.description]
          );

          const questionId = questionResult.rows[0].id;
          totalQuestionsCreated++;

          // Crear opciones
          for (let i = 0; i < question.options.length; i++) {
            const option = question.options[i];
            await pool.query(
              'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
              [questionId, option.text, option.score, i + 1]
            );
            totalOptionsCreated++;
          }

          console.log(`   ✓ Pregunta creada: "${question.title.substring(0, 50)}..."`);
        } catch (error) {
          console.error(`   ✗ Error creando pregunta: ${error.message}`);
        }
      }

      console.log('');
    }

    console.log('📊 Resumen de Seeding:');
    console.log(`   • Total preguntas creadas: ${totalQuestionsCreated}`);
    console.log(`   • Total opciones creadas: ${totalOptionsCreated}`);
    console.log(`   • Competencias procesadas: ${Object.keys(questionBank).length}\n`);

    console.log('✨ Seeding completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

seedQuestions();
