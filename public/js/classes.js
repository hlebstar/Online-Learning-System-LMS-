// ============================================================
// 1. КЛАСС USER (пользователь)
// ============================================================
class User {
    #id;
    #name;
    #email;
    #role;
    #password;

    constructor(id, name, email, password, role = 'student') {
        // Валидация
        if (!id || !name || !email || !password) {
            throw new Error('❌ Все поля обязательны: id, name, email, password');
        }
        if (password.length < 4) {
            throw new Error('❌ Пароль должен быть минимум 4 символа');
        }
        if (!email.includes('@')) {
            throw new Error('❌ Некорректный email');
        }

        // Инкапсуляция (приватные поля)
        this.#id = id;
        this.#name = name;
        this.#email = email;
        this.#password = password;
        this.#role = role;
    }

    // Геттеры
    getId() { return this.#id; }
    getName() { return this.#name; }
    getEmail() { return this.#email; }
    getRole() { return this.#role; }

    // Проверка роли
    isStudent() { return this.#role === 'student'; }
    isTeacher() { return this.#role === 'teacher'; }
    isCurator() { return this.#role === 'curator'; }
    isAdmin() { return this.#role === 'admin'; }

    // Смена роли (только для админа)
    setRole(newRole, adminUser) {
        if (!adminUser || !adminUser.isAdmin()) {
            throw new Error('❌ Только администратор может менять роли');
        }
        const validRoles = ['student', 'teacher', 'curator', 'admin'];
        if (!validRoles.includes(newRole)) {
            throw new Error('❌ Некорректная роль: ' + newRole);
        }
        this.#role = newRole;
        return `✅ Роль изменена на ${newRole}`;
    }

    // Проверка пароля
    checkPassword(password) {
        return this.#password === password;
    }

    // Смена пароля
    setPassword(oldPassword, newPassword) {
        if (!this.checkPassword(oldPassword)) {
            throw new Error('❌ Неверный старый пароль');
        }
        if (newPassword.length < 4) {
            throw new Error('❌ Пароль должен быть минимум 4 символа');
        }
        this.#password = newPassword;
        return '✅ Пароль изменён';
    }

    // Преобразование в JSON
    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
            email: this.#email,
            role: this.#role
        };
    }

    // Статический метод для создания из JSON
    static fromJSON(data) {
        return new User(data.id, data.name, data.email, data.password || 'default', data.role);
    }
}


// ============================================================
// 2. КЛАСС LESSON (урок)
// ============================================================
class Lesson {
    #id;
    #title;
    #description;
    #type; // 'theory', 'test', 'task'
    #content;
    #completed;
    #skill;

    constructor(id, title, description, type, content = '', skill = '') {
        // Валидация
        if (!id || !title || !description) {
            throw new Error('❌ id, title и description обязательны');
        }
        const validTypes = ['theory', 'test', 'task'];
        if (!validTypes.includes(type)) {
            throw new Error('❌ Некорректный тип урока: ' + type);
        }

        this.#id = id;
        this.#title = title;
        this.#description = description;
        this.#type = type;
        this.#content = content;
        this.#skill = skill;
        this.#completed = false;
    }

    // Геттеры
    getId() { return this.#id; }
    getTitle() { return this.#title; }
    getDescription() { return this.#description; }
    getType() { return this.#type; }
    getContent() { return this.#content; }
    getSkill() { return this.#skill; }
    isCompleted() { return this.#completed; }

    // Отметить как пройденный
    complete() {
        if (this.#completed) {
            throw new Error(`⚠️ Урок "${this.#title}" уже пройден`);
        }
        this.#completed = true;
        return `✅ Урок "${this.#title}" пройден`;
    }

    // Сброс прогресса
    reset() {
        this.#completed = false;
        return `🔄 Урок "${this.#title}" сброшен`;
    }

    // Проверка типа
    isTheory() { return this.#type === 'theory'; }
    isTest() { return this.#type === 'test'; }
    isTask() { return this.#type === 'task'; }

    toJSON() {
        return {
            id: this.#id,
            title: this.#title,
            description: this.#description,
            type: this.#type,
            content: this.#content,
            skill: this.#skill,
            completed: this.#completed
        };
    }
}


// ============================================================
// 3. КЛАСС COURSE (курс)
// ============================================================
class Course {
    #id;
    #title;
    #description;
    #duration;
    #level;
    #lessons = [];
    #skills = [];

    constructor(id, title, description, duration, level, skills = []) {
        // Валидация
        if (!id || !title || !description) {
            throw new Error('❌ id, title и description обязательны');
        }
        if (!Array.isArray(skills)) {
            throw new Error('❌ Навыки должны быть массивом');
        }

        this.#id = id;
        this.#title = title;
        this.#description = description;
        this.#duration = duration || 'Не указано';
        this.#level = level || 'Начинающий';
        this.#skills = skills;
    }

    // Геттеры
    getId() { return this.#id; }
    getTitle() { return this.#title; }
    getDescription() { return this.#description; }
    getDuration() { return this.#duration; }
    getLevel() { return this.#level; }
    getLessons() { return [...this.#lessons]; }
    getSkills() { return [...this.#skills]; }

    // Добавить урок
    addLesson(lesson) {
        if (!(lesson instanceof Lesson)) {
            throw new Error('❌ Добавлять можно только объекты Lesson');
        }
        this.#lessons.push(lesson);
        return `✅ Урок "${lesson.getTitle()}" добавлен в курс "${this.#title}"`;
    }

    // Получить количество уроков
    getLessonsCount() {
        return this.#lessons.length;
    }

    // Получить пройденные уроки
    getCompletedLessons() {
        return this.#lessons.filter(lesson => lesson.isCompleted());
    }

    // Прогресс в процентах
    getProgress() {
        if (this.#lessons.length === 0) return 0;
        const completed = this.getCompletedLessons().length;
        return Math.round((completed / this.#lessons.length) * 100);
    }

    // Проверка, пройден ли курс
    isCompleted() {
        return this.getProgress() === 100;
    }

    toJSON() {
        return {
            id: this.#id,
            title: this.#title,
            description: this.#description,
            duration: this.#duration,
            level: this.#level,
            skills: this.#skills,
            lessons: this.#lessons.map(l => l.toJSON()),
            progress: this.getProgress()
        };
    }
}


// ============================================================
// 4. КЛАСС TEST (тест - для проверки знаний)
// ============================================================
class Test {
    #questions = [];
    #answers = [];
    #score = 0;
    #passed = false;

    constructor(questions = []) {
        if (!Array.isArray(questions)) {
            throw new Error('❌ Вопросы должны быть массивом');
        }
        this.#questions = questions;
        this.#answers = new Array(questions.length).fill(null);
    }

    // Получить вопросы
    getQuestions() { return [...this.#questions]; }

    // Ответить на вопрос
    answerQuestion(index, answer) {
        if (index < 0 || index >= this.#questions.length) {
            throw new Error('❌ Неверный индекс вопроса');
        }
        if (answer === undefined || answer === null) {
            throw new Error('❌ Ответ не может быть пустым');
        }
        this.#answers[index] = answer;
    }

    // Получить ответ на вопрос
    getAnswer(index) {
        if (index < 0 || index >= this.#questions.length) {
            throw new Error('❌ Неверный индекс вопроса');
        }
        return this.#answers[index];
    }

    // Проверить все ответы
    checkAnswers() {
        let correct = 0;
        const results = [];

        for (let i = 0; i < this.#questions.length; i++) {
            const isCorrect = this.#answers[i] === this.#questions[i].correct;
            if (isCorrect) correct++;
            results.push({
                question: this.#questions[i].text,
                userAnswer: this.#answers[i] !== null ? this.#questions[i].options[this.#answers[i]] : 'Не отвечен',
                correctAnswer: this.#questions[i].options[this.#questions[i].correct],
                isCorrect: isCorrect
            });
        }

        this.#score = Math.round((correct / this.#questions.length) * 100);
        this.#passed = this.#score >= 70;

        return {
            score: this.#score,
            passed: this.#passed,
            correctAnswers: correct,
            totalQuestions: this.#questions.length,
            results: results
        };
    }

    getScore() { return this.#score; }
    isPassed() { return this.#passed; }

    // Сброс теста
    reset() {
        this.#answers = new Array(this.#questions.length).fill(null);
        this.#score = 0;
        this.#passed = false;
    }
}


// ============================================================
// 5. КЛАСС PROGRESS (прогресс студента)
// ============================================================
class Progress {
    #userId;
    #courseId;
    #completedLessons = [];
    #testResults = [];
    #startDate;
    #lastActivity;

    constructor(userId, courseId) {
        if (!userId || !courseId) {
            throw new Error('❌ userId и courseId обязательны');
        }
        this.#userId = userId;
        this.#courseId = courseId;
        this.#startDate = new Date();
        this.#lastActivity = new Date();
    }

    // Геттеры
    getUserId() { return this.#userId; }
    getCourseId() { return this.#courseId; }
    getStartDate() { return this.#startDate; }
    getLastActivity() { return this.#lastActivity; }

    // Отметить урок пройденным
    completeLesson(lessonId) {
        if (!lessonId) {
            throw new Error('❌ ID урока обязателен');
        }
        if (!this.#completedLessons.includes(lessonId)) {
            this.#completedLessons.push(lessonId);
        }
        this.#lastActivity = new Date();
        return `✅ Урок ${lessonId} отмечен`;
    }

    // Получить пройденные уроки
    getCompletedLessons() { return [...this.#completedLessons]; }

    // Количество пройденных уроков
    getCompletedCount() { return this.#completedLessons.length; }

    // Добавить результат теста
    addTestResult(testId, score, passed) {
        if (!testId || score === undefined) {
            throw new Error('❌ testId и score обязательны');
        }
        if (score < 0 || score > 100) {
            throw new Error('❌ Оценка должна быть от 0 до 100');
        }
        this.#testResults.push({
            testId: testId,
            score: score,
            passed: passed,
            date: new Date()
        });
        this.#lastActivity = new Date();
    }

    // Средний балл по тестам
    getAverageScore() {
        if (this.#testResults.length === 0) return 0;
        const sum = this.#testResults.reduce((acc, r) => acc + r.score, 0);
        return Math.round(sum / this.#testResults.length);
    }

    // Количество пройденных тестов
    getPassedTests() {
        return this.#testResults.filter(r => r.passed).length;
    }

    toJSON() {
        return {
            userId: this.#userId,
            courseId: this.#courseId,
            completedLessons: this.#completedLessons,
            testResults: this.#testResults,
            startDate: this.#startDate,
            lastActivity: this.#lastActivity
        };
    }
}


// ============================================================
// 6. КЛАСС LMS (главный класс системы)
// ============================================================
class LMS {
    #users = [];
    #courses = [];
    #progress = [];

    // Регистрация пользователя
    registerUser(id, name, email, password, role = 'student') {
        try {
            const user = new User(id, name, email, password, role);
            this.#users.push(user);
            return user;
        } catch (error) {
            throw new Error('❌ Ошибка регистрации: ' + error.message);
        }
    }

    // Поиск пользователя по ID
    getUser(id) {
        const user = this.#users.find(u => u.getId() === id);
        if (!user) throw new Error(`❌ Пользователь с ID ${id} не найден`);
        return user;
    }

    // Вход (аутентификация)
    login(email, password) {
        const user = this.#users.find(u => u.getEmail() === email);
        if (!user) {
            throw new Error('❌ Пользователь с таким email не найден');
        }
        if (!user.checkPassword(password)) {
            throw new Error('❌ Неверный пароль');
        }
        return user;
    }

    // Создать курс
    createCourse(id, title, description, duration, level, skills = []) {
        try {
            const course = new Course(id, title, description, duration, level, skills);
            this.#courses.push(course);
            return course;
        } catch (error) {
            throw new Error('❌ Ошибка создания курса: ' + error.message);
        }
    }

    // Получить курс по ID
    getCourse(id) {
        const course = this.#courses.find(c => c.getId() === id);
        if (!course) throw new Error(`❌ Курс с ID ${id} не найден`);
        return course;
    }

    // Записаться на курс
    enrollStudent(userId, courseId) {
        const user = this.getUser(userId);
        const course = this.getCourse(courseId);

        if (!user.isStudent()) {
            throw new Error('❌ Только студенты могут записываться на курсы');
        }

        // Проверяем, не записан ли уже
        const existing = this.#progress.find(p =>
            p.getUserId() === userId && p.getCourseId() === courseId
        );
        if (existing) {
            throw new Error(`⚠️ Пользователь ${user.getName()} уже записан на курс "${course.getTitle()}"`);
        }

        const progress = new Progress(userId, courseId);
        this.#progress.push(progress);
        return `✅ ${user.getName()} записан на курс "${course.getTitle()}"`;
    }

    // Получить прогресс студента по курсу
    getProgress(userId, courseId) {
        const progress = this.#progress.find(p =>
            p.getUserId() === userId && p.getCourseId() === courseId
        );
        if (!progress) {
            throw new Error(`❌ Прогресс не найден для пользователя ${userId} и курса ${courseId}`);
        }
        return progress;
    }

    // Получить все курсы пользователя
    getUserCourses(userId) {
        const userProgress = this.#progress.filter(p => p.getUserId() === userId);
        return userProgress.map(p => {
            const course = this.getCourse(p.getCourseId());
            return {
                course: course.toJSON(),
                progress: p
            };
        });
    }

    // Получить всех студентов на курсе
    getCourseStudents(courseId) {
        const course = this.getCourse(courseId);
        const progress = this.#progress.filter(p => p.getCourseId() === courseId);
        return progress.map(p => {
            const user = this.getUser(p.getUserId());
            return {
                user: user.toJSON(),
                progress: p.toJSON()
            };
        });
    }

    // Статистика по курсу
    getCourseStats(courseId) {
        const students = this.getCourseStudents(courseId);
        if (students.length === 0) {
            return { total: 0, avgScore: 0, passed: 0 };
        }

        const scores = students.map(s => s.progress.averageScore || 0);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const passed = students.filter(s => {
            const avg = s.progress.averageScore || 0;
            return avg >= 70;
        }).length;

        return {
            total: students.length,
            avgScore: avgScore,
            passed: passed
        };
    }
}


// ============================================================
// ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        User,
        Lesson,
        Course,
        Test,
        Progress,
        LMS
    };
}

console.log('✅ ООП классы загружены');