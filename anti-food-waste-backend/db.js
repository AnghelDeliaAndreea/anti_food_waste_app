const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // sau username-ul tău
  password: '1234',      // parola ta
  database: 'anti_food_waste'
});

connection.connect((err) => {
  if (err) {
    console.error('Eroare la conectarea la baza de date:', err);
    return;
  }
  console.log('Conexiune la baza de date reusita!');
});

module.exports = connection;