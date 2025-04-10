const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT2 || 3306
});

db.connect((err) => {
  if (err) {
    console.error('❌ Greška pri povezivanju sa MySQL bazom:', err.message);
  } else {
    console.log('✅ Uspesno povezivanje sa MySQL bazom');
  }
});

module.exports = db;
