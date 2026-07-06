const pool = require('../config/database');

// OBTENER DATOS DE EVALUACIONES POR OPERACIÓN
exports.getCompetencyAnalytics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.name as competency,
        ROUND(AVG(er.total_score::float / er.max_possible_score * 100), 2) as avg_percentage,
        COUNT(DISTINCT er.candidate_vacancy_id) as total_candidates,
        ROUND(AVG(er.total_score::float / er.max_possible_score * 100)::numeric, 2) as avg_score
      FROM evaluation_results er
      INNER JOIN competencies c ON er.competency_id = c.id
      GROUP BY c.id, c.name
      ORDER BY avg_percentage DESC
    `);

    res.json({
      total: result.rows.length,
      competencies: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo analytics de competencias:', error);
    res.status(500).json({
      error: 'Error al obtener analytics',
      details: error.message
    });
  }
};

// OBTENER DATOS POR OPERACIÓN
exports.getOperationAnalytics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.name as operation,
        COUNT(DISTINCT cr.candidate_vacancy_id) as total_recommendations,
        ROUND(AVG(cr.affinity_score), 2) as avg_affinity,
        ROUND(MAX(cr.affinity_score), 2) as max_affinity,
        ROUND(MIN(cr.affinity_score), 2) as min_affinity
      FROM candidate_recommendations cr
      INNER JOIN operations o ON cr.operation_id = o.id
      WHERE cr.ranking = 1
      GROUP BY o.id, o.name
      ORDER BY avg_affinity DESC
    `);

    res.json({
      total: result.rows.length,
      operations: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo analytics de operaciones:', error);
    res.status(500).json({
      error: 'Error al obtener analytics',
      details: error.message
    });
  }
};

// OBTENER RENDIMIENTO POR VACANTE
exports.getVacancyPerformance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id,
        v.title as vacancy_title,
        COUNT(DISTINCT cv.candidate_id) as total_candidates,
        COUNT(DISTINCT CASE WHEN cv.status = 'completed' THEN cv.candidate_id END) as completed_evaluations,
        ROUND(AVG(cr.affinity_score), 2) as avg_affinity_score,
        ROUND(CAST(COUNT(DISTINCT CASE WHEN cv.status = 'completed' THEN cv.candidate_id END) AS FLOAT) /
              NULLIF(COUNT(DISTINCT cv.candidate_id), 0) * 100, 2) as completion_rate
      FROM vacancies v
      LEFT JOIN candidate_vacancies cv ON v.id = cv.vacancy_id
      LEFT JOIN candidate_recommendations cr ON cv.id = cr.candidate_vacancy_id AND cr.ranking = 1
      GROUP BY v.id, v.title
      ORDER BY completion_rate DESC
    `);

    res.json({
      total: result.rows.length,
      vacancies: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo performance de vacantes:', error);
    res.status(500).json({
      error: 'Error al obtener performance',
      details: error.message
    });
  }
};

// OBTENER ANÁLISIS DETALLADO POR CANDIDATO
exports.getCandidatePerformance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.first_name || ' ' || c.last_name as candidate_name,
        v.title as vacancy,
        ROUND(AVG(er.total_score::float / er.max_possible_score * 100), 2) as avg_competency_score,
        (SELECT affinity_score FROM candidate_recommendations cr WHERE cr.candidate_vacancy_id = cv.id ORDER BY cr.ranking LIMIT 1) as top_operation_score,
        (SELECT name FROM operations o INNER JOIN candidate_recommendations cr ON o.id = cr.operation_id WHERE cr.candidate_vacancy_id = cv.id ORDER BY cr.ranking LIMIT 1) as recommended_operation,
        cv.status
      FROM candidates c
      INNER JOIN candidate_vacancies cv ON c.id = cv.candidate_id
      LEFT JOIN evaluation_results er ON cv.id = er.candidate_vacancy_id
      LEFT JOIN vacancies v ON cv.vacancy_id = v.id
      GROUP BY c.id, c.first_name, c.last_name, v.title, cv.id, cv.status
      ORDER BY avg_competency_score DESC NULLS LAST
    `);

    res.json({
      total: result.rows.length,
      candidates: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo performance de candidatos:', error);
    res.status(500).json({
      error: 'Error al obtener performance',
      details: error.message
    });
  }
};

// EXPORTAR DATOS A CSV
exports.exportCandidatesToCSV = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        v.title as vacancy,
        ROUND(AVG(er.total_score::float / er.max_possible_score * 100), 2) as avg_score,
        (SELECT name FROM operations o INNER JOIN candidate_recommendations cr ON o.id = cr.operation_id WHERE cr.candidate_vacancy_id = cv.id ORDER BY cr.ranking LIMIT 1) as recommended_operation,
        cv.status,
        cv.created_at
      FROM candidates c
      INNER JOIN candidate_vacancies cv ON c.id = cv.candidate_id
      LEFT JOIN evaluation_results er ON cv.id = er.candidate_vacancy_id
      LEFT JOIN vacancies v ON cv.vacancy_id = v.id
      GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, v.title, cv.id, cv.status, cv.created_at
      ORDER BY c.first_name
    `);

    // Convertir a CSV
    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Vacante', 'Puntaje Promedio', 'Operación Recomendada', 'Estado', 'Fecha'];
    const csv = [headers.join(',')];

    result.rows.forEach(row => {
      csv.push([
        `"${row.first_name || ''}"`,
        `"${row.last_name || ''}"`,
        `"${row.email || ''}"`,
        `"${row.phone || ''}"`,
        `"${row.vacancy || ''}"`,
        row.avg_score || '',
        `"${row.recommended_operation || ''}"`,
        `"${row.status || ''}"`,
        new Date(row.created_at).toLocaleDateString('es-ES')
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=candidatos.csv');
    res.send(csv.join('\n'));
  } catch (error) {
    console.error('Error exportando CSV:', error);
    res.status(500).json({
      error: 'Error al exportar datos',
      details: error.message
    });
  }
};
