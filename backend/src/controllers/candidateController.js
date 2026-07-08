const pool = require('../config/database');
const AuditService = require('../services/auditService');
const crypto = require('crypto');

// REGISTRAR NUEVO CANDIDATO (postulante)
exports.registerCandidate = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, createdBy } = req.body;

    // Validar datos requeridos
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: firstName, lastName, email'
      });
    }

    // Verificar que el email no existe
    const candidateExists = await pool.query(
      'SELECT * FROM candidates WHERE email = $1',
      [email]
    );

    if (candidateExists.rows.length > 0) {
      return res.status(409).json({
        error: 'El candidato con este email ya existe'
      });
    }

    // Procesar CV si existe
    let cvUrl = null;
    if (req.file) {
      cvUrl = `/uploads/${req.file.filename}`;
    }

    // Insertar candidato
    const result = await pool.query(
      'INSERT INTO candidates (first_name, last_name, email, phone, cv_url, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firstName, lastName, email, phone, cvUrl, createdBy]
    );

    const candidate = result.rows[0];

    res.status(201).json({
      message: 'Candidato registrado exitosamente',
      candidate: {
        id: candidate.id,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone,
        cvUrl: candidate.cv_url,
        createdAt: candidate.created_at
      }
    });
  } catch (error) {
    console.error('Error registrando candidato:', error);
    res.status(500).json({
      error: 'Error al registrar candidato',
      details: error.message
    });
  }
};

// OBTENER TODOS LOS CANDIDATOS
exports.getCandidates = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, phone, cv_url, created_at FROM candidates ORDER BY created_at DESC'
    );

    const candidates = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      cvUrl: row.cv_url,
      createdAt: row.created_at
    }));

    res.json({
      total: candidates.length,
      candidates
    });
  } catch (error) {
    console.error('Error obteniendo candidatos:', error);
    res.status(500).json({
      error: 'Error al obtener candidatos',
      details: error.message
    });
  }
};

// OBTENER UN CANDIDATO POR ID
exports.getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM candidates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Candidato no encontrado'
      });
    }

    const row = result.rows[0];
    const candidate = {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      cvUrl: row.cv_url,
      createdAt: row.created_at
    };

    res.json(candidate);
  } catch (error) {
    console.error('Error obteniendo candidato:', error);
    res.status(500).json({
      error: 'Error al obtener candidato',
      details: error.message
    });
  }
};

// OBTENER CANDIDATOS DE UNA VACANTE CON SUS ESTADOS
exports.getCandidatesByVacancy = async (req, res) => {
  try {
    const { vacancyId } = req.params;

    const result = await pool.query(
      `SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.cv_url,
        cv.id as candidate_vacancy_id,
        cv.status,
        cv.created_at
      FROM candidates c
      INNER JOIN candidate_vacancies cv ON c.id = cv.candidate_id
      WHERE cv.vacancy_id = $1
      ORDER BY cv.created_at DESC`,
      [vacancyId]
    );

    const candidates = result.rows.map(row => ({
      candidateId: row.id,
      candidateVacancyId: row.candidate_vacancy_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      cvUrl: row.cv_url,
      status: row.status,
      appliedAt: row.created_at
    }));

    res.json({
      vacancyId,
      total: candidates.length,
      candidates
    });
  } catch (error) {
    console.error('Error obteniendo candidatos de vacante:', error);
    res.status(500).json({
      error: 'Error al obtener candidatos',
      details: error.message
    });
  }
};

// INVITAR CANDIDATO A VACANTE
exports.inviteToVacancy = async (req, res) => {
  try {
    const { candidateId, vacancyId } = req.body;

    if (!candidateId || !vacancyId) {
      return res.status(400).json({
        error: 'candidateId y vacancyId son requeridos'
      });
    }

    // Verificar que el candidato existe
    const candidateExists = await pool.query(
      'SELECT * FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (candidateExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Candidato no encontrado'
      });
    }

    // Verificar que la vacante existe
    const vacancyExists = await pool.query(
      'SELECT * FROM vacancies WHERE id = $1',
      [vacancyId]
    );

    if (vacancyExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Vacante no encontrada'
      });
    }

    // Verificar si ya está registrado
    const alreadyApplied = await pool.query(
      'SELECT * FROM candidate_vacancies WHERE candidate_id = $1 AND vacancy_id = $2',
      [candidateId, vacancyId]
    );

    if (alreadyApplied.rows.length > 0) {
      return res.status(409).json({
        error: 'El candidato ya fue invitado a esta vacante'
      });
    }

    // Generar token único para acceso sin login
    const token = crypto.randomBytes(32).toString('hex');

    // Crear registro en candidate_vacancies
    const result = await pool.query(
      'INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status, token) VALUES ($1, $2, $3, $4) RETURNING *',
      [candidateId, vacancyId, 'invited', token]
    );

    // Nota: filled_positions se incrementa cuando el analista marca al candidato como "apto", no al invitar

    res.status(201).json({
      message: 'Candidato invitado exitosamente',
      candidateVacancy: {
        id: result.rows[0].id,
        candidateId: result.rows[0].candidate_id,
        vacancyId: result.rows[0].vacancy_id,
        status: result.rows[0].status,
        token: result.rows[0].token,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Error invitando candidato:', error);
    res.status(500).json({
      error: 'Error al invitar candidato',
      details: error.message
    });
  }
};

// MARCAR CANDIDATO COMO APTO/RECHAZADO
exports.markCandidateStatus = async (req, res) => {
  try {
    const { candidateVacancyId, status } = req.body;

    if (!candidateVacancyId || !status) {
      return res.status(400).json({
        error: 'candidateVacancyId y status son requeridos'
      });
    }

    if (!['apto', 'rechazado', 'invited'].includes(status)) {
      return res.status(400).json({
        error: 'Status inválido. Debe ser: apto, rechazado o invited'
      });
    }

    // Obtener información actual
    const cvResult = await pool.query(
      'SELECT candidate_id, vacancy_id, status FROM candidate_vacancies WHERE id = $1',
      [candidateVacancyId]
    );

    if (cvResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Registro no encontrado'
      });
    }

    const currentCV = cvResult.rows[0];
    const wasApto = currentCV.status === 'apto';
    const isApto = status === 'apto';

    // Actualizar estado
    await pool.query(
      'UPDATE candidate_vacancies SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, candidateVacancyId]
    );

    // Ajustar filled_positions si cambió a/desde "apto"
    if (isApto && !wasApto) {
      // Se marcó como apto
      await pool.query(
        'UPDATE vacancies SET filled_positions = filled_positions + 1 WHERE id = $1',
        [currentCV.vacancy_id]
      );
    } else if (!isApto && wasApto) {
      // Se desmarcó de apto
      await pool.query(
        'UPDATE vacancies SET filled_positions = GREATEST(filled_positions - 1, 0) WHERE id = $1',
        [currentCV.vacancy_id]
      );
    }

    // Verificar si la vacante está completa y cerrarla automáticamente
    const vacancyCheck = await pool.query(
      'SELECT available_positions, filled_positions FROM vacancies WHERE id = $1',
      [currentCV.vacancy_id]
    );
    const vacancy = vacancyCheck.rows[0];
    if (vacancy.filled_positions >= vacancy.available_positions) {
      await pool.query(
        'UPDATE vacancies SET status = $1 WHERE id = $2',
        ['closed', currentCV.vacancy_id]
      );
    }

    res.json({
      message: `Candidato marcado como ${status}`,
      candidateVacancy: {
        id: candidateVacancyId,
        status: status
      }
    });
  } catch (error) {
    console.error('Error actualizando estado de candidato:', error);
    res.status(500).json({
      error: 'Error al actualizar candidato',
      details: error.message
    });
  }
};

// ASIGNAR VACANTE A CANDIDATO (alias para inviteToVacancy con retorno mejorado)
exports.assignVacancy = async (req, res) => {
  try {
    const { candidateId, vacancyId } = req.body;

    if (!candidateId || !vacancyId) {
      return res.status(400).json({
        error: 'candidateId y vacancyId son requeridos'
      });
    }

    // Verificar si ya está registrado
    const alreadyApplied = await pool.query(
      'SELECT id FROM candidate_vacancies WHERE candidate_id = $1 AND vacancy_id = $2',
      [candidateId, vacancyId]
    );

    if (alreadyApplied.rows.length > 0) {
      // Retornar el ID existente
      return res.status(200).json({
        message: 'Candidato ya asignado a esta vacante',
        candidateVacancyId: alreadyApplied.rows[0].id
      });
    }

    // Crear registro en candidate_vacancies
    const result = await pool.query(
      'INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status) VALUES ($1, $2, $3) RETURNING id',
      [candidateId, vacancyId, 'pending']
    );

    res.status(201).json({
      message: 'Vacante asignada exitosamente',
      candidateVacancyId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error asignando vacante:', error);
    res.status(500).json({
      error: 'Error al asignar vacante',
      details: error.message
    });
  }
};

// ACTUALIZAR INFORMACIÓN DE CANDIDATO AUTENTICADO
exports.updateCandidateProfile = async (req, res) => {
  try {
    const candidateId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Validar que el usuario esté autenticado
    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes iniciar sesión para actualizar tu perfil'
      });
    }

    const {
      phone,
      location,
      yearsExperience,
      professionalSummary,
      skills,
      languages,
      linkedinUrl,
      githubUrl,
    } = req.body;

    // Verificar que el candidato existe
    const candidateExists = await pool.query(
      'SELECT id, created_by FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (candidateExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Candidato no encontrado'
      });
    }

    const candidate = candidateExists.rows[0];

    // Validar permisos: Solo admin o el candidato que creó el perfil (RRHH) o el candidato mismo pueden actualizar
    const isAdmin = userRole === 'admin';
    const isOwnerRRHH = candidate.created_by === userId;
    const isCandidateSelf = candidate.id === userId;

    if (!isAdmin && !isOwnerRRHH && !isCandidateSelf) {
      return res.status(403).json({
        error: 'No autorizado',
        message: 'Solo puedes actualizar tu propio perfil'
      });
    }

    // Construir UPDATE dinámico solo con campos proporcionados
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (phone) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (location) {
      updates.push(`location = $${paramCount}`);
      values.push(location);
      paramCount++;
    }

    if (yearsExperience !== undefined) {
      updates.push(`years_experience = $${paramCount}`);
      values.push(yearsExperience);
      paramCount++;
    }

    if (professionalSummary !== undefined) {
      updates.push(`professional_summary = $${paramCount}`);
      values.push(professionalSummary);
      paramCount++;
    }

    if (skills !== undefined) {
      updates.push(`skills = $${paramCount}`);
      values.push(skills);
      paramCount++;
    }

    if (languages !== undefined) {
      updates.push(`languages = $${paramCount}`);
      values.push(languages);
      paramCount++;
    }

    if (linkedinUrl !== undefined) {
      updates.push(`linkedin_url = $${paramCount}`);
      values.push(linkedinUrl);
      paramCount++;
    }

    if (githubUrl !== undefined) {
      updates.push(`github_url = $${paramCount}`);
      values.push(githubUrl);
      paramCount++;
    }

    // Si hay archivo PDF, agregarlo a la actualización
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          error: 'Solo se aceptan archivos PDF'
        });
      }

      updates.push(`cv_url = $${paramCount}`);
      values.push(`/uploads/${req.file.filename}`);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No hay datos para actualizar'
      });
    }

    // Agregar ID al final
    values.push(candidateId);

    const query = `UPDATE candidates SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, first_name, last_name, email, phone, location, years_experience, professional_summary, skills, languages, linkedin_url, github_url, cv_url`;

    const result = await pool.query(query, values);
    const updatedCandidate = result.rows[0];

    // Preparar datos para auditoría (valores anteriores)
    const oldValuesObj = {
      phone: candidate.phone || null,
      location: candidate.location || null,
      years_experience: candidate.years_experience || null,
      professional_summary: candidate.professional_summary || null,
      skills: candidate.skills || null,
      languages: candidate.languages || null,
      linkedin_url: candidate.linkedin_url || null,
      github_url: candidate.github_url || null,
      cv_url: candidate.cv_url || null,
    };

    // Valores nuevos
    const newValuesObj = {
      phone: updatedCandidate.phone || null,
      location: updatedCandidate.location || null,
      years_experience: updatedCandidate.years_experience || null,
      professional_summary: updatedCandidate.professional_summary || null,
      skills: updatedCandidate.skills || null,
      languages: updatedCandidate.languages || null,
      linkedin_url: updatedCandidate.linkedin_url || null,
      github_url: updatedCandidate.github_url || null,
      cv_url: updatedCandidate.cv_url || null,
    };

    // Registrar en auditoría
    await AuditService.log({
      action: 'UPDATE',
      entityType: 'CANDIDATE',
      entityId: candidateId,
      user: req.user,
      ip: req.ip || req.connection.remoteAddress,
      oldValues: oldValuesObj,
      newValues: newValuesObj,
      userAgent: req.get('user-agent') || '',
      status: 'SUCCESS',
    });

    res.json({
      message: 'Perfil actualizado exitosamente',
      candidate: {
        id: updatedCandidate.id,
        firstName: updatedCandidate.first_name,
        lastName: updatedCandidate.last_name,
        email: updatedCandidate.email,
        phone: updatedCandidate.phone,
        location: updatedCandidate.location,
        yearsExperience: updatedCandidate.years_experience,
        professionalSummary: updatedCandidate.professional_summary,
        skills: updatedCandidate.skills,
        languages: updatedCandidate.languages,
        linkedinUrl: updatedCandidate.linkedin_url,
        githubUrl: updatedCandidate.github_url,
        cvUrl: updatedCandidate.cv_url
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil de candidato:', error);

    // Registrar error en auditoría
    await AuditService.log({
      action: 'UPDATE',
      entityType: 'CANDIDATE',
      entityId: candidateId,
      user: req.user,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || '',
      status: 'ERROR',
      errorMessage: error.message,
    });

    res.status(500).json({
      error: 'Error al actualizar perfil',
      details: error.message
    });
  }
};

// OBTENER HISTORIAL DE AUDITORÍA DE UN CANDIDATO
exports.getCandidateAuditHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await AuditService.getEntityHistory('CANDIDATE', parseInt(id));

    res.json({
      candidateId: id,
      total: history.length,
      history: history.map(entry => ({
        id: entry.id,
        action: entry.action,
        modifiedBy: entry.user_email,
        userRole: entry.user_role,
        ip: entry.ip_address,
        changes: entry.changes ? JSON.parse(entry.changes) : {},
        status: entry.status,
        error: entry.error_message,
        timestamp: entry.created_at
      }))
    });
  } catch (error) {
    console.error('Error obteniendo historial de auditoría:', error);
    res.status(500).json({
      error: 'Error al obtener historial',
      details: error.message
    });
  }
};

// IMPORTAR CANDIDATOS DESDE CSV
exports.importCSV = async (req, res) => {
  try {
    const { createdBy } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'No se proporcionó archivo'
      });
    }

    const csv = require('csv-parser');
    const { Readable } = require('stream');

    const candidates = [];
    const errors = [];
    let imported = 0;

    // Parsear CSV desde buffer
    await new Promise((resolve, reject) => {
      Readable.from([req.file.buffer])
        .pipe(csv())
        .on('data', (row) => {
          candidates.push({
            firstName: row['firstName'] || row['first_name'] || '',
            lastName: row['lastName'] || row['last_name'] || '',
            email: row['email'] || '',
            phone: row['phone'] || '',
            yearsExperience: parseInt(row['yearsExperience'] || row['years_experience'] || 0),
            location: row['location'] || '',
            skills: row['skills'] || '',
            languages: row['languages'] || '',
            professionalSummary: row['professionalSummary'] || row['professional_summary'] || '',
            salaryExpectation: parseFloat(row['salaryExpectation'] || row['salary_expectation'] || 0),
            availabilityDate: row['availabilityDate'] || row['availability_date'] || null,
            willingToTravel: row['willingToTravel'] === 'true' || row['willing_to_travel'] === 'true',
            linkedinUrl: row['linkedinUrl'] || row['linkedin_url'] || '',
            githubUrl: row['githubUrl'] || row['github_url'] || ''
          });
        })
        .on('error', reject)
        .on('end', resolve);
    });

    // Insertar candidatos
    for (const candidate of candidates) {
      try {
        if (!candidate.email || !candidate.email.includes('@')) {
          errors.push({ email: candidate.email, error: 'Email inválido' });
          continue;
        }

        const existing = await pool.query(
          'SELECT id FROM candidates WHERE email = $1',
          [candidate.email]
        );

        if (existing.rows.length > 0) {
          errors.push({ email: candidate.email, error: 'Email ya existe' });
          continue;
        }

        await pool.query(
          `INSERT INTO candidates
           (first_name, last_name, email, phone, years_experience, location,
            skills, languages, professional_summary, salary_expectation,
            availability_date, willing_to_travel, linkedin_url, github_url, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            candidate.firstName,
            candidate.lastName,
            candidate.email,
            candidate.phone,
            candidate.yearsExperience,
            candidate.location,
            candidate.skills,
            candidate.languages,
            candidate.professionalSummary,
            candidate.salaryExpectation || null,
            candidate.availabilityDate || null,
            candidate.willingToTravel,
            candidate.linkedinUrl,
            candidate.githubUrl,
            createdBy || 1
          ]
        );

        imported++;
      } catch (error) {
        errors.push({
          email: candidate.email,
          error: error.message
        });
      }
    }

    res.json({
      message: `${imported} candidatos importados`,
      imported,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importando CSV:', error);
    res.status(500).json({
      error: 'Error al importar CSV',
      details: error.message
    });
  }
};
