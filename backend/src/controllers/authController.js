const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { getPermissionsForRole } = require('../middleware/permissionsMiddleware');

// REGISTRAR NUEVO USUARIO (Admin o RR.HH)
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validar que tenga todos los datos
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos' 
      });
    }

    // Validar que el rol sea válido
    if (!['admin', 'rrhh'].includes(role)) {
      return res.status(400).json({ 
        error: 'Rol inválido. Debe ser admin o rrhh' 
      });
    }

    // Verificar que el email no existe
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ 
        error: 'El email ya está registrado' 
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario en BD
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
      [email, hashedPassword, firstName, lastName, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      error: 'Error al registrar usuario',
      details: error.message 
    });
  }
};

// LOGIN - SQLITE VERSION
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt with SQLite - no rate limiting');

    // Validar que tenga email y contraseña
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario en BD
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Email o contraseña incorrectos' 
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Email o contraseña incorrectos' 
      });
    }

    // Obtener permisos del usuario
    const permissions = getPermissionsForRole(user.role);
    let allPermissions = [...permissions];

    // Obtener permisos granulares adicionales (si la tabla existe)
    try {
      const additionalPerms = await pool.query(
        `SELECT DISTINCT permission_key FROM user_permissions
         WHERE user_id = $1 AND team_id IS NULL`,
        [user.id]
      );

      allPermissions = [...new Set([
        ...permissions,
        ...additionalPerms.rows.map(r => r.permission_key)
      ])];
    } catch (error) {
      // Tabla user_permissions no existe aún, usar solo permisos del rol
      console.log('Tabla user_permissions no existe, usando permisos del rol');
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions: allPermissions
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión [RAILWAY-2024]',
      details: error.message
    });
  }
};