const pool = require('../config/database');

class ExamScoreService {
  /**
   * Calcular y guardar puntuación de un examen completado
   */
  static async calculateAndSaveScore(candidateId, examId) {
    try {
      // Obtener todas las preguntas del examen
      const questionsResult = await pool.query(
        `SELECT DISTINCT eq.question_id
         FROM exam_questions eq
         WHERE eq.exam_id = $1`,
        [examId]
      );

      const questions = questionsResult.rows;
      if (questions.length === 0) {
        console.log(`No questions found for exam ${examId}`);
        return null;
      }

      // Obtener respuestas del candidato
      const answersResult = await pool.query(
        `SELECT ea.question_id, ea.answer_value
         FROM exam_answers ea
         WHERE ea.candidate_id = $1 AND ea.exam_id = $2`,
        [candidateId, examId]
      );

      const answers = answersResult.rows;

      // Calcular puntuación: obtener score de cada opción respondida
      let totalScore = 0;
      for (const answer of answers) {
        try {
          // answer_value es el ID de la opción seleccionada
          const scoreResult = await pool.query(
            `SELECT COALESCE(score, 0) as score
             FROM question_options
             WHERE id = $1 AND question_id = $2`,
            [parseInt(answer.answer_value), answer.question_id]
          );

          if (scoreResult.rows.length > 0) {
            const score = parseFloat(scoreResult.rows[0].score) || 0;
            totalScore += score;
          }
        } catch (err) {
          console.error(`Error getting score for answer ${answer.answer_value}:`, err);
        }
      }

      // Obtener puntuación máxima posible del examen
      const maxScoreResult = await pool.query(
        `SELECT COALESCE(SUM(MAX(qo.score)), 0) as max_score
         FROM exam_questions eq
         JOIN question_options qo ON qo.question_id = eq.question_id
         WHERE eq.exam_id = $1
         GROUP BY eq.question_id`,
        [examId]
      );

      // Calcular max_score como la suma de los scores máximos por pregunta
      let maxScore = 0;
      if (maxScoreResult.rows.length > 0) {
        maxScore = questions.length > 0 ? maxScoreResult.rows.length : 0;
      }

      // Si maxScore es 0, usar cantidad de preguntas como proxy
      if (maxScore === 0) {
        maxScore = questions.length;
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // Guardar o actualizar puntuación
      const scoreResult = await pool.query(
        `INSERT INTO exam_scores (candidate_id, exam_id, total_score, max_score, percentage, completed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (candidate_id, exam_id)
         DO UPDATE SET
           total_score = $3,
           max_score = $4,
           percentage = $5,
           completed_at = NOW()
         RETURNING *`,
        [candidateId, examId, Math.round(totalScore), Math.round(maxScore), parseFloat(percentage.toFixed(2))]
      );

      console.log(`Score saved for candidate ${candidateId}, exam ${examId}: ${totalScore.toFixed(2)}/${maxScore} (${percentage.toFixed(2)}%)`);
      return scoreResult.rows[0];
    } catch (error) {
      console.error('Error calculating exam score:', error);
      throw error;
    }
  }

  /**
   * Obtener puntuación de un examen
   */
  static async getScore(candidateId, examId) {
    try {
      const result = await pool.query(
        `SELECT * FROM exam_scores
         WHERE candidate_id = $1 AND exam_id = $2`,
        [candidateId, examId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting exam score:', error);
      return null;
    }
  }

  /**
   * Obtener todas las puntuaciones de un candidato
   */
  static async getCandidateScores(candidateId) {
    try {
      const result = await pool.query(
        `SELECT es.*, e.name as exam_name, e.description as exam_description
         FROM exam_scores es
         JOIN exams e ON es.exam_id = e.id
         WHERE es.candidate_id = $1
         ORDER BY es.completed_at DESC`,
        [candidateId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting candidate scores:', error);
      return [];
    }
  }
}

module.exports = ExamScoreService;
