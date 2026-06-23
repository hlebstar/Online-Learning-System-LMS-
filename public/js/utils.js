// ============================================================
// УТИЛИТЫ (ТОСТЫ, КАЛЕНДАРЬ)
// ============================================================

let toastTimer;

function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('⚠️ Toast элемент не найден');
        return;
    }

    toast.textContent = message;
    toast.className = 'toast ' + (type || 'info');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
        toast.classList.remove('show');
    }, 4000);
}

function addToCalendar(title, type, courseTitle) {
    const userId = localStorage.getItem('userId') || 'default';
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    let events = JSON.parse(localStorage.getItem(`calendar_events_${userId}`) || '[]');

    const exists = events.some(e => e.title === title && e.date === dateStr);

    if (!exists) {
        const typeMap = { 'theory': 'lesson', 'test': 'test', 'task': 'lesson' };
        events.push({
            id: Date.now(),
            title: title,
            date: dateStr,
            type: typeMap[type] || 'lesson',
            course: courseTitle || '',
            completed: true
        });
        localStorage.setItem(`calendar_events_${userId}`, JSON.stringify(events));
        return true;
    }
    return false;
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

console.log('✅ utils.js загружен');