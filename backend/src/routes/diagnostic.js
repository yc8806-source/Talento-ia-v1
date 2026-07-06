const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/version', (req, res) => {
  const dbPath = path.join(__dirname, '../config/database-sqlite.js');
  const serverPath = path.join(__dirname, '../../server.js');

  const hasSQLiteFile = fs.existsSync(dbPath);
  const hasOldFile = fs.existsSync(path.join(__dirname, '../config/database.js'));

  let rateLimitStatus = 'UNKNOWN';
  if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf8');
    rateLimitStatus = content.includes('// app.use(\'/api/\', apiLimiter)') ? 'DISABLED' : 'ENABLED';
  }

  res.json({
    version: 'SQLite v1.0',
    timestamp: new Date().toISOString(),
    database: {
      hasNewFile: hasSQLiteFile,
      hasOldFile: hasOldFile,
      status: hasSQLiteFile && !hasOldFile ? 'OK' : 'STALE_CACHE'
    },
    rateLimiting: rateLimitStatus,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT || 3000
  });
});

module.exports = router;
