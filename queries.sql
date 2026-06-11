SELECT u.name, c.title, r.score 
FROM results r
JOIN users u ON r.user_id = u.id
JOIN courses c ON r.course_id = c.id;

-- ср балл по каждому курсу
SELECT c.title, AVG(r.score) as avg_score, COUNT(*) as total_students
FROM results r
JOIN courses c ON r.course_id = c.id
GROUP BY c.id;

-- ср балл
SELECT c.title, AVG(r.score) as avg_score
FROM results r
JOIN courses c ON r.course_id = c.id
GROUP BY c.id
HAVING AVG(r.score) > 75;

-- студенты без результатов
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN results r ON u.id = r.user_id
WHERE r.id IS NULL AND u.role = 'student';