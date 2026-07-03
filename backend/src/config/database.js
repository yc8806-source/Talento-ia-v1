const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data.db');
const dbRaw = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error al abrir BD SQLite:', err);
  else console.log('Conectado a SQLite:', dbPath);
});

// Habilitar foreign keys
dbRaw.run('PRAGMA foreign_keys = ON');

// Wrapper para que SQLite tenga interfaz similar a pg
class SQLiteWrapper {
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      // Convertir ? por $1, $2, etc. para pg compatibility
      let pgSql = sql;
      const pgParams = [];

      // Reemplazar $1, $2, etc. con ?
      let paramIndex = 1;
      pgSql = pgSql.replace(/\$\d+/g, () => '?');

      // Para INSERT...RETURNING, extraer las columnas
      const returningMatch = sql.match(/RETURNING\s+(.*?)(?:\s|$)/i);

      if (sql.toLowerCase().includes('returning')) {
        // Para RETURNING, ejecutar como run y luego obtener
        dbRaw.run(pgSql, params, function(err) {
          if (err) reject(err);
          else {
            resolve({
              rows: [{ id: this.lastID }],
              rowCount: this.changes
            });
          }
        });
      } else if (sql.toLowerCase().includes('select')) {
        dbRaw.all(pgSql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows: rows || [] });
        });
      } else {
        dbRaw.run(pgSql, params, function(err) {
          if (err) reject(err);
          else resolve({
            rows: [],
            rowCount: this.changes
          });
        });
      }
    });
  }

  run(sql, params, callback) {
    dbRaw.run(sql, params, callback);
  }

  all(sql, params, callback) {
    dbRaw.all(sql, params, callback);
  }

  get(sql, params, callback) {
    dbRaw.get(sql, params, callback);
  }
}

const pool = new SQLiteWrapper();

// Crear tablas si no existen
const initializeTables = () => {
  const bcrypt = require('bcryptjs');

  dbRaw.serialize(() => {
    dbRaw.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      password_hash VARCHAR(255),
      firstName VARCHAR(100),
      lastName VARCHAR(100),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      role VARCHAR(50) DEFAULT 'candidato',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      firstName VARCHAR(100),
      lastName VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(20),
      cv_url VARCHAR(500),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS vacancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255),
      description TEXT,
      department VARCHAR(100),
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255),
      description TEXT,
      type VARCHAR(50),
      max_time_minutes INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER REFERENCES exams(id),
      title VARCHAR(500),
      type VARCHAR(50),
      difficulty VARCHAR(50),
      competencyId INTEGER,
      competencyName VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS evaluation_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidates(id),
      token VARCHAR(256) UNIQUE,
      evaluation_ids TEXT,
      current_index INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS exam_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidates(id),
      exam_id INTEGER REFERENCES exams(id),
      question_id INTEGER REFERENCES questions(id),
      answer_value INTEGER,
      competency_id INTEGER,
      time_spent_seconds INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(candidate_id, exam_id, question_id)
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS evaluation_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER REFERENCES candidates(id),
      exam_id INTEGER REFERENCES exams(id),
      overall_score DECIMAL(5,2),
      competency_results TEXT,
      total_questions INTEGER,
      answered_questions INTEGER,
      time_seconds INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      department VARCHAR(255),
      manager_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      role VARCHAR(50) DEFAULT 'member',
      department VARCHAR(255),
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, user_id)
    )`);

    dbRaw.run(`CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name VARCHAR(50) NOT NULL,
      permission_key VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role_name, permission_key)
    )`);

    // Insertar admin si no existe
    const adminEmail = 'admin@talent-ia.com';
    const adminPassword = 'password123';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    dbRaw.run(
      `INSERT OR IGNORE INTO users (email, password, password_hash, firstName, lastName, first_name, last_name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [adminEmail, adminPassword, hashedPassword, 'Admin', 'Talent IA', 'Admin', 'Talent IA', 'administrador'],
      function(err) {
        if (err) console.error('Error inserting admin:', err);
        else console.log('Admin user ready');
      }
    );
  });
};

initializeTables();

module.exports = pool;
