const pool = require('../config/database');

// GET /api/analytics/my-metrics - Métricas del analista actual
exports.getMyMetrics = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // 1. Contar vacantes creadas
    const vacanciesResult = await pool.query(
      'SELECT COUNT(*) as count FROM vacancies WHERE assigned_to_user_id = $1',
      [userId]
    );
    const vacanciesCount = parseInt(vacanciesResult.rows[0].count);

    // 2. Contar candidatos asignados
    const candidatesResult = await pool.query(
      `SELECT COUNT(DISTINCT cv.candidate_id) as count
       FROM candidate_vacancies cv
       JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE v.assigned_to_user_id = $1`,
      [userId]
    );
    const candidatesCount = parseInt(candidatesResult.rows[0].count);

    // 3. Contar pruebas enviadas
    const evaluationsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM evaluations e
       WHERE e.assigned_by_user_id = $1`,
      [userId]
    );
    const evaluationsCount = parseInt(evaluationsResult.rows[0].count);

    // 4. Contar pruebas completadas
    const completedResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM evaluations e
       WHERE e.assigned_by_user_id = $1 AND e.status = 'completed'`,
      [userId]
    );
    const completedCount = parseInt(completedResult.rows[0].count);

    // 5. Obtener últimas vacantes
    const recentVacanciesResult = await pool.query(
      `SELECT id, title, status, created_at
       FROM vacancies
       WHERE assigned_to_user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    // 6. Obtener estado de vacantes (open vs closed)
    const vacancyStatusResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM vacancies
       WHERE assigned_to_user_id = $1
       GROUP BY status`,
      [userId]
    );

    const vacancyStatus = {};
    vacancyStatusResult.rows.forEach(row => {
      vacancyStatus[row.status] = parseInt(row.count);
    });

    res.json({
      metrics: {
        vacanciesCreated: vacanciesCount,
        candidatesAssigned: candidatesCount,
        evaluationsSent: evaluationsCount,
        evaluationsCompleted: completedCount,
        conversionRate: evaluationsCount > 0
          ? ((completedCount / evaluationsCount) * 100).toFixed(2) + '%'
          : '0%',
        vacancyStatus: vacancyStatus
      },
      recentVacancies: recentVacanciesResult.rows.map(v => ({
        id: v.id,
        title: v.title,
        status: v.status,
        createdAt: v.created_at
      }))
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({
      error: 'Error al obtener métricas',
      details: error.message
    });
  }
};

// GET /api/analytics/all-analysts - Tabla de todos los analistas (solo admin)
exports.getAllAnalystsMetrics = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver todas las métricas' });
    }

    // Obtener métricas de cada analista
    const analystsResult = await pool.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        COUNT(DISTINCT v.id) as vacancies_created,
        COUNT(DISTINCT cv.candidate_id) as candidates_assigned,
        COUNT(DISTINCT e.id) as evaluations_sent,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as evaluations_completed,
        u.created_at
      FROM users u
      LEFT JOIN vacancies v ON u.id = v.assigned_to_user_id
      LEFT JOIN candidate_vacancies cv ON v.id = cv.vacancy_id
      LEFT JOIN evaluations e ON e.assigned_by_user_id = u.id
      WHERE u.role IN ('rrhh', 'admin')
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.created_at
      ORDER BY vacancies_created DESC`
    );

    const analysts = analystsResult.rows.map(row => {
      const evaluationsSent = parseInt(row.evaluations_sent);
      const evaluationsCompleted = parseInt(row.evaluations_completed);
      const conversionRate = evaluationsSent > 0
        ? ((evaluationsCompleted / evaluationsSent) * 100).toFixed(2) + '%'
        : '0%';

      return {
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role,
        vacanciesCreated: parseInt(row.vacancies_created),
        candidatesAssigned: parseInt(row.candidates_assigned),
        evaluationsSent: evaluationsSent,
        evaluationsCompleted: evaluationsCompleted,
        conversionRate: conversionRate,
        joinDate: row.created_at
      };
    });

    res.json({
      total: analysts.length,
      analysts: analysts
    });
  } catch (error) {
    console.error('Error obteniendo métricas de analistas:', error);
    res.status(500).json({
      error: 'Error al obtener métricas',
      details: error.message
    });
  }
};
