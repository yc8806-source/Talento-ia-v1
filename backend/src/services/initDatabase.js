const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('🔍 Checking database schema...');

    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'candidate_vacancies'
      )
    `);

    const tableExists = tablesCheck.rows[0].exists;
    console.log(`📊 candidate_vacancies table exists: ${tableExists}`);

    if (!tableExists) {
      console.log('📋 Tables missing - initializing database schema...');

      // Check if initRailway.sql file exists
      const scriptPath = path.join(__dirname, '../../scripts/initRailway.sql');
      console.log(`🔎 Looking for SQL file at: ${scriptPath}`);

      if (!fs.existsSync(scriptPath)) {
        console.error(`❌ SQL file not found at ${scriptPath}`);
        return;
      }

      // Read and execute initRailway.sql
      const initScript = fs.readFileSync(scriptPath, 'utf8');
      console.log(`📖 SQL file loaded (${initScript.length} bytes)`);

      // Split by statements and execute
      const statements = initScript
        .split(';')
        .map(stmt => {
          // Remove comments and trim
          return stmt
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .trim();
        })
        .filter(stmt => stmt && stmt.length > 0);

      console.log(`📦 Found ${statements.length} SQL statements to execute`);

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          await pool.query(statement);
          successCount++;
          const preview = statement.substring(0, 50).replace(/\n/g, ' ');
          console.log(`✅ [${successCount}/${statements.length}] Executed: ${preview}...`);
        } catch (err) {
          // Ignore errors from IF EXISTS checks
          if (!err.message.includes('already exists')) {
            errorCount++;
            console.warn(`⚠️ Warning executing statement: ${err.message}`);
            console.warn(`   Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }

      console.log(`✅ Database schema initialization complete (${successCount} succeeded, ${errorCount} with warnings)`);

      // Verify tables were created
      const verifyCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'candidate_vacancies'
        )
      `);

      if (verifyCheck.rows[0].exists) {
        console.log('✅ VERIFIED: candidate_vacancies table created successfully');
      } else {
        console.error('❌ ERROR: candidate_vacancies table still does not exist after initialization');
      }
    } else {
      console.log('✅ Database schema already exists - no initialization needed');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('Stack:', error.stack);
    // Don't throw - allow app to continue
  }
}

module.exports = { initDatabase };
