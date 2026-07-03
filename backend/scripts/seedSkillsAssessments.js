const pool = require('../src/config/database');

const assessmentsData = [
  {
    title: 'Lógica y Pensamiento Crítico',
    description: 'Evaluación de habilidades de lógica y resolución de problemas',
    skillType: 'logic',
    difficulty: 'easy',
    estimatedTime: 20,
    totalPoints: 30,
    passingScore: 60,
    problems: [
      {
        number: 1,
        title: 'Secuencia Numérica',
        description: '¿Cuál es el próximo número en la secuencia? 2, 4, 8, 16, ?',
        type: 'logic',
        starterCode: '// Tu respuesta aquí\n// Devuelve el próximo número',
        expectedOutput: '32',
        testCases: [
          { input: '', expectedOutput: '32' }
        ],
        points: 10,
        difficulty: 'easy'
      },
      {
        number: 2,
        title: 'Análisis de Patrones',
        description: 'Identifica el patrón: A, B, D, G, ?',
        type: 'logic',
        starterCode: '// Identifica el siguiente elemento',
        expectedOutput: 'K',
        testCases: [
          { input: '', expectedOutput: 'K' }
        ],
        points: 10,
        difficulty: 'medium'
      },
      {
        number: 3,
        title: 'Operaciones Matemáticas',
        description: 'Si 2x + 5 = 13, ¿cuál es el valor de x?',
        type: 'logic',
        starterCode: '// Resuelve la ecuación',
        expectedOutput: '4',
        testCases: [
          { input: '', expectedOutput: '4' }
        ],
        points: 10,
        difficulty: 'medium'
      }
    ]
  },
  {
    title: 'Programación en JavaScript',
    description: 'Evaluación de conocimientos básicos en JavaScript',
    skillType: 'programming',
    difficulty: 'medium',
    estimatedTime: 45,
    totalPoints: 40,
    passingScore: 60,
    problems: [
      {
        number: 1,
        title: 'Invertir Array',
        description: 'Escribe una función que invierta un array sin usar reverse()',
        type: 'code',
        language: 'javascript',
        starterCode: 'function reverseArray(arr) {\n  // Tu código aquí\n}',
        expectedOutput: '[3,2,1]',
        testCases: [
          { input: '[1,2,3]', expectedOutput: '[3,2,1]' },
          { input: '[5,4,3,2,1]', expectedOutput: '[1,2,3,4,5]' }
        ],
        points: 15,
        difficulty: 'easy'
      },
      {
        number: 2,
        title: 'Filtrar Pares',
        description: 'Retorna solo los números pares de un array',
        type: 'code',
        language: 'javascript',
        starterCode: 'function filterEven(arr) {\n  // Tu código aquí\n}',
        expectedOutput: '[2,4,6]',
        testCases: [
          { input: '[1,2,3,4,5,6]', expectedOutput: '[2,4,6]' },
          { input: '[10,15,20,25]', expectedOutput: '[10,20]' }
        ],
        points: 15,
        difficulty: 'easy'
      },
      {
        number: 3,
        title: 'Encontrar Duplicados',
        description: 'Encuentra el primer elemento duplicado en un array',
        type: 'code',
        language: 'javascript',
        starterCode: 'function findDuplicate(arr) {\n  // Tu código aquí\n}',
        expectedOutput: '2',
        testCases: [
          { input: '[1,2,3,2,4]', expectedOutput: '2' },
          { input: '[5,5]', expectedOutput: '5' }
        ],
        points: 10,
        difficulty: 'medium'
      }
    ]
  },
  {
    title: 'Resolución de Problemas - Nivel Avanzado',
    description: 'Problemas complejos que requieren análisis profundo',
    skillType: 'problem-solving',
    difficulty: 'hard',
    estimatedTime: 60,
    totalPoints: 50,
    passingScore: 70,
    problems: [
      {
        number: 1,
        title: 'Problema de Optimización',
        description: 'Tienes 5 tareas con diferentes duraciones y prioridades. ¿Cuál es el orden óptimo?',
        type: 'analysis',
        starterCode: 'Tareas: A(2h,P1), B(1h,P3), C(3h,P2), D(1h,P1), E(2h,P3)\n// Explica tu estrategia',
        expectedOutput: 'D, A, C, B, E',
        testCases: [
          { input: '', expectedOutput: 'D, A, C, B, E' }
        ],
        points: 25,
        difficulty: 'hard'
      },
      {
        number: 2,
        title: 'Algoritmo de Caché',
        description: 'Implementa un LRU Cache con operaciones Get y Put',
        type: 'code',
        language: 'javascript',
        starterCode: 'class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}',
        expectedOutput: 'LRU implementado',
        testCases: [
          { input: 'put(1,1), put(2,2), get(1)', expectedOutput: '1' }
        ],
        points: 25,
        difficulty: 'hard'
      }
    ]
  },
  {
    title: 'Manejo de Datos y Estructuras',
    description: 'Evaluación de conocimientos en estructuras de datos',
    skillType: 'data-structures',
    difficulty: 'medium',
    estimatedTime: 40,
    totalPoints: 30,
    passingScore: 60,
    problems: [
      {
        number: 1,
        title: 'Búsqueda Binaria',
        description: 'Implementa búsqueda binaria en un array ordenado',
        type: 'code',
        language: 'javascript',
        starterCode: 'function binarySearch(arr, target) {\n  // Tu código aquí\n}',
        expectedOutput: '3',
        testCases: [
          { input: 'arr=[1,3,5,7,9], target=7', expectedOutput: '3' }
        ],
        points: 15,
        difficulty: 'medium'
      },
      {
        number: 2,
        title: 'Árbol Binario - Búsqueda',
        description: 'Busca un valor en un árbol binario de búsqueda',
        type: 'code',
        language: 'javascript',
        starterCode: 'function searchBST(root, val) {\n  // Tu código aquí\n}',
        expectedOutput: 'found',
        testCases: [
          { input: '', expectedOutput: 'found' }
        ],
        points: 15,
        difficulty: 'hard'
      }
    ]
  }
];

async function seedSkillsAssessments() {
  try {
    console.log('🌱 Iniciando seeding de skills assessments...');

    for (const assessmentData of assessmentsData) {
      const assessmentResult = await pool.query(
        `INSERT INTO skills_assessments
         (title, description, skill_type, difficulty, estimated_time_minutes, total_points, passing_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.skillType,
          assessmentData.difficulty,
          assessmentData.estimatedTime,
          assessmentData.totalPoints,
          assessmentData.passingScore
        ]
      );

      const assessmentId = assessmentResult.rows[0].id;

      for (const problem of assessmentData.problems) {
        await pool.query(
          `INSERT INTO skills_problems
           (assessment_id, problem_number, title, description, problem_type, language,
            starter_code, expected_output, test_cases, points, difficulty)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            assessmentId,
            problem.number,
            problem.title,
            problem.description,
            problem.type,
            problem.language || null,
            problem.starterCode,
            problem.expectedOutput,
            JSON.stringify(problem.testCases),
            problem.points,
            problem.difficulty
          ]
        );
      }

      console.log(`✅ ${assessmentData.title} - ${assessmentData.problems.length} problemas`);
    }

    console.log(`\n✅ Se agregaron ${assessmentsData.length} skills assessments`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeding:', error);
    process.exit(1);
  }
}

seedSkillsAssessments();
