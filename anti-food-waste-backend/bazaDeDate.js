const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'parola_ta', // Folosește parola pentru utilizatorul root
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MariaDB!');

    // Creează baza de date dacă nu există
    connection.query('CREATE DATABASE IF NOT EXISTS anti_food_waste', (err, result) => {
        if (err) throw err;
        console.log('Database anti_food_waste created or already exists.');

        // Folosește baza de date
        connection.query('USE anti_food_waste', (err, result) => {
            if (err) throw err;
            console.log('Using anti_food_waste database.');

            // Citește fișierul SQL
            const sql = fs.readFileSync(path.join(__dirname, 'sql_backup', 'backup.sql')).toString();

            // Execută fișierul SQL
            connection.query(sql, (err, result) => {
                if (err) throw err;
                console.log('Database initialized from backup.sql.');
                connection.end();
            });
        });
    });
});
