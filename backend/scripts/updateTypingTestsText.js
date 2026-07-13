const pool = require('../src/config/database');

const typingTestsData = [
  {
    id: 1,
    text: 'Hola, mi nombre es Juan y tengo cinco años de experiencia en desarrollo de software. He trabajado con múltiples lenguajes de programación incluyendo Java, Python y JavaScript. Mi pasión es crear aplicaciones que resuelvan problemas reales.'
  },
  {
    id: 2,
    text: 'La arquitectura de microservicios es un enfoque para desarrollar una única aplicación como un conjunto de pequeños servicios que ejecutan en su propio proceso y se comunican con mecanismos ligeros. Esta arquitectura ofrece beneficios como escalabilidad independiente, despliegues más rápidos y mejor mantenibilidad del código.'
  },
  {
    id: 3,
    text: 'La transformación digital requiere no solo la implementación de nuevas tecnologías, sino también un cambio fundamental en la cultura organizacional. Las empresas deben reconocer que la verdadera innovación proviene de la combinación sinergética entre datos, procesos y capital humano. Además, es imprescindible establecer métricas claras de éxito y realizar evaluaciones periódicas del progreso para asegurar que las iniciativas digitales contribuyan efectivamente a los objetivos estratégicos de la organización.'
  },
  {
    id: 4,
    text: 'La velocidad de escritura es importante en muchas profesiones modernas. Escribir rápido y con precisión te ayuda a ser más productivo.'
  },
  {
    id: 5,
    text: 'El análisis de datos ha revolucionado la manera en que las organizaciones toman decisiones. Mediante la aplicación de técnicas estadísticas avanzadas y algoritmos de aprendizaje automático, es posible extraer patrones significativos de grandes volúmenes de información. Esta disciplina se conoce comúnmente como ciencia de datos y se ha convertido en un activo invaluable para empresas de todos los tamaños.'
  }
];

async function updateTypingTests() {
  try {
    console.log('🔄 Actualizando typing tests con texto...');

    for (const test of typingTestsData) {
      await pool.query(
        'UPDATE typing_tests SET text = $1 WHERE id = $2',
        [test.text, test.id]
      );
      console.log(`✅ Test ${test.id} actualizado`);
    }

    console.log(`\n✅ Se actualizaron ${typingTestsData.length} typing tests`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en actualización:', error);
    process.exit(1);
  }
}

updateTypingTests();
