const pool = require('../config/database');

class ExamScoreService {
  /**
   * Calcular y guardar puntuación de un examen completado
   */
  static async calculateAndSaveScore(candidateId, examId) {
    try {
      // Obtener todas las preguntas del examen
      const questionsResult = await pool.query(
        `SELECT eq.question_id, q.correct_answer
         FROM exam_questions eq
         JOIN questions q ON eq.question_id = q.id
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
        `SELECT question_id, answer_value
         FROM exam_answers
         WHERE candidate_id = $1 AND exam_id = $2`,
        [candidateId, examId]
      );

      const answers = answersResult.rows;

      // Calcular puntuación
      let correctAnswers = 0;
      for (const answer of answers) {
        const question = questions.find(q => q.question_id === answer.question_id);
        if (question && answer.answer_value === question.correct_answer) {
          correctAnswers++;
        }
      }

      const totalScore = correctAnswers;
      const maxScore = questions.length;
      const percentage = maxScore > 0 ? (correctAnswers / maxScore) * 100 : 0;

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
        [candidateId, examId, totalScore, maxScore, parseFloat(percentage.toFixed(2))]
      );

      console.log(`Score saved for candidate ${candidateId}, exam ${examId}: ${totalScore}/${maxScore} (${percentage.toFixed(2)}%)`);
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
