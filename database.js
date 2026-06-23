const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./lms.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        avatar TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        teacher_id INTEGER,
        weight REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(teacher_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        video_url TEXT,
        duration INTEGER,
        type TEXT DEFAULT 'theory',
        lesson_order INTEGER DEFAULT 0,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        lesson_id INTEGER,
        score REAL NOT NULL,
        max_score REAL DEFAULT 100,
        passed INTEGER DEFAULT 0,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(course_id) REFERENCES courses(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        current_lesson_id INTEGER,
        completed_lessons INTEGER DEFAULT 0,
        total_lessons INTEGER DEFAULT 0,
        final_score REAL,
        status TEXT DEFAULT 'in_progress',
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        curator_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(curator_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id),
        FOREIGN KEY(group_id) REFERENCES groups(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL,
        event_type TEXT DEFAULT 'activity',
        event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS enrolled (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(course_id) REFERENCES courses(id)
    )`);

    console.log('Все таблицы созданы');

    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('Ошибка проверки пользователей:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log(' Добавляем тестовых пользователей...');
            
            const users = [
                { name: 'Администратор', email: 'admin@gmail.com', password: 'admin123', role: 'admin' },
                { name: 'Екатерина', email: 'katya@email.com', password: '123456', role: 'student' },
                { name: 'Илон Макс', email: 'ilon@email.com', password: '123456', role: 'teacher' },
                { name: 'Анна Петрова', email: 'anna@email.com', password: '123456', role: 'curator' },
                { name: 'Дмитрий', email: 'dima@gmail.com', password: 'dima12345', role: 'teacher' },
                { name: 'Миринда', email: 'mind@gmail.com', password: 'mind12345', role: 'student' }
            ];

            const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
            users.forEach(u => {
                stmt.run(u.name, u.email, u.password, u.role);
                console.log(`   ${u.name} (${u.role})`);
            });
            stmt.finalize();
            
            console.log('Тестовые пользователи добавлены!');
            console.log('   admin@gmail.com / admin123');
            console.log('   dima@gmail.com / dima12345');
            console.log('   anna@email.com / 123456');
        }
    });
});

module.exports = db;