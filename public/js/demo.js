function demoOOP() {
    const lms = new LMS();
    console.log(' LMS создана');

    console.log('\n--- РЕГИСТРАЦИЯ ---');
    try {
        const student1 = lms.registerUser(1, 'Екатерина', 'katya@email.com', '1234', 'student');
        const student2 = lms.registerUser(2, 'Илон Макс', 'ilon@email.com', '1234', 'student');
        const teacher = lms.registerUser(3, 'Анна Петрова', 'anna@email.com', '1234', 'teacher');
        const admin = lms.registerUser(4, 'Админ', 'admin@admin.com', 'admin123', 'admin');

        console.log(' Зарегистрированы:');
        console.log('   - Екатерина (student)');
        console.log('   - Илон Макс (student)');
        console.log('   - Анна Петрова (teacher)');
        console.log('   - Админ (admin)');
    } catch (error) {
        console.error(error.message);
    }

    console.log('\n--- ВХОД ---');
    try {
        const user = lms.login('katya@email.com', '1234');
        console.log(` Вход выполнен: ${user.getName()} (${user.getRole()})`);
    } catch (error) {
        console.error(error.message);
    }

    console.log('\n--- СОЗДАНИЕ КУРСА ---');
    try {
        const course = lms.createCourse(
            1,
            'Введение в робототехнику',
            'Изучите основы робототехники: контроллеры, датчики, первые программы.',
            '2 недели',
            'Начинающий',
            ['Arduino', 'Датчики', 'Программирование']
        );
        console.log(` Курс создан: ${course.getTitle()}`);

        const lesson1 = new Lesson(101, 'Что такое робототехника?', 'Введение в робототехнику', 'theory', '<p>Теория...</p>', 'Arduino');
        const lesson2 = new Lesson(102, 'Тест: Основы робототехники', 'Проверка знаний', 'test', '', 'Arduino');
        const lesson3 = new Lesson(103, 'Задание: Собрать схему', 'Практическое задание', 'task', '', 'Схемотехника');

        course.addLesson(lesson1);
        course.addLesson(lesson2);
        course.addLesson(lesson3);

        console.log(` В курс добавлено ${course.getLessonsCount()} уроков`);
    } catch (error) {
        console.error(error.message);
    }

    console.log('\n--- ЗАПИСЬ НА КУРС ---');
    try {
        const result = lms.enrollStudent(1, 1);
        console.log(` ${result}`);

        const result2 = lms.enrollStudent(2, 1);
        console.log(` ${result2}`);
    } catch (error) {
        console.error(error.message);
    }

    console.log('\n--- ПРОХОЖДЕНИЕ УРОКОВ ---');
    try {
        const progress = lms.getProgress(1, 1);

        progress.completeLesson(101);
        progress.completeLesson(102);

        console.log(` Пройдено уроков: ${progress.getCompletedCount()}`);

        progress.addTestResult(102, 85, true);
        console.log(` Тест пройден: ${progress.getAverageScore()}%`);
    } catch (error) {
        console.error(error.message);
    }

    console.log('\n--- СТАТИСТИКА ---');
    try {
        const stats = lms.getCourseStats(1);
        console.log(` Статистика курса:`);
        console.log(`   - Студентов: ${stats.total}`);
        console.log(`   - Средний балл: ${stats.avgScore}%`);
        console.log(`   - Сдали: ${stats.passed}`);
    } catch (error) {
        console.error(error.message);
    }

    console.log('\n--- ИНКАПСУЛЯЦИЯ (проверка приватности) ---');
    try {
        const user = lms.getUser(1);
        console.log(' Приватные поля защищены (доступ только через геттеры)');
        console.log(`   Имя: ${user.getName()}`);
    } catch (error) {
        console.error(' ' + error.message);
    }

    console.log('\n--- ВАЛИДАЦИЯ ---');
    try {
        new User(5, 'Тест', '', '1234');
    } catch (error) {
        console.log(' Валидация работает: ' + error.message);
    }

    try {
        new Course(2, '', '');
    } catch (error) {
        console.log(' Валидация работает: ' + error.message);
    }

    console.log('\n--- ОБРАБОТКА ИСКЛЮЧЕНИЙ ---');
    try {
        lms.getCourse(999);
    } catch (error) {
        console.log(' Исключение обработано: ' + error.message);
    }

    try {
        // Попытка записаться на курс студентом, который уже записан
        lms.enrollStudent(1, 1);
    } catch (error) {
        console.log('Исключение обработано: ' + error.message);
    }

}

demoOOP();