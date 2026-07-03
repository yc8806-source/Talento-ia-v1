const pool = require('../src/config/database');

const typingTests = [
  {
    title: 'Texto Fácil - Presentación',
    description: 'Texto simple sobre presentación profesional - Dificultad Fácil',
    text: 'Hola, mi nombre es Juan y tengo cinco años de experiencia en desarrollo de software. He trabajado con múltiples lenguajes de programación incluyendo Java, Python y JavaScript. Mi pasión es crear aplicaciones que resuelvan problemas reales.',
    difficulty: 'easy',
    durationSeconds: 45,
  },
  {
    title: 'Texto Medio - Descripción Técnica',
    description: 'Descripción técnica de conceptos de desarrollo - Dificultad Media',
    text: 'La arquitectura de microservicios es un enfoque para desarrollar una única aplicación como un conjunto de pequeños servicios que ejecutan en su propio proceso y se comunican con mecanismos ligeros. Esta arquitectura ofrece beneficios como escalabilidad independiente, despliegues más rápidos y mejor mantenibilidad del código.',
    difficulty: 'medium',
    durationSeconds: 60,
  },
  {
    title: 'Texto Difícil - Análisis Estratégico',
    description: 'Análisis estratégico complejo - Dificultad Difícil',
    text: 'La transformación digital requiere no solo la implementación de nuevas tecnologías, sino también un cambio fundamental en la cultura organizacional. Las empresas deben reconocer que la verdadera innovación proviene de la combinación sinergética entre datos, procesos y capital humano. Además, es imprescindible establecer métricas claras de éxito y realizar evaluaciones periódicas del progreso para asegurar que las iniciativas digitales contribuyan efectivamente a los objetivos estratégicos de la organización.',
    difficulty: 'hard',
    durationSeconds: 90,
  },
  {
    title: 'Typing Test Rápido',
    description: 'Test corto para evaluar velocidad inicial - 30 segundos',
    text: 'La velocidad de escritura es importante en muchas profesiones modernas. Escribir rápido y con precisión te ayuda a ser más productivo.',
    difficulty: 'easy',
    durationSeconds: 30,
  },
  {
    title: 'Español Profesional',
    description: 'Texto con vocabulario profesional y técnico - Dificultad Media',
    text: 'El análisis de datos ha revolucionado la manera en que las organizaciones toman decisiones. Mediante la aplicación de técnicas estadísticas avanzadas y algoritmos de aprendizaje automático, es posible extraer patrones significativos de grandes volúmenes de información. Esta disciplina se conoce comúnmente como ciencia de datos y se ha convertido en un activo invaluable para empresas de todos los tamaños.',
    difficulty: 'medium',
    durationSeconds: 60,
  },
];

async function seedTypingTests() {
  try {
    console.log('🌱 Iniciando seeding de typing tests...');

    for (const test of typingTests) {
      const wordCount = test.text.trim().split(/\s+/).length;

      await pool.query(
        `INSERT INTO typing_tests (title, description, text, difficulty, duration_seconds, word_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [test.title, test.description, test.text, test.difficulty, test.durationSeconds, wordCount]
      );

      console.log(`✅ ${test.title} - ${wordCount} palabras`);
    }

    console.log(`\n✅ Se agregaron ${typingTests.length} typing tests`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeding:', error);
    process.exit(1);
  }
}

seedTypingTests();
