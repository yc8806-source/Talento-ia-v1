const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Insertar admin si no existe
  const adminEmail = 'admin@talent-ia.com';
  const adminPassword = 'password123';
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  db.run(
    `INSERT OR IGNORE INTO users (email, password, firstName, lastName, role)
     VALUES (?, ?, ?, ?, ?)`,
    [adminEmail, hashedPassword, 'Admin', 'Talent IA', 'administrador'],
    function(err) {
      if (err) console.error('Error inserting admin:', err);
      else console.log('Admin user inserted or already exists');
    }
  );
});

db.close(() => {
  console.log('SQLite initialization complete');
});
