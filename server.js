const express = require('express');
const db = require('./database');
const app = express();


app.use(express.static('public'));
app.use(express.json());

app.post('/api/calculate', (req, res) => {
  try {
    const { studentId, courseId, grades } = req.body;
    
    if (!studentId || !courseId || !grades) {
      return res.status(400).json({ 
        error: 'Ошибка: нужны studentId, courseId и grades' 
      });
    }
    
    if (!Array.isArray(grades)) {
      return res.status(400).json({ 
        error: 'Ошибка: grades должен быть массивом' 
      });
    }
    
    if (grades.length === 0) {
      return res.status(400).json({ 
        error: 'Ошибка: массив grades пуст' 
      });
    }
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i];
      
      if (grade.value === undefined || grade.weight === undefined) {
        return res.status(400).json({ 
          error: `Ошибка: у оценки ${i} нет поля value или weight` 
        });
      }
      
      if (!validateGrade(grade.value)) {
        return res.status(400).json({ 
          error: `Ошибка: value=${grade.value} должен быть числом от 0 до 100` 
        });
      }
      
      if (!validateWeight(grade.weight)) {
        return res.status(400).json({ 
          error: `Ошибка: weight=${grade.weight} должен быть числом от 0 до 1` 
        });
      }
      
      totalScore += grade.value * grade.weight;
      totalWeight += grade.weight;
    }
    
    if (totalWeight === 0) {
      return res.status(400).json({ 
        error: 'Ошибка: сумма весов не может быть 0' 
      });
    }
    
    const finalScore = totalScore / totalWeight;
    const roundedScore = Math.round(finalScore * 100) / 100;
    
    db.run(`INSERT INTO results (user_id, course_id, score) VALUES (?, ?, ?)`,
      [studentId, courseId, roundedScore],
      (err) => {
        if (err) {
          return res.json({ 
            finalScore: roundedScore, 
            warning: 'Результат не сохранён (возможно, нет студента или курса)' 
          });
        }
        res.json({ 
          finalScore: roundedScore, 
          saved: true,
          message: 'Результат сохранён'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Внутренняя ошибка: ' + error.message });
  }
});

app.post('/api/users', (req, res) => {
  const { name, email, role } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Имя и email обязательны' });
  }
  
  const userRole = role || 'student';
  
  db.run(`INSERT INTO users (name, email, role) VALUES (?, ?, ?)`,
    [name, email, userRole],
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
        role: userRole,
        message: 'Пользователь создан' 
      });
    }
  );
});

app.get('/api/students', (req, res) => {
  db.all(`SELECT id, name, email, created_at FROM users WHERE role = 'student'`, 
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.get('/api/courses', (req, res) => {
  db.all(`SELECT * FROM courses`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/courses', (req, res) => {
  const { title, description, weight } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Название курса обязательно' });
  }
  
  db.run(`INSERT INTO courses (title, description, weight) VALUES (?, ?, ?)`,
    [title, description || '', weight || 1.0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, title, message: 'Курс создан' });
    }
  );
});

app.post('/api/lessons', (req, res) => {
  const { course_id, title, content, duration, order_number } = req.body;
  
  if (!course_id || !title) {
    return res.status(400).json({ error: 'course_id и title обязательны' });
  }
  
  db.run(`INSERT INTO lessons (course_id, title, content, duration, order_number) 
          VALUES (?, ?, ?, ?, ?)`,
    [course_id, title, content || '', duration || 0, order_number || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, title, message: 'Урок добавлен' });
    }
  );
});

app.get('/api/courses/:courseId/lessons', (req, res) => {
  const { courseId } = req.params;
  
  db.all(`SELECT * FROM lessons WHERE course_id = ? ORDER BY order_number`,
    [courseId], 
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.get('/api/students/:studentId/results', (req, res) => {
  const { studentId } = req.params;
  
  db.all(`SELECT 
            c.title as course_title,
            r.score,
            r.completed_at,
            CASE 
              WHEN r.score >= 85 THEN 'Отлично'
              WHEN r.score >= 70 THEN 'Хорошо'
              WHEN r.score >= 50 THEN 'Удовлетворительно'
              ELSE 'Неудовлетворительно'
            END as grade
          FROM results r
          JOIN courses c ON r.course_id = c.id
          WHERE r.user_id = ?
          ORDER BY r.completed_at DESC`,
    [studentId], 
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.get('/api/courses/:courseId/stats', (req, res) => {
  const { courseId } = req.params;
  
  db.get(`SELECT 
            COUNT(*) as total_students,
            AVG(score) as avg_score,
            MAX(score) as max_score,
            MIN(score) as min_score,
            SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END) as passed_count
          FROM results 
          WHERE course_id = ?`,
    [courseId], 
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    }
  );
});

app.post('/api/progress', (req, res) => {
  const { user_id, course_id, completed_lessons, total_lessons } = req.body;
  
  const status = completed_lessons === total_lessons ? 'completed' : 'in_progress';
  
  db.run(`INSERT OR REPLACE INTO user_progress 
          (user_id, course_id, completed_lessons, total_lessons, status, last_accessed)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [user_id, course_id, completed_lessons || 0, total_lessons || 0, status],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ status, message: 'Прогресс обновлён' });
    }
  );
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


//регистрация\авторизация 
app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [name, email, password, role || 'student'],
    function(err) {
      if (err) return res.json({ error: 'Ошибка: email уже есть' });
      res.json({ id: this.lastID, name, email, ok: true });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(`SELECT id, name, email, role FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, user) => {
      if (err || !user) return res.json({ error: 'Неверный логин или пароль' });
      res.json({ user, ok: true });
    }
  );
});

app.get('/api/user/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT id, name, email, role FROM users WHERE id = ?`,
    [id],
    (err, user) => {
      if (err || !user) return res.json({ error: 'Пользователь не найден' });
      res.json(user);
    }
  );
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`сервер запущен: http://localhost:${PORT}`);
});