const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'candidate_vacancies'
      )
    `);

    if (!tablesCheck.rows[0].exists) {
      console.log('📋 Initializing database schema...');

      // Read and execute initRailway.sql
      const initScript = fs.readFileSync(
        path.join(__dirname, '../../scripts/initRailway.sql'),
        'utf8'
      );

      // Split by statements and execute
      const statements = initScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (err) {
          // Ignore errors from IF EXISTS checks
          if (!err.message.includes('already exists')) {
            console.warn(`⚠️ Warning executing statement: ${err.message}`);
          }
        }
      }

      console.log('✅ Database schema initialized successfully');
    } else {
      console.log('✅ Database schema already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    // Don't throw - allow app to continue
  }
}

module.exports = { initDatabase };
