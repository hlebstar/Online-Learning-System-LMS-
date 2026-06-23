// ============================================================
// НАВИГАЦИЯ (ШАПКА + САЙДБАР)
// ============================================================

function updateSidebar() {
    const userName = localStorage.getItem('userName') || 'Пользователь';
    const userRole = localStorage.getItem('userRole') || 'student';

    const nameEl = document.getElementById('sidebarName');
    const avatarEl = document.getElementById('sidebarAvatar');
    const roleEl = document.getElementById('sidebarRole');

    if (nameEl) nameEl.textContent = userName;

    if (avatarEl) {
        const parts = userName.split(' ');
        if (parts.length >= 2) {
            avatarEl.textContent = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        } else {
            avatarEl.textContent = userName.substring(0, 2).toUpperCase();
        }
    }

    if (roleEl) {
        const roleMap = {
            'student': 'Студент',
            'teacher': 'Преподаватель',
            'curator': 'Куратор',
            'admin': 'Администратор'
        };
        roleEl.textContent = roleMap[userRole] || 'Пользователь';
    }
}

function initNav() {
    const userId = localStorage.getItem('userId');

    const guestNav = document.getElementById('guestNav');
    const userNav = document.getElementById('userNav');

    if (userId) {
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) {
            userNav.style.display = 'flex';
            const nameSpan = document.getElementById('userNameDisplay');
            if (nameSpan) nameSpan.textContent = localStorage.getItem('userName') || 'Пользователь';
        }
    } else {
        if (guestNav) guestNav.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }

    updateSidebar();
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

console.log('nav.js загружен');