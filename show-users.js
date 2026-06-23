const db = require('./database');

db.all("SELECT * FROM users", [], (err, rows) => {
  console.log("Пользователи в БД:");
  rows.forEach(row => {
    console.log(`${row.id}: ${row.email}`);
  });
  db.close();
});