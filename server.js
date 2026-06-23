const express = require('express');
const db = require('./database');
const app = express();

app.use(express.static('public'));
app.use(express.json());

function validateGrade(value) {
  if (typeof value !== 'number') return false;
  if (isNaN(value)) return false;
  if (value < 0 || value > 100) return false;
  return true;
}

function validateWeight(weight) {
  if (typeof weight !== 'number') return false;
  if (isNaN(weight)) return false;
  if (weight < 0 || weight > 1) return false;
  return true;
}

app.post('/api/calculate', (req, res) => {
  try {
    const { studentId, courseId, grades } = req.body;
    
    if (!studentId || !courseId || !grades) {
      return res.status(400).json({ error: 'Ошибка: нужны studentId, courseId и grades' });
    }
    if (!Array.isArray(grades)) {
      return res.status(400).json({ error: 'Ошибка: grades должен быть массивом' });
    }
    if (grades.length === 0) {
      return res.status(400).json({ error: 'Ошибка: массив grades пуст' });
    }
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i];
      if (grade.value === undefined || grade.weight === undefined) {
        return res.status(400).json({ error: `Ошибка: у оценки ${i} нет поля value или weight` });
      }
      if (!validateGrade(grade.value)) {
        return res.status(400).json({ error: `Ошибка: value=${grade.value} должен быть числом от 0 до 100` });
      }
      if (!validateWeight(grade.weight)) {
        return res.status(400).json({ error: `Ошибка: weight=${grade.weight} должен быть числом от 0 до 1` });
      }
      totalScore += grade.value * grade.weight;
      totalWeight += grade.weight;
    }
    
    if (totalWeight === 0) {
      return res.status(400).json({ error: 'Ошибка: сумма весов не может быть 0' });
    }
    
    const finalScore = totalScore / totalWeight;
    const roundedScore = Math.round(finalScore * 100) / 100;
    
    db.run(`INSERT INTO results (user_id, course_id, score) VALUES (?, ?, ?)`,
      [studentId, courseId, roundedScore],
      (err) => {
        if (err) {
          return res.json({ finalScore: roundedScore, warning: 'Результат не сохранён' });
        }
        res.json({ finalScore: roundedScore, saved: true, message: 'Результат сохранён' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Внутренняя ошибка: ' + error.message });
  }
});

app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Пароль минимум 4 символа' });
  }
  
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [name, email, password, role || 'student'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email уже существует' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, name, email, ok: true, message: 'Регистрация успешна' });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  
  db.get(`SELECT id, name, email, role, created_at FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
      
      res.json({
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});

app.get('/api/user/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT id, name, email, role, created_at FROM users WHERE id = ?`, [id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  });
});

app.get('/api/students', (req, res) => {
  db.all(`SELECT id, name, email, created_at FROM users WHERE role = 'student'`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/courses', (req, res) => {
  db.all(`SELECT * FROM courses`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/courses', (req, res) => {
  const { title, description, weight } = req.body;
  if (!title) return res.status(400).json({ error: 'Название курса обязательно' });
  
  db.run(`INSERT INTO courses (title, description, weight) VALUES (?, ?, ?)`,
    [title, description || '', weight || 1.0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, message: 'Курс создан' });
    }
  );
});

app.post('/api/lessons', (req, res) => {
  const { course_id, title, content, duration, order_number } = req.body;
  if (!course_id || !title) return res.status(400).json({ error: 'course_id и title обязательны' });
  
  db.run(`INSERT INTO lessons (course_id, title, content, duration, order_number) VALUES (?, ?, ?, ?, ?)`,
    [course_id, title, content || '', duration || 0, order_number || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, message: 'Урок добавлен' });
    }
  );
});

app.get('/api/courses/:courseId/lessons', (req, res) => {
  const { courseId } = req.params;
  db.all(`SELECT * FROM lessons WHERE course_id = ? ORDER BY order_number`, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/students/:studentId/results', (req, res) => {
  const { studentId } = req.params;
  db.all(`SELECT c.title as course_title, r.score, r.completed_at,
            CASE 
              WHEN r.score >= 85 THEN 'Отлично'
              WHEN r.score >= 70 THEN 'Хорошо'
              WHEN r.score >= 50 THEN 'Удовлетворительно'
              ELSE 'Неудовлетворительно'
            END as grade
          FROM results r
          JOIN courses c ON r.course_id = c.id
          WHERE r.user_id = ?
          ORDER BY r.completed_at DESC`, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

//статистика курса
app.get('/api/courses/:courseId/stats', (req, res) => {
  const { courseId } = req.params;
  db.get(`SELECT COUNT(*) as total_students, AVG(score) as avg_score, MAX(score) as max_score,
            MIN(score) as min_score, SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END) as passed_count
          FROM results WHERE course_id = ?`, [courseId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// прогресс
app.post('/api/progress', (req, res) => {
  const { user_id, course_id, completed_lessons, total_lessons } = req.body;
  const status = completed_lessons === total_lessons ? 'completed' : 'in_progress';
  
  db.run(`INSERT OR REPLACE INTO user_progress 
          (user_id, course_id, completed_lessons, total_lessons, status, last_accessed)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [user_id, course_id, completed_lessons || 0, total_lessons || 0, status],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status, message: 'Прогресс обновлён' });
    }
  );
});

//админ панель
app.get('/api/admin/users', (req, res) => {
  db.all(`SELECT id, name, email, role, created_at FROM users ORDER BY id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/set-role', (req, res) => {
  const { id, role } = req.body;
  if (!id || !role) return res.status(400).json({ error: 'id и role обязательны' });
  
  db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Роль изменена' });
  });
});

app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM users WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Пользователь удалён' });
  });
});

app.get('/api/admin/stats', (req, res) => {
  db.get(`SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'student') as students,
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
    (SELECT COUNT(*) FROM courses) as courses,
    (SELECT COUNT(*) FROM results) as results,
    COALESCE((SELECT AVG(score) FROM results), 0) as avg_score
  `, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.get('/api/admin/courses', (req, res) => {
  db.all(`SELECT * FROM courses ORDER BY id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/courses', (req, res) => {
  const { title, weight } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });
  
  db.run(`INSERT INTO courses (title, weight) VALUES (?, ?)`, [title, weight || 1.0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID, message: 'Курс добавлен' });
  });
});

app.delete('/api/admin/courses/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM courses WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Курс удалён' });
  });
});

app.get('/api/teacher/courses/:teacherId', (req, res) => {
  const { teacherId } = req.params;
  db.all(`SELECT * FROM courses WHERE teacher_id = ?`, [teacherId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/teacher/courses/:courseId/lessons', (req, res) => {
  const { courseId } = req.params;
  db.all(`SELECT * FROM lessons WHERE course_id = ? ORDER BY order_number`, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/teacher/lessons', (req, res) => {
  const { course_id, title, content, duration, order_number } = req.body;
  if (!course_id || !title) return res.status(400).json({ error: 'course_id и title обязательны' });
  
  db.run(`INSERT INTO lessons (course_id, title, content, duration, order_number) VALUES (?, ?, ?, ?, ?)`,
    [course_id, title, content || '', duration || 0, order_number || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: 'Урок добавлен' });
    }
  );
});

app.get('/api/teacher/courses/:courseId/results', (req, res) => {
  const { courseId } = req.params;
  db.all(`SELECT u.id, u.name, u.email, r.score, r.completed_at,
            up.status, up.completed_lessons, up.total_lessons
          FROM results r
          JOIN users u ON r.user_id = u.id
          LEFT JOIN user_progress up ON up.user_id = u.id AND up.course_id = r.course_id
          WHERE r.course_id = ?
          ORDER BY r.score DESC`, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/teacher/assign-course', (req, res) => {
  const { course_id, teacher_id } = req.body;
  db.run(`UPDATE courses SET teacher_id = ? WHERE id = ?`, [teacher_id, course_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Преподаватель назначен на курс' });
  });
});

app.get('/api/curator/groups', (req, res) => {
  const { curatorId } = req.query;
  db.all(`SELECT g.*, COUNT(s.id) as student_count
          FROM groups g
          LEFT JOIN user_groups ug ON ug.group_id = g.id
          LEFT JOIN users s ON s.id = ug.user_id
          WHERE g.curator_id = ?
          GROUP BY g.id`, [curatorId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/curator/group/:groupId/students', (req, res) => {
  const { groupId } = req.params;
  db.all(`SELECT u.id, u.name, u.email, up.status, up.completed_lessons, up.total_lessons, up.final_score
          FROM user_groups ug
          JOIN users u ON ug.user_id = u.id
          LEFT JOIN user_progress up ON up.user_id = u.id
          WHERE ug.group_id = ?`, [groupId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/curator/group/create', (req, res) => {
  const { name, curator_id } = req.body;
  db.run(`INSERT INTO groups (name, curator_id) VALUES (?, ?)`, [name, curator_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID, message: 'Группа создана' });
  });
});

app.post('/api/curator/group/add-student', (req, res) => {
  const { group_id, user_id } = req.body;
  db.run(`INSERT OR IGNORE INTO user_groups (group_id, user_id) VALUES (?, ?)`, [group_id, user_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Студент добавлен в группу' });
  });
});

app.post('/api/calendar/event', (req, res) => {
  const { user_id, user_name, user_role, action, event_type } = req.body;
  
  if (!user_id || !user_name || !user_role || !action) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  
  db.run(`INSERT INTO calendar_events (user_id, user_name, user_role, action, event_type) 
          VALUES (?, ?, ?, ?, ?)`,
    [user_id, user_name, user_role, action, event_type || 'activity'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: 'Событие добавлено' });
    }
  );
});

app.get('/api/calendar/events', (req, res) => {
  const { userId } = req.query;
  let query = `SELECT * FROM calendar_events ORDER BY event_date DESC LIMIT 50`;
  let params = [];
  
  if (userId) {
    query = `SELECT * FROM calendar_events WHERE user_id = ? ORDER BY event_date DESC LIMIT 50`;
    params = [userId];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/calendar/events/date/:date', (req, res) => {
  const { date } = req.params;
  
  db.all(`SELECT * FROM calendar_events WHERE date(event_date) = ? ORDER BY event_date DESC`,
    [date],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.delete('/api/calendar/event/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM calendar_events WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Событие удалено' });
  });
});


function validateGrade(value) {
    if (typeof value !== 'number') return false;
    if (isNaN(value)) return false;
    if (value < 0 || value > 100) return false;
    return true;
}

function validateWeight(weight) {
    if (typeof weight !== 'number') return false;
    if (isNaN(weight)) return false;
    if (weight < 0 || weight > 1) return false;
    return true;
}

app.post('/api/register', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }
    if (password.length < 4) {
        return res.status(400).json({ error: 'Пароль минимум 4 символа' });
    }

    db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        [name, email, password, role || 'student'],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email уже существует' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({
                id: this.lastID,
                name,
                email,
                role: role || 'student',
                ok: true,
                message: 'Регистрация успешна'
            });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    db.get(`SELECT id, name, email, role, avatar, created_at FROM users WHERE email = ? AND password = ?`,
        [email, password],
        (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

            res.json({
                ok: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar
                }
            });
        }
    );
});

// ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЯ ПО ID
app.get('/api/user/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?`, [id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json(user);
    });
});

// ОБНОВИТЬ ПРОФИЛЬ
app.put('/api/user/:id', (req, res) => {
    const { name, email, avatar } = req.body;
    const userId = req.params.id;

    db.run(
        'UPDATE users SET name = ?, email = ?, avatar = ? WHERE id = ?',
        [name, email, avatar, userId],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Пользователь не найден' });
            res.json({ success: true, message: 'Профиль обновлён' });
        }
    );
});

// ============================================================
// API: СТУДЕНТЫ
// ============================================================

// ВСЕ СТУДЕНТЫ
app.get('/api/students', (req, res) => {
    db.all(`SELECT id, name, email, created_at FROM users WHERE role = 'student'`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// РЕЗУЛЬТАТЫ СТУДЕНТА
app.get('/api/students/:studentId/results', (req, res) => {
    const { studentId } = req.params;
    db.all(`
        SELECT c.title as course_title, r.score, r.completed_at,
            CASE 
                WHEN r.score >= 85 THEN 'Отлично'
                WHEN r.score >= 70 THEN 'Хорошо'
                WHEN r.score >= 50 THEN 'Удовлетворительно'
                ELSE 'Неудовлетворительно'
            END as grade
        FROM results r
        JOIN courses c ON r.course_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.completed_at DESC
    `, [studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// ВСЕ КУРСЫ
app.get('/api/courses', (req, res) => {
    db.all(`
        SELECT c.*, u.name as teacher_name 
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        ORDER BY c.created_at DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// КУРС ПО ID
app.get('/api/course/:id', (req, res) => {
    db.get(`
        SELECT c.*, u.name as teacher_name 
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.id = ?
    `, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Курс не найден' });
        res.json(row);
    });
});

// СОЗДАТЬ КУРС
app.post('/api/courses', (req, res) => {
    const { title, description, weight, teacher_id } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Название курса обязательно' });
    }

    db.run(
        'INSERT INTO courses (title, description, weight, teacher_id) VALUES (?, ?, ?, ?)',
        [title, description || '', weight || 1.0, teacher_id || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID, message: 'Курс создан' });
        }
    );
});

// УДАЛИТЬ КУРС
app.delete('/api/course/:id', (req, res) => {
    db.run('DELETE FROM courses WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Курс не найден' });
        res.json({ success: true, message: 'Курс удалён' });
    });
});

// ============================================================
// API: УРОКИ
// ============================================================

// УРОКИ КУРСА
app.get('/api/courses/:courseId/lessons', (req, res) => {
    const { courseId } = req.params;
    db.all(
        'SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC',
        [courseId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// ДОБАВИТЬ УРОК
app.post('/api/lessons', (req, res) => {
    const { course_id, title, content, duration, type } = req.body;

    if (!course_id || !title) {
        return res.status(400).json({ error: 'course_id и title обязательны' });
    }

    db.get('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?', [course_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const order = row.count + 1;

        db.run(
            'INSERT INTO lessons (course_id, title, content, duration, type, lesson_order) VALUES (?, ?, ?, ?, ?, ?)',
            [course_id, title, content || '', duration || 0, type || 'theory', order],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID, message: 'Урок добавлен' });
            }
        );
    });
});

// УДАЛИТЬ УРОК
app.delete('/api/lesson/:id', (req, res) => {
    db.run('DELETE FROM lessons WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Урок не найден' });
        res.json({ success: true, message: 'Урок удалён' });
    });
});

// ============================================================
// API: ЗАПИСЬ НА КУРСЫ
// ============================================================

// ЗАПИСАТЬСЯ НА КУРС
app.post('/api/enroll', (req, res) => {
    const { user_id, course_id } = req.body;

    if (!user_id || !course_id) {
        return res.status(400).json({ error: 'user_id и course_id обязательны' });
    }

    db.run(
        'INSERT OR IGNORE INTO enrolled (user_id, course_id) VALUES (?, ?)',
        [user_id, course_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Запись на курс выполнена' });
        }
    );
});

// МОИ КУРСЫ
app.get('/api/my-courses/:userId', (req, res) => {
    const { userId } = req.params;

    db.all(`
        SELECT c.*, e.enrolled_at,
            up.status, up.completed_lessons, up.total_lessons, up.final_score
        FROM enrolled e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN user_progress up ON up.user_id = e.user_id AND up.course_id = c.id
        WHERE e.user_id = ?
    `, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ============================================================
// API: ПРЕПОДАВАТЕЛЬ
// ============================================================

// КУРСЫ ПРЕПОДАВАТЕЛЯ
app.get('/api/teacher/courses/:teacherId', (req, res) => {
    const { teacherId } = req.params;

    db.all(`
        SELECT c.*, 
            (SELECT COUNT(*) FROM enrolled WHERE course_id = c.id) as student_count,
            (SELECT AVG(score) FROM results WHERE course_id = c.id) as avg_score
        FROM courses c
        WHERE c.teacher_id = ?
    `, [teacherId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// СТУДЕНТЫ КУРСА С ПРОГРЕССОМ
app.get('/api/teacher/courses/:courseId/results', (req, res) => {
    const { courseId } = req.params;

    db.all(`
        SELECT u.id, u.name, u.email,
            r.score,
            up.status,
            up.completed_lessons,
            up.total_lessons,
            up.final_score,
            CASE 
                WHEN up.status = 'completed' THEN 1 
                ELSE 0 
            END as completed
        FROM enrolled e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN results r ON r.user_id = u.id AND r.course_id = e.course_id
        LEFT JOIN user_progress up ON up.user_id = u.id AND up.course_id = e.course_id
        WHERE e.course_id = ?
        GROUP BY u.id
    `, [courseId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// НАЗНАЧИТЬ ПРЕПОДАВАТЕЛЯ НА КУРС
app.post('/api/teacher/assign-course', (req, res) => {
    const { course_id, teacher_id } = req.body;

    db.run('UPDATE courses SET teacher_id = ? WHERE id = ?', [teacher_id, course_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Преподаватель назначен на курс' });
    });
});

// ============================================================
// API: КУРАТОР
// ============================================================

// ВСЕ ГРУППЫ КУРАТОРА
app.get('/api/curator/groups', (req, res) => {
    const { curatorId } = req.query;

    db.all(`
        SELECT g.*, COUNT(ug.user_id) as student_count
        FROM groups g
        LEFT JOIN user_groups ug ON ug.group_id = g.id
        WHERE g.curator_id = ?
        GROUP BY g.id
    `, [curatorId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// СТУДЕНТЫ ГРУППЫ
app.get('/api/curator/group/:groupId/students', (req, res) => {
    const { groupId } = req.params;

    db.all(`
        SELECT u.id, u.name, u.email, u.role,
            up.status,
            up.completed_lessons,
            up.total_lessons,
            up.final_score
        FROM user_groups ug
        JOIN users u ON ug.user_id = u.id
        LEFT JOIN user_progress up ON up.user_id = u.id
        WHERE ug.group_id = ?
    `, [groupId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// СОЗДАТЬ ГРУППУ
app.post('/api/curator/group/create', (req, res) => {
    const { name, curator_id } = req.body;

    db.run('INSERT INTO groups (name, curator_id) VALUES (?, ?)', [name, curator_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID, message: 'Группа создана' });
    });
});

// ДОБАВИТЬ СТУДЕНТА В ГРУППУ
app.post('/api/curator/group/add-student', (req, res) => {
    const { group_id, user_id } = req.body;

    db.run('INSERT OR IGNORE INTO user_groups (group_id, user_id) VALUES (?, ?)',
        [group_id, user_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Студент добавлен в группу' });
        }
    );
});

// ============================================================
// API: АДМИН
// ============================================================

// ВСЕ ПОЛЬЗОВАТЕЛИ
app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT id, name, email, role, active, created_at FROM users ORDER BY id`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ИЗМЕНИТЬ РОЛЬ
app.post('/api/admin/set-role', (req, res) => {
    const { id, role } = req.body;

    db.run('UPDATE users SET role = ? WHERE id = ?', [role, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Роль изменена' });
    });
});

// УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ
app.delete('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Пользователь удалён' });
    });
});

// СТАТИСТИКА
app.get('/api/admin/stats', (req, res) => {
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM users WHERE role = 'student') as students,
            (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
            (SELECT COUNT(*) FROM users WHERE role = 'curator') as curators,
            (SELECT COUNT(*) FROM courses) as courses,
            (SELECT COUNT(*) FROM enrolled) as enrollments,
            (SELECT COUNT(*) FROM results) as results,
            COALESCE((SELECT AVG(score) FROM results), 0) as avg_score
    `, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// ============================================================
// API: КАЛЕНДАРЬ
// ============================================================

// ДОБАВИТЬ СОБЫТИЕ
app.post('/api/calendar/event', (req, res) => {
    const { user_id, user_name, user_role, action, event_type } = req.body;

    if (!user_id || !user_name || !user_role || !action) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    db.run(
        'INSERT INTO calendar_events (user_id, user_name, user_role, action, event_type) VALUES (?, ?, ?, ?, ?)',
        [user_id, user_name, user_role, action, event_type || 'activity'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID, message: 'Событие добавлено' });
        }
    );
});

// ВСЕ СОБЫТИЯ
app.get('/api/calendar/events', (req, res) => {
    const { userId } = req.query;

    let query = `SELECT * FROM calendar_events ORDER BY event_date DESC LIMIT 100`;
    let params = [];

    if (userId) {
        query = `SELECT * FROM calendar_events WHERE user_id = ? ORDER BY event_date DESC LIMIT 100`;
        params = [userId];
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ============================================================
// API: РАСЧЁТ БАЛЛА
// ============================================================

app.post('/api/calculate', (req, res) => {
    try {
        const { studentId, courseId, grades } = req.body;

        if (!studentId || !courseId || !grades) {
            return res.status(400).json({ error: 'Нужны studentId, courseId и grades' });
        }
        if (!Array.isArray(grades) || grades.length === 0) {
            return res.status(400).json({ error: 'grades должен быть непустым массивом' });
        }

        let totalScore = 0;
        let totalWeight = 0;

        for (let i = 0; i < grades.length; i++) {
            const grade = grades[i];
            if (grade.value === undefined || grade.weight === undefined) {
                return res.status(400).json({ error: `У оценки ${i} нет поля value или weight` });
            }
            if (!validateGrade(grade.value)) {
                return res.status(400).json({ error: `value=${grade.value} должен быть числом от 0 до 100` });
            }
            if (!validateWeight(grade.weight)) {
                return res.status(400).json({ error: `weight=${grade.weight} должен быть числом от 0 до 1` });
            }
            totalScore += grade.value * grade.weight;
            totalWeight += grade.weight;
        }

        if (totalWeight === 0) {
            return res.status(400).json({ error: 'Сумма весов не может быть 0' });
        }

        const finalScore = Math.round((totalScore / totalWeight) * 100) / 100;
        const passed = finalScore >= 70 ? 1 : 0;

        // СОХРАНЯЕМ РЕЗУЛЬТАТ
        db.run(
            'INSERT INTO results (user_id, course_id, score, passed) VALUES (?, ?, ?, ?)',
            [studentId, courseId, finalScore, passed],
            function(err) {
                if (err) {
                    return res.json({ 
                        finalScore, 
                        passed: passed === 1,
                        warning: 'Результат не сохранён в БД' 
                    });
                }
                res.json({ 
                    finalScore, 
                    passed: passed === 1,
                    saved: true,
                    message: 'Результат сохранён'
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Внутренняя ошибка: ' + error.message });
    }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`📌 Админ: admin@gmail.com / admin123`);
});