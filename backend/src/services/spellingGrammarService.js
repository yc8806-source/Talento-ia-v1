const pool = require('../config/database');

class SpellingGrammarService {
  /**
   * Obtener todos los tests disponibles
   */
  static async getAllTests(difficulty = null, language = 'es') {
    try {
      let query = 'SELECT id, title, description, difficulty, test_type FROM spelling_grammar_tests WHERE language = $1';
      const params = [language];

      if (difficulty) {
        query += ' AND difficulty = $2';
        params.push(difficulty);
      }

      query += ' ORDER BY difficulty, created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo spelling/grammar tests:', error);
      return [];
    }
  }

  /**
   * Obtener un test con sus preguntas
   */
  static async getTestWithQuestions(testId) {
    try {
      const testResult = await pool.query(
        `SELECT id, title, description, difficulty, test_type, language
         FROM spelling_grammar_tests WHERE id = $1`,
        [testId]
      );

      if (testResult.rows.length === 0) {
        return null;
      }

      const test = testResult.rows[0];

      const questionsResult = await pool.query(
        `SELECT id, question_type, question_text, correct_answer, explanation, options, difficulty, order_number
         FROM spelling_grammar_questions
         WHERE test_id = $1
         ORDER BY order_number ASC`,
        [testId]
      );

      return {
        ...test,
        totalQuestions: questionsResult.rows.length,
        questions: questionsResult.rows.map(q => {
          let parsedOptions = null;
          if (q.options) {
            if (typeof q.options === 'string') {
              parsedOptions = JSON.parse(q.options);
            } else {
              parsedOptions = q.options;
            }
          }
          return {
            id: q.id,
            type: q.question_type,
            text: q.question_text,
            correctAnswer: q.correct_answer,
            options: parsedOptions,
            difficulty: q.difficulty,
            explanation: q.explanation,
          };
        })
      };
    } catch (error) {
      console.error('Error obteniendo test:', error);
      return null;
    }
  }

  /**
   * Validar respuestas y calcular puntuación
   */
  static async validateAnswers(testId, userAnswers) {
    try {
      const questionsResult = await pool.query(
        `SELECT id, question_type, correct_answer
         FROM spelling_grammar_questions
         WHERE test_id = $1`,
        [testId]
      );

      const questions = questionsResult.rows;
      let correctCount = 0;
      const detailedResults = [];

      for (const question of questions) {
        const userAnswer = userAnswers[question.id];
        const isCorrect = this.compareAnswers(userAnswer, question.correct_answer, question.question_type);

        if (isCorrect) {
          correctCount++;
        }

        detailedResults.push({
          questionId: question.id,
          userAnswer,
          correctAnswer: question.correct_answer,
          isCorrect,
          type: question.question_type,
        });
      }

      const accuracy = (correctCount / questions.length) * 100;
      const score = Math.round(accuracy * 100) / 100;

      return {
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        score: score,
        accuracy: Math.round(accuracy * 100) / 100,
        detailedResults,
      };
    } catch (error) {
      console.error('Error validando respuestas:', error);
      throw error;
    }
  }

  /**
   * Comparar respuestas (normalizar para case-insensitive y espacios)
   */
  static compareAnswers(userAnswer, correctAnswer, questionType) {
    if (!userAnswer || !correctAnswer) return false;

    // Normalizar: convertir a minúsculas y remover espacios extras
    const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const userNorm = normalize(userAnswer);
    const correctNorm = normalize(correctAnswer);

    // Para respuestas de opción múltiple, comparar directamente
    if (questionType === 'multiple_choice') {
      return userNorm === correctNorm;
    }

    // Para llenar espacios en blanco, comparar con variaciones
    if (questionType === 'fill_blank') {
      return userNorm === correctNorm;
    }

    // Para identificar errores, la respuesta puede ser el número de error o el error mismo
    if (questionType === 'identify_error') {
      return userNorm === correctNorm || userAnswer.toString() === correctAnswer.toString();
    }

    // Para corrección de oraciones
    if (questionType === 'correct_sentence') {
      return userNorm === correctNorm;
    }

    return false;
  }

  /**
   * Guardar resultado
   */
  static async saveResult(resultData) {
    try {
      const {
        candidateId,
        candidateVacancyId,
        testId,
        totalQuestions,
        correctAnswers,
        score,
        accuracy,
        timeSeconds,
        answers,
        startedAt,
      } = resultData;

      const result = await pool.query(
        `INSERT INTO spelling_grammar_results
         (candidate_id, candidate_vacancy_id, test_id, total_questions,
          correct_answers, score, accuracy, time_taken_seconds, answers, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         RETURNING id, score, accuracy, completed_at`,
        [
          candidateId,
          candidateVacancyId,
          testId,
          totalQuestions,
          correctAnswers,
          score,
          accuracy,
          timeSeconds,
          JSON.stringify(answers),
          startedAt
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error guardando resultado:', error);
      throw error;
    }
  }

  /**
   * Obtener resultados de un candidato
   */
  static async getCandidateResults(candidateId) {
    try {
      const result = await pool.query(
        `SELECT
          sgr.id, sgr.test_id, sgt.title, sgt.difficulty,
          sgr.total_questions, sgr.correct_answers, sgr.score, sgr.accuracy,
          sgr.time_taken_seconds, sgr.completed_at
         FROM spelling_grammar_results sgr
         JOIN spelling_grammar_tests sgt ON sgr.test_id = sgt.id
         WHERE sgr.candidate_id = $1
         ORDER BY sgr.completed_at DESC`,
        [candidateId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error obteniendo resultados:', error);
      return [];
    }
  }

  /**
   * Obtener reporte de ortografía y gramática
   */
  static async generateReport(candidateId) {
    try {
      const stats = await pool.query(
        `SELECT AVG(score) as average_score, AVG(accuracy) as average_accuracy, COUNT(*) as total_tests
         FROM spelling_grammar_results
         WHERE candidate_id = $1`,
        [candidateId]
      );

      const row = stats.rows[0];

      const all = await this.getCandidateResults(candidateId);

      return {
        totalTests: row.total_tests,
        averageScore: row.average_score ? Math.round(row.average_score * 100) / 100 : 0,
        averageAccuracy: row.average_accuracy ? Math.round(row.average_accuracy * 100) / 100 : 0,
        allResults: all,
      };
    } catch (error) {
      console.error('Error generando reporte:', error);
      return null;
    }
  }

  /**
   * Crear nueva prueba (solo admin)
   */
  static async createTest(testData) {
    try {
      const { title, description, difficulty, language, testType, questions } = testData;

      // Crear el test
      const testResult = await pool.query(
        `INSERT INTO spelling_grammar_tests
         (title, description, difficulty, language, test_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [title, description, difficulty || 'medium', language || 'es', testType]
      );

      const testId = testResult.rows[0].id;

      // Agregar preguntas
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await pool.query(
            `INSERT INTO spelling_grammar_questions
             (test_id, question_type, question_text, correct_answer, explanation, options, difficulty, order_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              testId,
              q.type,
              q.text,
              q.correctAnswer,
              q.explanation || null,
              q.options ? JSON.stringify(q.options) : null,
              q.difficulty || 'medium',
              i + 1
            ]
          );
        }
      }

      return testId;
    } catch (error) {
      console.error('Error creando test:', error);
      throw error;
    }
  }

  /**
   * Seed el test por defecto (id=1) con las preguntas de ortografía y gramática
   * Se ejecuta automáticamente si el test no existe
   */
  static async seedDefaultTest() {
    try {
      const questions = [
        { numero: 1, pregunta: "¿Cuál es la forma correcta de conjugar el verbo \"haber\" en presente?", opciones: ["ha", "ave", "haya", "aya"], respuestaCorrecta: "ha", dificultad: "medium" },
        { numero: 2, pregunta: "¿Cuál de estas palabras está correctamente acentuada?", opciones: ["teléfono", "música", "crímen", "exámen"], respuestaCorrecta: "teléfono", dificultad: "medium" },
        { numero: 3, pregunta: "¿Qué palabra es un sinónimo de \"perplejo\"?", opciones: ["claro", "confundido", "directo", "obvio"], respuestaCorrecta: "claro", dificultad: "medium" },
        { numero: 4, pregunta: "¿Cuál oración usa correctamente el subjuntivo?", opciones: ["Creo que viene mañana", "Espero que venga mañana", "Vino mañana", "Viene mañana"], respuestaCorrecta: "Espero que venga mañana", dificultad: "medium" },
        { numero: 5, pregunta: "¿Cuál es la forma correcta del plural de \"luz\"?", opciones: ["luces", "lucez", "luz", "lucis"], respuestaCorrecta: "luces", dificultad: "medium" },
        { numero: 6, pregunta: "¿Qué palabra tiene una b y no una v?", opciones: ["civico", "actividad", "absoluto", "negatividad"], respuestaCorrecta: "absoluto", dificultad: "medium" },
        { numero: 7, pregunta: "¿Cuál es la acentuación correcta de esta palabra?", opciones: ["rápido", "rapido", "rápi", "raido"], respuestaCorrecta: "rápido", dificultad: "medium" },
        { numero: 8, pregunta: "¿Cuál oración tiene puntuación correcta?", opciones: ["Hola, ¿cómo estás?", "Hola ¿cómo estás", "hola como estás", "Hola como estás?"], respuestaCorrecta: "Hola, ¿cómo estás?", dificultad: "medium" },
        { numero: 9, pregunta: "¿Qué palabra se escribe con j?", opciones: ["jota", "gato", "joven", "viejo"], respuestaCorrecta: "jota", dificultad: "medium" },
        { numero: 10, pregunta: "¿Cuál es el participio regular del verbo \"hablar\"?", opciones: ["hablado", "hablando", "habla", "hablé"], respuestaCorrecta: "hablado", dificultad: "medium" }
      ];

      // Crear test
      const testResult = await pool.query(
        `INSERT INTO spelling_grammar_tests
         (id, title, description, difficulty, test_type, language)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [1, 'Ortografía y Gramática', 'Prueba de ortografía y gramática', 'medium', 'multiple_choice', 'es']
      );

      if (testResult.rows.length === 0) {
        console.log('✅ Test id=1 ya existe');
        return 1;
      }

      // Insertar preguntas
      for (const q of questions) {
        await pool.query(
          `INSERT INTO spelling_grammar_questions
           (test_id, question_type, question_text, correct_answer, explanation, options, difficulty, order_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            1,
            'multiple_choice',
            q.pregunta,
            q.respuestaCorrecta,
            'Respuesta correcta',
            JSON.stringify({ options: q.opciones }),
            q.dificultad,
            q.numero
          ]
        );
      }

      console.log('✅ Test id=1 sembrado exitosamente con 10 preguntas');
      return 1;
    } catch (error) {
      console.error('Error sembrando test por defecto:', error.message);
      throw error;
    }
  }
}

module.exports = SpellingGrammarService;
