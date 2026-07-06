const pool = require('../config/database-sqlite');

class SkillsAssessmentService {
  /**
   * Obtener todas las evaluaciones disponibles
   */
  static async getAllAssessments(skillType = null, difficulty = null) {
    try {
      let query = `SELECT id, title, description, skill_type, difficulty,
                         estimated_time_minutes, total_points, passing_score
                  FROM skills_assessments`;
      const params = [];
      const conditions = [];

      if (skillType) {
        conditions.push(`skill_type = $${params.length + 1}`);
        params.push(skillType);
      }

      if (difficulty) {
        conditions.push(`difficulty = $${params.length + 1}`);
        params.push(difficulty);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY difficulty, created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo assessments:', error);
      return [];
    }
  }

  /**
   * Obtener una evaluación con sus problemas
   */
  static async getAssessmentWithProblems(assessmentId) {
    try {
      const assessmentResult = await pool.query(
        `SELECT id, title, description, skill_type, difficulty,
                estimated_time_minutes, total_points, passing_score
         FROM skills_assessments WHERE id = $1`,
        [assessmentId]
      );

      if (assessmentResult.rows.length === 0) {
        return null;
      }

      const assessment = assessmentResult.rows[0];

      const problemsResult = await pool.query(
        `SELECT id, problem_number, title, description, problem_type, language,
                starter_code, expected_output, test_cases, points, difficulty
         FROM skills_problems
         WHERE assessment_id = $1
         ORDER BY problem_number ASC`,
        [assessmentId]
      );

      return {
        ...assessment,
        totalProblems: problemsResult.rows.length,
        problems: problemsResult.rows.map(p => ({
          id: p.id,
          number: p.problem_number,
          title: p.title,
          description: p.description,
          type: p.problem_type,
          language: p.language,
          starterCode: p.starter_code,
          expectedOutput: p.expected_output,
          testCases: p.test_cases ? (typeof p.test_cases === 'string' ? JSON.parse(p.test_cases) : p.test_cases) : [],
          points: p.points,
          difficulty: p.difficulty,
        }))
      };
    } catch (error) {
      console.error('Error obteniendo assessment:', error);
      return null;
    }
  }

  /**
   * Validar solución basada en test cases
   */
  static validateSolution(userOutput, testCases, expectedOutput) {
    try {
      // Normalizar output
      const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

      // Si hay test cases, validar contra ellos
      if (testCases && testCases.length > 0) {
        let passedTests = 0;
        const testResults = [];

        for (const testCase of testCases) {
          const expectedNorm = normalize(testCase.expectedOutput);
          const actualNorm = normalize(userOutput || '');
          const isPassed = expectedNorm === actualNorm;

          if (isPassed) passedTests++;

          testResults.push({
            input: testCase.input,
            expected: testCase.expectedOutput,
            passed: isPassed
          });
        }

        return {
          isCorrect: passedTests === testCases.length,
          testsPassed: passedTests,
          totalTests: testCases.length,
          testResults,
          feedback: `Pasó ${passedTests}/${testCases.length} test cases`
        };
      }

      // Validar contra output esperado
      if (expectedOutput) {
        const expectedNorm = normalize(expectedOutput);
        const actualNorm = normalize(userOutput || '');
        const isCorrect = expectedNorm === actualNorm;

        return {
          isCorrect,
          feedback: isCorrect ? 'Output correcto' : `Expected: ${expectedOutput}`,
          testResults: [{ expected: expectedOutput, actual: userOutput, passed: isCorrect }]
        };
      }

      return {
        isCorrect: false,
        feedback: 'No hay criterios de validación',
        testResults: []
      };
    } catch (error) {
      console.error('Error validando solución:', error);
      return {
        isCorrect: false,
        feedback: 'Error al validar',
        testResults: []
      };
    }
  }

  /**
   * Guardar sumisión de problema
   */
  static async saveSubmission(submissionData) {
    try {
      const {
        candidateId,
        assessmentId,
        problemId,
        code,
        output,
        isCorrect,
        pointsEarned,
        feedback,
      } = submissionData;

      const result = await pool.query(
        `INSERT INTO skills_submissions
         (candidate_id, assessment_id, problem_id, code_submitted, output,
          is_correct, points_earned, feedback, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id, submitted_at`,
        [candidateId, assessmentId, problemId, code, output, isCorrect, pointsEarned, feedback]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error guardando submission:', error);
      throw error;
    }
  }

  /**
   * Guardar resultado general de la evaluación
   */
  static async saveResult(resultData) {
    try {
      const {
        candidateId,
        candidateVacancyId,
        assessmentId,
        totalPoints,
        pointsEarned,
        problemsSolved,
        totalProblems,
        timeSeconds,
        startedAt,
      } = resultData;

      const score = (pointsEarned / totalPoints) * 100;

      // Obtener passing_score del assessment
      const assessmentResult = await pool.query(
        'SELECT passing_score FROM skills_assessments WHERE id = $1',
        [assessmentId]
      );

      const passingScore = assessmentResult.rows[0]?.passing_score || 60;
      const passed = score >= passingScore;

      const result = await pool.query(
        `INSERT INTO skills_results
         (candidate_id, candidate_vacancy_id, assessment_id, total_points,
          points_earned, score, problems_solved, total_problems, passed,
          time_taken_seconds, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING id, score, passed, completed_at`,
        [
          candidateId,
          candidateVacancyId,
          assessmentId,
          totalPoints,
          pointsEarned,
          Math.round(score * 100) / 100,
          problemsSolved,
          totalProblems,
          passed,
          timeSeconds,
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
          sr.id, sr.assessment_id, sa.title, sa.skill_type, sa.difficulty,
          sr.score, sr.passed, sr.problems_solved, sr.total_problems,
          sr.time_taken_seconds, sr.completed_at
         FROM skills_results sr
         JOIN skills_assessments sa ON sr.assessment_id = sa.id
         WHERE sr.candidate_id = $1
         ORDER BY sr.completed_at DESC`,
        [candidateId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error obteniendo resultados:', error);
      return [];
    }
  }

  /**
   * Obtener reporte de evaluación
   */
  static async generateReport(candidateId) {
    try {
      const stats = await pool.query(
        `SELECT
          AVG(score) as average_score,
          COUNT(*) as total_assessments,
          SUM(CASE WHEN passed THEN 1 ELSE 0 END) as passed_count,
          AVG(problems_solved::float / total_problems) * 100 as average_completion
         FROM skills_results
         WHERE candidate_id = $1`,
        [candidateId]
      );

      const row = stats.rows[0];
      const all = await this.getCandidateResults(candidateId);

      // Agrupar por tipo de habilidad
      const bySkillType = await pool.query(
        `SELECT
          sa.skill_type,
          AVG(sr.score) as avg_score,
          COUNT(*) as attempts,
          SUM(CASE WHEN sr.passed THEN 1 ELSE 0 END) as passed
         FROM skills_results sr
         JOIN skills_assessments sa ON sr.assessment_id = sa.id
         WHERE sr.candidate_id = $1
         GROUP BY sa.skill_type`,
        [candidateId]
      );

      return {
        totalAssessments: row.total_assessments || 0,
        averageScore: row.average_score ? Math.round(row.average_score * 100) / 100 : 0,
        passedCount: row.passed_count || 0,
        averageCompletion: row.average_completion ? Math.round(row.average_completion * 100) / 100 : 0,
        bySkillType: bySkillType.rows.map(r => ({
          skillType: r.skill_type,
          averageScore: Math.round(r.avg_score * 100) / 100,
          attempts: r.attempts,
          passed: r.passed
        })),
        allResults: all,
      };
    } catch (error) {
      console.error('Error generando reporte:', error);
      return null;
    }
  }

  /**
   * Obtener detalle de una sumisión
   */
  static async getSubmissionDetail(submissionId) {
    try {
      const result = await pool.query(
        `SELECT
          ss.id, ss.code_submitted, ss.output, ss.is_correct,
          ss.points_earned, ss.feedback, ss.submitted_at,
          sp.title, sp.description, sp.language, sp.expected_output,
          sa.title as assessment_title
         FROM skills_submissions ss
         JOIN skills_problems sp ON ss.problem_id = sp.id
         JOIN skills_assessments sa ON ss.assessment_id = sa.id
         WHERE ss.id = $1`,
        [submissionId]
      );

      if (result.rows.length === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('Error obteniendo submission:', error);
      return null;
    }
  }
}

module.exports = SkillsAssessmentService;
