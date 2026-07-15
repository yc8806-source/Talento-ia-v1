const pool = require('../config/database');

class TypingService {
  /**
   * Calcular WPM y métrica de typing
   */
  static calculateWPM(originalText, inputText, timeSeconds) {
    // Palabras: un espacio en blanco o puntuación separa palabras
    const wordCount = originalText.trim().split(/\s+/).length;

    // Caracteres totales escritos
    const totalChars = inputText.length;

    // WPM = (totalChars / 5) / (timeSeconds / 60)
    // La mayoría de tests de typing usan 5 como promedio de caracteres por palabra
    const grossWPM = (totalChars / 5) / (timeSeconds / 60);

    // Calcular errores
    const { totalErrors, charErrors } = this.countErrors(originalText, inputText);

    // Net WPM = Gross WPM - (Errores / timeSeconds * 60)
    const netWPM = Math.max(0, grossWPM - (totalErrors / (timeSeconds / 60)));

    // Precisión = (Caracteres correctos / Caracteres totales) * 100
    const correctChars = totalChars - charErrors;
    const accuracy = (correctChars / totalChars) * 100;

    return {
      grossWPM: Math.round(grossWPM * 100) / 100,
      netWPM: Math.round(netWPM * 100) / 100,
      wpm: Math.round(netWPM * 100) / 100, // WPM final es el NET WPM
      accuracy: Math.round(accuracy * 100) / 100,
      totalErrors,
      wordCount,
      charCount: totalChars,
      correctChars,
      charErrors,
    };
  }

  /**
   * Contar errores comparando texto original vs input
   */
  static countErrors(originalText, inputText) {
    const original = originalText.trim().split('');
    const input = inputText.trim().split('');

    let totalErrors = 0;
    let charErrors = 0;

    // Contar caracteres incorrectos
    const maxLength = Math.max(original.length, input.length);
    for (let i = 0; i < maxLength; i++) {
      if (original[i] !== input[i]) {
        charErrors++;
        // Contar errores de palabras
        if (i === 0 || original[i - 1] === ' ') {
          totalErrors++;
        }
      }
    }

    // Si faltan caracteres, eso también es error
    if (inputText.length < originalText.length) {
      totalErrors += Math.ceil((originalText.length - inputText.length) / 5);
    }

    return {
      totalErrors: Math.max(0, totalErrors),
      charErrors,
    };
  }

  /**
   * Obtener todos los typing tests disponibles
   */
  static async getAllTests(difficulty = null) {
    try {
      let query = 'SELECT id, title, description, difficulty, duration_seconds, word_count FROM typing_tests';
      const params = [];

      if (difficulty) {
        query += ' WHERE difficulty = $1';
        params.push(difficulty);
      }

      query += ' ORDER BY difficulty, created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo typing tests:', error);
      return [];
    }
  }

  /**
   * Obtener un typing test por ID
   */
  static async getTest(testId) {
    try {
      const result = await pool.query(
        'SELECT id, title, description, text, difficulty, duration_seconds, word_count FROM typing_tests WHERE id = $1',
        [testId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error obteniendo typing test:', error);
      return null;
    }
  }

  /**
   * Guardar resultado de typing test
   */
  static async saveResult(resultData) {
    try {
      const {
        candidateId,
        candidateVacancyId,
        typingTestId,
        inputText,
        wpm,
        accuracy,
        grossWPM,
        netWPM,
        totalErrors,
        timeSeconds,
        startedAt,
      } = resultData;

      console.log('🔍 INSERT Query params:', { candidateId, candidateVacancyId, typingTestId, wpm, accuracy, totalErrors });

      const result = await pool.query(
        `INSERT INTO typing_results
         (candidate_id, candidate_vacancy_id, typing_test_id, input_text, wpm, accuracy,
          gross_wpm, net_wpm, total_errors, time_taken_seconds, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING id, wpm, accuracy, net_wpm, completed_at`,
        [
          candidateId,
          candidateVacancyId,
          typingTestId,
          inputText,
          wpm,
          accuracy,
          grossWPM,
          netWPM,
          totalErrors,
          timeSeconds,
          startedAt
        ]
      );

      console.log('✅ INSERT Result:', { rows: result.rows.length, row0: result.rows[0] });
      return result.rows[0];
    } catch (error) {
      console.error('Error guardando resultado de typing:', error);
      throw error;
    }
  }

  /**
   * Obtener resultados de typing de un candidato
   */
  static async getCandidateResults(candidateId) {
    try {
      const result = await pool.query(
        `SELECT
          tr.id, tr.typing_test_id, tt.title, tt.difficulty,
          tr.wpm, tr.accuracy, tr.net_wpm, tr.total_errors,
          tr.time_taken_seconds, tr.completed_at
         FROM typing_results tr
         JOIN typing_tests tt ON tr.typing_test_id = tt.id
         WHERE tr.candidate_id = $1
         ORDER BY tr.completed_at DESC`,
        [candidateId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error obteniendo resultados de typing:', error);
      return [];
    }
  }

  /**
   * Obtener mejor resultado de typing
   */
  static async getBestResult(candidateId) {
    try {
      const result = await pool.query(
        `SELECT
          tr.id, tr.typing_test_id, tt.title,
          tr.wpm, tr.accuracy, tr.net_wpm, tr.completed_at
         FROM typing_results tr
         JOIN typing_tests tt ON tr.typing_test_id = tt.id
         WHERE tr.candidate_id = $1
         ORDER BY tr.wpm DESC
         LIMIT 1`,
        [candidateId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error obteniendo mejor resultado:', error);
      return null;
    }
  }

  /**
   * Obtener promedio de WPM de un candidato
   */
  static async getAverageWPM(candidateId) {
    try {
      const result = await pool.query(
        `SELECT AVG(wpm) as average_wpm, AVG(accuracy) as average_accuracy, COUNT(*) as total_tests
         FROM typing_results
         WHERE candidate_id = $1`,
        [candidateId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        averageWPM: row.average_wpm ? Math.round(row.average_wpm * 100) / 100 : 0,
        averageAccuracy: row.average_accuracy ? Math.round(row.average_accuracy * 100) / 100 : 0,
        totalTests: row.total_tests,
      };
    } catch (error) {
      console.error('Error calculando promedio de WPM:', error);
      return null;
    }
  }

  /**
   * Generar informe de typing
   */
  static async generateReport(candidateId) {
    try {
      const stats = await this.getAverageWPM(candidateId);
      const best = await this.getBestResult(candidateId);
      const all = await this.getCandidateResults(candidateId);

      return {
        totalTests: stats?.totalTests || 0,
        averageWPM: stats?.averageWPM || 0,
        averageAccuracy: stats?.averageAccuracy || 0,
        bestWPM: best?.wpm || 0,
        bestAccuracy: best?.accuracy || 0,
        allResults: all,
      };
    } catch (error) {
      console.error('Error generando reporte:', error);
      return null;
    }
  }
}

module.exports = TypingService;
