const User = require('../src/models/User');

describe('User Tests', function() {

    test('Create user with valid data', function() {
        var user = new User(1, 'Miranda Priestly', 'miranda@gmail.com', 'student');
        expect(user.getId()).toBe(1);
        expect(user.getName()).toBe('Miranda Priestly');
        expect(user.getEmail()).toBe('miranda@gmail.com');
        expect(user.getRole()).toBe('student');
    });

    test('Create user with default role', function() {
        var user = new User(2, 'Elizaveta Sergeevna', 'elizaveta@gmail.com');
        expect(user.getRole()).toBe('student');
    });

    test('Create user without id throws error', function() {
        expect(function() {
            new User(null, 'Name', 'email@gmail.com');
        }).toThrow('ID, имя и email обязательны');
    });

    test('Create user without name throws error', function() {
        expect(function() {
            new User(1, null, 'email@gmail.com');
        }).toThrow('ID, имя и email обязательны');
    });

    test('Create user without email throws error', function() {
        expect(function() {
            new User(1, 'Name', null);
        }).toThrow('ID, имя и email обязательны');
    });

    test('Check student role', function() {
        var user = new User(1, 'Miranda', 'miranda@gmail.com', 'student');
        expect(user.isStudent()).toBe(true);
        expect(user.isTeacher()).toBe(false);
        expect(user.isAdmin()).toBe(false);
    });

    test('Check teacher role', function() {
        var user = new User(2, 'Egor Olegovich', 'egor@gmail.com', 'teacher');
        expect(user.isTeacher()).toBe(true);
        expect(user.isStudent()).toBe(false);
        expect(user.isAdmin()).toBe(false);
    });

    test('Check admin role', function() {
        var user = new User(3, 'Admin', 'admin@gmail.com', 'admin');
        expect(user.isAdmin()).toBe(true);
        expect(user.isStudent()).toBe(false);
        expect(user.isTeacher()).toBe(false);
    });

    test('Convert to JSON', function() {
        var user = new User(1, 'Miranda Priestly', 'miranda@gmail.com', 'student');
        var json = user.toJSON();
        expect(json).toEqual({
            id: 1,
            name: 'Miranda Priestly',
            email: 'miranda@gmail.com',
            role: 'student'
        });
    });

});