const pool = require('../src/config/database');

async function createAuditTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        user_id INTEGER,
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        ip_address VARCHAR(50),
        changes JSONB,
        old_values JSONB,
        new_values JSONB,
        status VARCHAR(20),
        error_message TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    `);

    console.log('✅ Tabla audit_logs creada exitosamente');
  } catch (error) {
    console.error('❌ Error creando tabla:', error.message);
  } finally {
    await pool.end();
  }
}

createAuditTable();
