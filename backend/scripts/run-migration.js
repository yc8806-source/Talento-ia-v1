#!/usr/bin/env node

const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('📋 Running migration: 001_create_invitations_tables.sql');

    const migrationPath = path.join(__dirname, '../migrations/001_create_invitations_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn(`⚠️  ${err.message}`);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
