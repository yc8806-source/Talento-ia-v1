const pool = require('../config/database');

// Función para convertir JSON a CSV
const convertToCSV = (data, headers) => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
};

// Asignar múltiples candidatos a una vacante
const bulkAssignCandidatesToVacancy = async (req, res) => {
  const { candidateIds, vacancyId, examId } = req.body;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ error: 'candidateIds debe ser un array no vacío' });
  }

  if (!vacancyId) {
    return res.status(400).json({ error: 'vacancyId es requerido' });
  }

  try {
    const results = [];
    const errors = [];

    for (const candidateId of candidateIds) {
      try {
        // Verificar si ya existe
        const existingResult = await pool.query(
          `SELECT id FROM candidate_vacancies WHERE candidate_id = $1 AND vacancy_id = $2`,
          [candidateId, vacancyId]
        );

        if (existingResult.rows.length > 0) {
          errors.push({
            candidateId,
            error: 'Ya asignado a esta vacante'
          });
          continue;
        }

        // Insertar asignación
        const insertResult = await pool.query(
          `INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [candidateId, vacancyId, 'not_started']
        );

        results.push({
          candidateId,
          success: true,
          candidateVacancyId: insertResult.rows[0].id
        });
      } catch (error) {
        errors.push({
          candidateId,
          error: error.message
        });
      }
    }

    res.json({
      message: `${results.length} candidatos asignados exitosamente`,
      assigned: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error en bulk assign:', error);
    res.status(500).json({ error: 'Error al asignar candidatos' });
  }
};

// Enviar invitaciones en batch
const bulkSendInvitations = async (req, res) => {
  const { candidateIds, candidateVacancyIds, emailSubject, emailTemplate } = req.body;

  // Aceptar candidateIds O candidateVacancyIds
  let idsToProcess = candidateVacancyIds;

  if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
    // Si se pasan candidateIds, buscar sus candidate_vacancies
    const cvResult = await pool.query(
      `SELECT id FROM candidate_vacancies WHERE candidate_id = ANY($1)`,
      [candidateIds]
    );
    idsToProcess = cvResult.rows.map(r => r.id);
  }

  if (!idsToProcess || !Array.isArray(idsToProcess) || idsToProcess.length === 0) {
    return res.status(400).json({ error: 'candidateIds o candidateVacancyIds requerido' });
  }

  try {
    const results = [];
    const errors = [];

    for (const candidateVacancyId of idsToProcess) {
      try {
        // Obtener información del candidato y vacante
        const infoResult = await pool.query(
          `SELECT c.email, c.first_name, v.title, cv.id
           FROM candidate_vacancies cv
           JOIN candidates c ON cv.candidate_id = c.id
           JOIN vacancies v ON cv.vacancy_id = v.id
           WHERE cv.id = $1`,
          [candidateVacancyId]
        );

        if (infoResult.rows.length === 0) {
          errors.push({
            candidateVacancyId,
            error: 'Asignación no encontrada'
          });
          continue;
        }

        const { email, first_name, title } = infoResult.rows[0];

        // Generar token de acceso (simulado)
        const accessToken = Buffer.from(`${candidateVacancyId}-${Date.now()}`).toString('base64');

        // Actualizar token
        await pool.query(
          `UPDATE evaluations SET access_token = $1 WHERE candidate_vacancy_id = $2`,
          [accessToken, candidateVacancyId]
        );

        // Aquí iría la lógica de envío de email (nodemailer)
        // Por ahora solo registramos que se envió

        results.push({
          candidateVacancyId,
          email,
          candidateName: first_name,
          vacancyTitle: title,
          success: true,
          message: 'Invitación enviada'
        });
      } catch (error) {
        errors.push({
          candidateVacancyId,
          error: error.message
        });
      }
    }

    res.json({
      message: `${results.length} invitaciones enviadas exitosamente`,
      sent: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error en bulk send invitations:', error);
    res.status(500).json({ error: 'Error al enviar invitaciones' });
  }
};

// Exportar candidatos a CSV
const exportCandidatesToCSV = async (req, res) => {
  const { candidateIds, vacancyId } = req.body;

  try {
    let query = `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.created_at,
        COUNT(cv.id) as total_evaluations
      FROM candidates c
      LEFT JOIN candidate_vacancies cv ON c.id = cv.candidate_id
      WHERE 1=1
    `;
    const params = [];

    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      query += ` AND c.id = ANY($${params.length + 1})`;
      params.push(candidateIds);
    }

    if (vacancyId) {
      query += ` AND cv.vacancy_id = $${params.length + 1}`;
      params.push(vacancyId);
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);

    // Convertir a CSV manualmente
    const headers = ['id', 'first_name', 'last_name', 'email', 'phone', 'created_at', 'total_evaluations'];

    // Renombrar propiedades de la BD
    const formattedData = result.rows.map(row => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      created_at: new Date(row.created_at).toLocaleDateString('es-ES'),
      total_evaluations: row.total_evaluations
    }));

    const csv = convertToCSV(formattedData, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=candidatos.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exportando CSV:', error);
    res.status(500).json({ error: 'Error al exportar candidatos' });
  }
};

// Eliminar múltiples candidatos
const bulkDeleteCandidates = async (req, res) => {
  const { candidateIds } = req.body;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ error: 'candidateIds debe ser un array no vacío' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM candidates WHERE id = ANY($1) RETURNING id`,
      [candidateIds]
    );

    res.json({
      message: `${result.rows.length} candidatos eliminados`,
      deleted: result.rows.length,
      deletedIds: result.rows.map(r => r.id)
    });
  } catch (error) {
    console.error('Error eliminando candidatos:', error);
    res.status(500).json({ error: 'Error al eliminar candidatos' });
  }
};

// Cambiar estado de múltiples evaluaciones
const bulkUpdateEvaluationStatus = async (req, res) => {
  const { candidateVacancyIds, newStatus } = req.body;

  if (!candidateVacancyIds || !Array.isArray(candidateVacancyIds) || candidateVacancyIds.length === 0) {
    return res.status(400).json({ error: 'candidateVacancyIds debe ser un array no vacío' });
  }

  if (!newStatus || !['not_started', 'in_progress', 'completed'].includes(newStatus)) {
    return res.status(400).json({
      error: 'newStatus debe ser: not_started, in_progress o completed'
    });
  }

  try {
    const result = await pool.query(
      `UPDATE candidate_vacancies
       SET status = $1, updated_at = NOW()
       WHERE id = ANY($2)
       RETURNING id, candidate_id, vacancy_id, status`,
      [newStatus, candidateVacancyIds]
    );

    res.json({
      message: `${result.rows.length} evaluaciones actualizadas a ${newStatus}`,
      updated: result.rows.length,
      results: result.rows
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// Obtener candidatos para selección múltiple
const getCandidatesForBulkAction = async (req, res) => {
  const { vacancyId, search } = req.query;

  try {
    let query = `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        COUNT(cv.id) as evaluation_count
      FROM candidates c
      LEFT JOIN candidate_vacancies cv ON c.id = cv.candidate_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.first_name ILIKE $${params.length + 1} OR c.last_name ILIKE $${params.length + 1} OR c.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (vacancyId) {
      query += ` AND c.id NOT IN (SELECT candidate_id FROM candidate_vacancies WHERE vacancy_id = $${params.length + 1})`;
      params.push(vacancyId);
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);

    res.json({
      candidates: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo candidatos:', error);
    res.status(500).json({ error: 'Error al obtener candidatos' });
  }
};

module.exports = {
  bulkAssignCandidatesToVacancy,
  bulkSendInvitations,
  exportCandidatesToCSV,
  bulkDeleteCandidates,
  bulkUpdateEvaluationStatus,
  getCandidatesForBulkAction
};
