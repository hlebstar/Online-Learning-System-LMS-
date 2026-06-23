const Progress = require('../src/models/Progress');

describe('Progress Tests', function() {

    var progress;

    beforeEach(function() {
        progress = new Progress(1, 1, 10);
    });

    test('Create progress with valid data', function() {
        expect(progress.getUserId()).toBe(1);
        expect(progress.getCourseId()).toBe(1);
        expect(progress.getCompletedLessons()).toBe(0);
        expect(progress.getTotalLessons()).toBe(10);
        expect(progress.getStatus()).toBe('in_progress');
        expect(progress.getAverageScore()).toBe(0);
        expect(progress.getProgressPercentage()).toBe(0);
    });

    test('Create progress without userId throws error', function() {
        expect(function() {
            new Progress(null, 1);
        }).toThrow('userId и courseId обязательны');
    });

    test('Create progress without courseId throws error', function() {
        expect(function() {
            new Progress(1, null);
        }).toThrow('userId и courseId обязательны');
    });

    test('Complete lesson', function() {
        progress.completeLesson(1);
        expect(progress.getCompletedLessons()).toBe(1);
        expect(progress.getProgressPercentage()).toBe(10);
    });

    test('Complete multiple lessons', function() {
        for (var i = 0; i < 5; i++) {
            progress.completeLesson(i);
        }
        expect(progress.getCompletedLessons()).toBe(5);
        expect(progress.getProgressPercentage()).toBe(50);
    });

    test('Cannot complete more than total lessons', function() {
        for (var i = 0; i < 15; i++) {
            progress.completeLesson(i);
        }
        expect(progress.getCompletedLessons()).toBe(10);
        expect(progress.getProgressPercentage()).toBe(100);
    });

    test('Add test score', function() {
        progress.addTestScore(85);
        expect(progress.getAverageScore()).toBe(85);
    });

    test('Add multiple test scores', function() {
        progress.addTestScore(85);
        progress.addTestScore(90);
        progress.addTestScore(75);
        expect(progress.getAverageScore()).toBe(83);
    });

    test('Add invalid test score (negative)', function() {
        expect(function() {
            progress.addTestScore(-10);
        }).toThrow('Оценка должна быть числом от 0 до 100');
    });

    test('Add invalid test score (above 100)', function() {
        expect(function() {
            progress.addTestScore(110);
        }).toThrow('Оценка должна быть числом от 0 до 100');
    });

    test('Add invalid test score (not a number)', function() {
        expect(function() {
            progress.addTestScore('abc');
        }).toThrow('Оценка должна быть числом от 0 до 100');
    });

    test('Complete course with all lessons and passing score', function() {
        for (var i = 0; i < 10; i++) {
            progress.completeLesson(i);
        }
        progress.addTestScore(85);
        expect(progress.getStatus()).toBe('completed');
        expect(progress.getProgressPercentage()).toBe(100);
        expect(progress.getAverageScore()).toBe(85);
    });

    test('Complete all lessons but failing score', function() {
        for (var i = 0; i < 10; i++) {
            progress.completeLesson(i);
        }
        progress.addTestScore(60);
        expect(progress.getStatus()).toBe('in_progress');
        expect(progress.getAverageScore()).toBe(60);
    });

    test('Complete all lessons with no tests', function() {
        for (var i = 0; i < 10; i++) {
            progress.completeLesson(i);
        }
        expect(progress.getStatus()).toBe('in_progress');
        expect(progress.getAverageScore()).toBe(0);
    });

    test('Progress with zero total lessons', function() {
        var emptyProgress = new Progress(1, 1, 0);
        expect(emptyProgress.getProgressPercentage()).toBe(0);
        emptyProgress.completeLesson(1);
        expect(emptyProgress.getCompletedLessons()).toBe(0);
    });

    test('Convert to JSON', function() {
        progress.completeLesson(1);
        progress.completeLesson(2);
        progress.addTestScore(85);
        var json = progress.toJSON();
        expect(json.userId).toBe(1);
        expect(json.courseId).toBe(1);
        expect(json.completedLessons).toBe(2);
        expect(json.totalLessons).toBe(10);
        expect(json.progressPercent).toBe(20);
        expect(json.averageScore).toBe(85);
        expect(json.status).toBe('in_progress');
    });

});