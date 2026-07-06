const pool = require('../config/database-sqlite');
const crypto = require('crypto');

class EvaluationAssignmentService {
  /**
   * Asignar evaluaciones a un candidato
   */
  static async assignEvaluations(candidateId, vacancyId, evaluationIds) {
    try {
      const accessToken = crypto.randomBytes(32).toString('hex');

      const result = await pool.query(
        `INSERT INTO evaluation_assignments
         (candidate_id, vacancy_id, evaluation_ids, access_token)
         VALUES ($1, $2, $3, $4)
         RETURNING id, access_token, assigned_at`,
        [candidateId, vacancyId, JSON.stringify(evaluationIds), accessToken]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error asignando evaluaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener asignaciones del candidato por token
   */
  static async getAssignmentByToken(accessToken) {
    try {
      const result = await pool.query(
        `SELECT * FROM evaluation_assignments WHERE access_token = $1`,
        [accessToken]
      );

      if (result.rows.length === 0) return null;

      const assignment = result.rows[0];
      return {
        ...assignment,
        evaluationIds: assignment.evaluation_ids || [],
      };
    } catch (error) {
      console.error('Error obteniendo asignación:', error);
      throw error;
    }
  }

  /**
   * Obtener siguiente evaluación asignada
   */
  static async getNextEvaluation(accessToken) {
    try {
      const assignment = await this.getAssignmentByToken(accessToken);
      if (!assignment) return null;

      const evaluationIds = assignment.evaluation_ids || [];
      if (assignment.current_evaluation_index >= evaluationIds.length) {
        return null; // Todas completadas
      }

      const currentEvalId = evaluationIds[assignment.current_evaluation_index];

      // Obtener datos de la evaluación
      const evalResult = await pool.query(
        `SELECT e.id, e.name, e.description, e.max_time_minutes,
                COUNT(eq.id) as total_questions
         FROM exams e
         LEFT JOIN exam_questions eq ON e.id = eq.exam_id
         WHERE e.id = $1
         GROUP BY e.id`,
        [currentEvalId]
      );

      if (evalResult.rows.length === 0) return null;

      return {
        evaluationId: currentEvalId,
        evaluationNumber: assignment.current_evaluation_index + 1,
        totalEvaluations: evaluationIds.length,
        evaluation: evalResult.rows[0],
      };
    } catch (error) {
      console.error('Error obteniendo siguiente evaluación:', error);
      throw error;
    }
  }

  /**
   * Marcar evaluación como completada
   */
  static async markEvaluationComplete(accessToken) {
    try {
      const assignment = await this.getAssignmentByToken(accessToken);
      if (!assignment) throw new Error('Asignación no encontrada');

      const evaluationIds = assignment.evaluation_ids || [];
      const nextIndex = assignment.current_evaluation_index + 1;

      // Si todas están completadas
      if (nextIndex >= evaluationIds.length) {
        await pool.query(
          `UPDATE evaluation_assignments
           SET current_evaluation_index = $1, completed_at = NOW()
           WHERE access_token = $2`,
          [nextIndex, accessToken]
        );
        return { allCompleted: true };
      }

      // Pasar a la siguiente
      await pool.query(
        `UPDATE evaluation_assignments
         SET current_evaluation_index = $1
         WHERE access_token = $2`,
        [nextIndex, accessToken]
      );

      return { allCompleted: false, nextEvaluationNumber: nextIndex + 1 };
    } catch (error) {
      console.error('Error marcando evaluación como completada:', error);
      throw error;
    }
  }

  /**
   * Obtener asignaciones de un candidato (Admin)
   */
  static async getCandidateAssignments(candidateId) {
    try {
      const result = await pool.query(
        `SELECT * FROM evaluation_assignments WHERE candidate_id = $1`,
        [candidateId]
      );

      return result.rows.map(row => ({
        ...row,
        evaluationIds: row.evaluation_ids || [],
      }));
    } catch (error) {
      console.error('Error obteniendo asignaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener resultados de evaluaciones asignadas (Admin)
   */
  static async getAssignmentResults(candidateId) {
    try {
      const result = await pool.query(
        `SELECT ea.*, c.first_name, c.last_name, c.email
         FROM evaluation_assignments ea
         JOIN candidates c ON ea.candidate_id = c.id
         WHERE ea.candidate_id = $1`,
        [candidateId]
      );

      if (result.rows.length === 0) return null;

      const assignment = result.rows[0];
      const evaluationIds = assignment.evaluation_ids || [];

      // Obtener resultados de cada evaluación
      const evaluationResults = [];
      for (const evalId of evaluationIds) {
        const evalData = await pool.query(
          `SELECT id, name, description, max_time_minutes
           FROM exams WHERE id = $1`,
          [evalId]
        );

        // Obtener respuestas del candidato para esta evaluación
        const answers = await pool.query(
          `SELECT * FROM exam_answers
           WHERE candidate_id = $1 AND exam_id = $2`,
          [candidateId, evalId]
        );

        const totalQuestions = await pool.query(
          `SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = $1`,
          [evalId]
        );

        evaluationResults.push({
          evaluationId: evalId,
          evaluation: evalData.rows[0],
          answersSubmitted: answers.rows.length,
          totalQuestions: parseInt(totalQuestions.rows[0].count),
          answers: answers.rows,
        });
      }

      return {
        candidateId,
        candidateName: `${assignment.first_name} ${assignment.last_name}`,
        email: assignment.email,
        vacancyId: assignment.vacancy_id,
        assignedAt: assignment.assigned_at,
        completedAt: assignment.completed_at,
        evaluationResults,
      };
    } catch (error) {
      console.error('Error obteniendo resultados:', error);
      throw error;
    }
  }

  /**
   * Verificar si token es válido
   */
  static async isTokenValid(accessToken) {
    try {
      const result = await pool.query(
        `SELECT id FROM evaluation_assignments WHERE access_token = $1`,
        [accessToken]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  }
}

module.exports = EvaluationAssignmentService;
