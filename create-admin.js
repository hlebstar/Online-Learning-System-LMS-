const db = require('./database');

db.run(`INSERT OR IGNORE INTO users (name, email, password, role) 
        VALUES ('Админ', 'admin@gmail.com', 'admin123', 'admin')`,
    function(err) {
        if (err) {
            console.log('Ошибка:', err);
        } else {
            console.log(' Админ создан: admin@gmail.com / admin123');
        }
        db.close();
    }
);