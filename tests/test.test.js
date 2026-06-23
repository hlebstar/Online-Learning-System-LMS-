const Test = require('../src/models/Test');

describe('Test Class Tests', function() {

    var questions;
    var testObj;

    beforeEach(function() {
        questions = [
            { text: 'What is a robot?', options: ['Machine', 'Program', 'Device', 'System'], correctAnswer: 0 },
            { text: 'Which language is used in Arduino?', options: ['Python', 'C++', 'Java', 'JavaScript'], correctAnswer: 1 },
            { text: 'What is a microcontroller?', options: ['Compact computer', 'Server', 'OS', 'Database'], correctAnswer: 0 },
            { text: 'Why are sensors needed?', options: ['For information', 'For movement', 'For internet', 'For storage'], correctAnswer: 0 },
            { text: 'Which sensor measures distance?', options: ['Ultrasonic', 'Light', 'Gyroscope', 'Accelerometer'], correctAnswer: 0 }
        ];
        testObj = new Test(1, 'Robotics Basics', questions, 70);
    });

    test('Create test with valid data', function() {
        expect(testObj.getId()).toBe(1);
        expect(testObj.getTitle()).toBe('Robotics Basics');
        expect(testObj.getQuestions().length).toBe(5);
        expect(testObj.getPassingScore()).toBe(70);
        expect(testObj.getTotalQuestions()).toBe(5);
    });

    test('Create test without id throws error', function() {
        expect(function() {
            new Test(null, 'Title');
        }).toThrow('ID и название теста обязательны');
    });

    test('Create test without title throws error', function() {
        expect(function() {
            new Test(1, null);
        }).toThrow('ID и название теста обязательны');
    });

    test('Create test with invalid questions type', function() {
        expect(function() {
            new Test(1, 'Title', 'not array');
        }).toThrow('Вопросы должны быть массивом');
    });

    test('Add question to test', function() {
        var newQuestion = { text: 'New question', options: ['A', 'B', 'C'], correctAnswer: 1 };
        testObj.addQuestion(newQuestion);
        expect(testObj.getTotalQuestions()).toBe(6);
    });

    test('Add invalid question throws error', function() {
        expect(function() {
            testObj.addQuestion({ text: 'Only text' });
        }).toThrow('Некорректный формат вопроса');
    });

    test('Validate correct answer', function() {
        var result = testObj.validateAnswer(0, 0);
        expect(result).toBe(true);
    });

    test('Validate incorrect answer', function() {
        var result = testObj.validateAnswer(0, 1);
        expect(result).toBe(false);
    });

    test('Validate invalid question index', function() {
        expect(function() {
            testObj.validateAnswer(100, 0);
        }).toThrow('Неверный индекс вопроса');
    });

    test('Calculate score with all correct answers', function() {
        var answers = [0, 1, 0, 0, 0];
        var result = testObj.calculateScore(answers);
        expect(result.score).toBe(100);
        expect(result.correctAnswers).toBe(5);
        expect(result.totalQuestions).toBe(5);
        expect(result.passed).toBe(true);
    });

    test('Calculate score with 80% correct answers', function() {
        var answers = [0, 1, 0, 1, 0];
        var result = testObj.calculateScore(answers);
        expect(result.score).toBe(80);
        expect(result.correctAnswers).toBe(4);
        expect(result.passed).toBe(true);
    });

    test('Calculate score with 60% correct answers (failing)', function() {
        var answers = [0, 1, 1, 1, 0];
        var result = testObj.calculateScore(answers);
        expect(result.score).toBe(60);
        expect(result.correctAnswers).toBe(3);
        expect(result.passed).toBe(false);
    });

    test('Calculate score with empty answers', function() {
        var result = testObj.calculateScore([]);
        expect(result.score).toBe(0);
        expect(result.correctAnswers).toBe(0);
        expect(result.passed).toBe(false);
    });

    test('Convert to JSON', function() {
        var json = testObj.toJSON();
        expect(json.id).toBe(1);
        expect(json.title).toBe('Robotics Basics');
        expect(json.questions.length).toBe(5);
        expect(json.passingScore).toBe(70);
        expect(json.totalQuestions).toBe(5);
    });

});