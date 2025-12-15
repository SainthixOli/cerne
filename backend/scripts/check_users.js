const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT id, nome_completo, cpf, email, role, password_hash FROM profiles", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Users in DB:");
        console.table(rows);
    });
});

db.close();
