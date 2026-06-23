const db = require('./database');

db.run(`INSERT OR IGNORE INTO users (name, email, password, role) 
        VALUES ('Админ', 'admin@gmail.com', 'p@ssw0rd', 'admin')`,
    function(err) {
        if (err) {
            console.log('Ошибка:', err);
        } else {
            console.log(' Админ создан:');
            console.log('   Email: admin@gmail.com');
            console.log('   Пароль: p@ssw0rd');
        }
        db.close();
    }
);