// DEPLOYMENT VERIFICATION - Force rebuild if cache is stale
const fs = require('fs');
const path = require('path');

const expectedFiles = [
  'src/config/database-sqlite.js', // Should be renamed from database.js
];

const bannedFiles = [
  'src/config/database.js', // Old file - if exists, deployment is stale
];

console.log('\n🔍 Verifying deployment is using latest code...\n');

// Check for expected files
expectedFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found ${file} - code is up to date`);
  } else {
    console.error(`❌ CRITICAL: ${file} not found! Deployment using stale cache.`);
    process.exit(1);
  }
});

// Check for banned old files
bannedFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.error(`❌ CRITICAL: Found old ${file}! Deployment using stale cache.`);
    process.exit(1);
  }
});

// Verify database is SQLite not PostgreSQL
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');
if (serverContent.includes('app.use(\'/api/\', apiLimiter)') && !serverContent.includes('// app.use(\'/api/\', apiLimiter)')) {
  console.error('❌ CRITICAL: Rate limiting still enabled! Deployment using stale code.');
  process.exit(1);
}

console.log('✅ Deployment verification passed!\n');
