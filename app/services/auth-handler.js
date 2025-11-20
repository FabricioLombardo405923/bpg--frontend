function initAuthHandler() {
    // Verificar si Firebase está listo
    if (!window.auth || !window.onAuthStateChanged) {
        setTimeout(initAuthHandler, 100);
        return;
    }

    setupAuthObserver();
}

// =================================================================
// FUNCIÓN PARA ACTUALIZAR AVATAR EN NAVBAR
// =================================================================

async function updateUserAvatar(user) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/usuarios/${user.uid}`);
        
        if (response.ok) {
            const result = await response.json();
            const profile = result.data;
            
            if (profile.avatar_style && profile.avatar_url) {
                const avatarUrl = `https://api.dicebear.com/7.x/${profile.avatar_style}/svg?seed=${encodeURIComponent(profile.avatar_url)}`;
                
                const userAvatarBtn = document.querySelector('.user-avatar-btn');
                if (userAvatarBtn) {
                    userAvatarBtn.innerHTML = `
                        <img src="${avatarUrl}" alt="Avatar" style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            object-fit: cover;
                            margin-right: 0.5rem;
                            border: 2px solid rgba(255, 255, 255, 0.2);
                        ">
                        <span class="user-name">${profile.displayName}</span>
                        <i class="fas fa-caret-down"></i>
                    `;
                }
            } else {
                const userAvatarBtn = document.querySelector('.user-avatar-btn');
                if (userAvatarBtn) {
                    const userName = userAvatarBtn.querySelector('.user-name');
                    if (userName) {
                        userName.textContent = user.displayName || 'Usuario';
                    }
                }
            }
        }
    } catch (error) {
        console.log('⚠️ No se pudo cargar el avatar del usuario:', error);
    }
}

// =================================================================
// OBSERVER DE ESTADO DE AUTENTICACIÓN
// =================================================================

function setupAuthObserver() {
    window.onAuthStateChanged(window.auth, async (user) => {
        const loginBtn = document.getElementById('login-btn');
        const profileBtn = document.getElementById('profile-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userNameSpan = document.querySelector('.user-name');

        if (user) {
            // ✅ Usuario autenticado
            
            // Actualizar UI del navbar
            if (loginBtn) loginBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = user.displayName || 'Usuario';

            // Guardar userId en sessionStorage
            sessionStorage.setItem('userId', user.uid);

            // Actualizar avatar desde el backend
            await updateUserAvatar(user);

            // **CAMBIO IMPORTANTE**: Solo redirigir si estamos en páginas de auth
            // NO redirigir si ya estamos en una página autenticada
            const urlParams = new URLSearchParams(window.location.search);
            const currentPage = urlParams.get('page');
            
            // Solo redirigir desde páginas de autenticación al home
            if (currentPage === 'login' || currentPage === 'register' || currentPage === 'reset-password') {
                loadPage('home');
            }

        } else {
            // ❌ Usuario NO autenticado
            
            // Actualizar UI del navbar
            if (loginBtn) loginBtn.style.display = 'block';
            if (profileBtn) profileBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userNameSpan) userNameSpan.textContent = '';

            // Limpiar sessionStorage
            sessionStorage.removeItem('userId');

            // Resetear el botón de avatar al estado por defecto
            const userAvatarBtn = document.querySelector('.user-avatar-btn');
            if (userAvatarBtn) {
                userAvatarBtn.innerHTML = `
                    👤 <span class="user-name"></span> <i class="fas fa-caret-down"></i>
                `;
            }

            // **CAMBIO IMPORTANTE**: Redirigir a login solo si estamos en páginas protegidas
            const urlParams = new URLSearchParams(window.location.search);
            const currentPage = urlParams.get('page');
            const protectedPages = ['perfil', 'favoritos', 'biblioteca'];
            
            if (protectedPages.includes(currentPage)) {
                //showAlert('Debes iniciar sesión para acceder a esta página', 'warning');
                loadPage('login');
            }
        }
    });
}

// =================================================================
// FUNCIÓN DE LOGOUT
// =================================================================

window.logout = async function() {
    try {        
        await window.signOut(window.auth);
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('userId');

        // Redirigir a home
        loadPage('home');
        
        showAlert('Sesión cerrada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        showAlert('Error al cerrar sesión', 'danger');
    }
};

// =================================================================
// MANEJO DEL MENÚ DE USUARIO
// =================================================================

// Toggle del menú de usuario
document.addEventListener('click', (e) => {
    const userAvatarBtn = document.querySelector('.user-avatar-btn');
    const userMenu = document.querySelector('.user-menu');
    
    if (!userAvatarBtn || !userMenu) return;

    if (userAvatarBtn.contains(e.target)) {
        e.stopPropagation();
        userMenu.classList.toggle('show');
    } 
    else if (!userMenu.contains(e.target)) {
        userMenu.classList.remove('show');
    }
});

// Cerrar menú al hacer click en una opción
document.addEventListener('click', (e) => {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && userMenu.contains(e.target)) {
        if (e.target.tagName === 'BUTTON') {
            userMenu.classList.remove('show');
        }
    }
});

// =================================================================
// INICIALIZACIÓN
// =================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthHandler);
} else {
    initAuthHandler();
}

// Exponer funciones globales
window.updateUserAvatar = updateUserAvatar;