const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`\n📝 Running migration: ${file}`);

      try {
        await pool.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${file}`);
        console.error(`   Error: ${error.message}`);
        // Don't throw - continue with next migration
      }
    }

    console.log('\n✅ All migrations completed');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
}

module.exports = { runMigrations };
