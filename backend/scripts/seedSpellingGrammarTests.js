const pool = require('../src/config/database');

const testsData = [
  {
    title: 'Ortografía Básica - Nivel Fácil',
    description: 'Test básico de ortografía en español',
    difficulty: 'easy',
    testType: 'spelling',
    language: 'es',
    questions: [
      {
        type: 'identify_error',
        text: '¿Cuál es la palabra incorrecta? "La sintonía de la radio es perfecta"',
        correctAnswer: 'sintonía',
        explanation: 'La palabra correcta es "sintonización" o "sintonía" está bien. Aquí no hay error.',
        options: ['sintonía', 'radio', 'perfecta', 'la'],
        difficulty: 'easy'
      },
      {
        type: 'identify_error',
        text: '¿Cuál está mal escrito? "Ayer fuimos al spital para visitar a mi abuelo"',
        correctAnswer: 'spital',
        explanation: 'Debe ser "hospital" con "h" al inicio.',
        options: ['fuimos', 'spital', 'visitar', 'abuelo'],
        difficulty: 'easy'
      },
      {
        type: 'fill_blank',
        text: 'La palabra correcta para "poder sentir o experimentar" es: ______',
        correctAnswer: 'percibir',
        explanation: 'Percibir es un verbo que significa captar con los sentidos o entender.',
        options: null,
        difficulty: 'easy'
      },
    ]
  },
  {
    title: 'Gramática - Conjugación Verbal',
    description: 'Prueba sobre conjugación correcta de verbos',
    difficulty: 'medium',
    testType: 'grammar',
    language: 'es',
    questions: [
      {
        type: 'multiple_choice',
        text: 'Elige la conjugación correcta: "Si yo _______ una segunda oportunidad, cambiaría todo"',
        correctAnswer: 'tuviera',
        explanation: 'En condicional, se usa el imperfecto de subjuntivo: "tuviera"',
        options: ['tengo', 'tuviera', 'tendría', 'tenía'],
        difficulty: 'medium'
      },
      {
        type: 'correct_sentence',
        text: 'La orción tiene un error gramatical: "Nosotros no sabamos qué hacer en esa situación"',
        correctAnswer: 'Nosotros no sabíamos qué hacer en esa situación',
        explanation: 'El verbo "saber" en pretérito imperfecto se conjuga como "sabíamos", no "sabamos"',
        options: null,
        difficulty: 'medium'
      },
      {
        type: 'fill_blank',
        text: 'Completa: "Cuando _______ al cine, siempre compro palomitas"',
        correctAnswer: 'voy',
        explanation: 'Primera persona singular del presente: "voy"',
        options: null,
        difficulty: 'medium'
      },
    ]
  },
  {
    title: 'Puntuación y Acentuación',
    description: 'Test sobre uso correcto de tildes y puntuación',
    difficulty: 'medium',
    testType: 'spelling',
    language: 'es',
    questions: [
      {
        type: 'identify_error',
        text: '¿Cuál está mal acentuada? "Él corrió rápido hasta la puerta"',
        correctAnswer: 'ninguno',
        explanation: 'Todas las palabras están correctamente acentuadas',
        options: ['Él', 'corrió', 'rápido', 'ninguno'],
        difficulty: 'medium'
      },
      {
        type: 'correct_sentence',
        text: 'Corrige: "¿Que te parece mi trabajo?"',
        correctAnswer: '¿Qué te parece mi trabajo?',
        explanation: 'El pronombre interrogativo "qué" debe llevar tilde.',
        options: null,
        difficulty: 'medium'
      },
      {
        type: 'fill_blank',
        text: 'Palabra que SIEMPRE lleva tilde por ser aguda terminada en "s": ______',
        correctAnswer: 'compás',
        explanation: 'Las palabras agudas terminadas en s llevan tilde: compás, estrés, etc.',
        options: null,
        difficulty: 'medium'
      },
    ]
  },
  {
    title: 'Ortografía Avanzada - Homófonos',
    description: 'Distinguir entre palabras que suenan igual pero se escriben diferente',
    difficulty: 'hard',
    testType: 'spelling',
    language: 'es',
    questions: [
      {
        type: 'multiple_choice',
        text: 'Elige el correcto: "No _______ si vendré mañana" (verbo haber o conocimiento)',
        correctAnswer: 'sé',
        explanation: '"sé" (del verbo saber) se usa para la persona que sabe. "se" es pronombre.',
        options: ['se', 'sé', 'ce', 'sea'],
        difficulty: 'hard'
      },
      {
        type: 'correct_sentence',
        text: 'La oración tiene error: "Ay, que hermoso día" (expresión de dolor o preposición)',
        correctAnswer: '¡Ay, qué hermoso día!',
        explanation: '"Ay" es interjección de dolor/sorpresa. Además, "qué" es interrogativo y lleva tilde',
        options: null,
        difficulty: 'hard'
      },
      {
        type: 'fill_blank',
        text: 'Rellena con "a" o "ha": "Ella _______ ido _______ la tienda"',
        correctAnswer: 'ha a',
        explanation: '"ha" (auxiliar haber) + "a" (preposición)',
        options: null,
        difficulty: 'hard'
      },
    ]
  },
  {
    title: 'Redacción y Estilo',
    description: 'Prueba de coherencia y claridad en la redacción',
    difficulty: 'hard',
    testType: 'grammar',
    language: 'es',
    questions: [
      {
        type: 'correct_sentence',
        text: 'Mejora la redundancia: "Lo importante es que seas impotente en tu trabajo"',
        correctAnswer: 'Lo importante es que seas competente en tu trabajo',
        explanation: '"Impotente" significa sin poder. "Competente" significa capaz y apto.',
        options: null,
        difficulty: 'hard'
      },
      {
        type: 'multiple_choice',
        text: 'Elige la opción más clara: "El libro que leyó Juan del autor que ganó el premio"',
        correctAnswer: 'El libro del autor ganador del premio que leyó Juan',
        explanation: 'Mejor orden: primero identificar el libro y su autor, luego la acción de leer',
        options: [
          'El libro que leyó Juan del autor que ganó el premio',
          'El libro del autor ganador del premio que leyó Juan',
          'Juan leyó el libro del autor premiado',
          'El libro premiado del autor que Juan leyó'
        ],
        difficulty: 'hard'
      },
    ]
  }
];

async function seedSpellingGrammarTests() {
  try {
    console.log('🌱 Iniciando seeding de spelling/grammar tests...');

    for (const testData of testsData) {
      const testResult = await pool.query(
        `INSERT INTO spelling_grammar_tests (title, description, difficulty, test_type, language)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [testData.title, testData.description, testData.difficulty, testData.testType, testData.language]
      );

      const testId = testResult.rows[0].id;

      for (let i = 0; i < testData.questions.length; i++) {
        const q = testData.questions[i];
        await pool.query(
          `INSERT INTO spelling_grammar_questions
           (test_id, question_type, question_text, correct_answer, explanation, options, difficulty, order_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            testId,
            q.type,
            q.text,
            q.correctAnswer,
            q.explanation,
            q.options ? JSON.stringify(q.options) : null,
            q.difficulty || testData.difficulty,
            i + 1
          ]
        );
      }

      console.log(`✅ ${testData.title} - ${testData.questions.length} preguntas`);
    }

    console.log(`\n✅ Se agregaron ${testsData.length} spelling/grammar tests`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeding:', error);
    process.exit(1);
  }
}

seedSpellingGrammarTests();
