const pool = require('../config/database');

// Obtener todos los usuarios (solo admin)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error al obtener usuarios',
      details: error.message
    });
  }
};

// Eliminar usuario (solo admin)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;

    // No permitir que el admin se elimine a sí mismo
    if (parseInt(userId) === adminId) {
      return res.status(400).json({
        error: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Verificar que el usuario existe
    const userResult = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];

    // No permitir eliminar otro admin (solo si hay múltiples admins)
    if (user.role === 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['admin']
      );

      if (parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({
          error: 'No puedes eliminar el único administrador del sistema'
        });
      }
    }

    // Eliminar el usuario
    await pool.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      message: 'Usuario eliminado exitosamente',
      deletedUser: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      error: 'Error al eliminar usuario',
      details: error.message
    });
  }
};

// Limpiar datos de prueba (solo admin)
exports.cleanupTestData = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [adminId]
    );

    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Solo administradores pueden ejecutar esta acción'
      });
    }

    await pool.query('BEGIN');

    const cleanup = [
      'DELETE FROM exam_scores WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM spelling_grammar_results WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM typing_results WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM tpl80_results WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM evaluation_results WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM exam_answers WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM evaluation_assignments WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM candidate_vacancy_assignments WHERE candidate_id IN (SELECT id FROM candidates WHERE user_id IS NULL OR user_id > 2)',
      'DELETE FROM candidates WHERE user_id IS NULL OR user_id > 2',
      'DELETE FROM users WHERE id > 2 AND role != $1'
    ];

    for (const query of cleanup) {
      await pool.query(query, query.includes('role') ? ['admin'] : []);
    }

    const candidatesCount = await pool.query('SELECT COUNT(*) as count FROM candidates');
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');

    await pool.query('COMMIT');

    res.json({
      message: 'Limpieza de datos de prueba completada exitosamente ✅',
      data: {
        candidatesRemaining: candidatesCount.rows[0].count,
        usersRemaining: usersCount.rows[0].count,
        timestamp: new Date()
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error limpiando datos de prueba:', error);
    res.status(500).json({
      error: 'Error al limpiar datos de prueba',
      details: error.message
    });
  }
};
