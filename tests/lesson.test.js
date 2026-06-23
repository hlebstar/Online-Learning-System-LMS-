const Lesson = require('../src/models/Lesson');

describe('Lesson Tests', function() {

    test('Create lesson with valid data', function() {
        var lesson = new Lesson(1, 'Introduction to Robotics', 'Content text', 45, 1);
        expect(lesson.getId()).toBe(1);
        expect(lesson.getTitle()).toBe('Introduction to Robotics');
        expect(lesson.getContent()).toBe('Content text');
        expect(lesson.getDuration()).toBe(45);
        expect(lesson.getOrderNumber()).toBe(1);
    });

    test('Create lesson without id throws error', function() {
        expect(function() {
            new Lesson(null, 'Title');
        }).toThrow('ID и название урока обязательны');
    });

    test('Create lesson without title throws error', function() {
        expect(function() {
            new Lesson(1, null);
        }).toThrow('ID и название урока обязательны');
    });

    test('Create lesson with default values', function() {
        var lesson = new Lesson(1, 'Title');
        expect(lesson.getContent()).toBe('');
        expect(lesson.getDuration()).toBe(0);
        expect(lesson.getOrderNumber()).toBe(0);
    });

    test('Get formatted duration in minutes', function() {
        var lesson = new Lesson(1, 'Title', 'Content', 30, 1);
        expect(lesson.getFormattedDuration()).toBe('30 мин');
    });

    test('Get formatted duration in hours and minutes', function() {
        var lesson = new Lesson(1, 'Title', 'Content', 90, 1);
        expect(lesson.getFormattedDuration()).toBe('1 ч 30 мин');
    });

    test('Get formatted duration with 0 minutes', function() {
        var lesson = new Lesson(1, 'Title', 'Content', 0, 1);
        expect(lesson.getFormattedDuration()).toBe('0 мин');
    });

    test('Convert to JSON', function() {
        var lesson = new Lesson(1, 'Introduction', 'Content', 45, 1);
        var json = lesson.toJSON();
        expect(json).toEqual({
            id: 1,
            title: 'Introduction',
            content: 'Content',
            duration: 45,
            durationFormatted: '45 мин',
            orderNumber: 1
        });
    });

});