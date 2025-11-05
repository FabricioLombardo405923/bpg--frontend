function initAuthHandler() {
    // Verificar si Firebase está listo
    if (!window.auth || !window.onAuthStateChanged) {
        //console.log('⏳ Esperando a que Firebase se inicialice...');
        setTimeout(initAuthHandler, 100);
        return;
    }

    //console.log('✅ Firebase listo, configurando auth handler...');
    setupAuthObserver();
}

// =================================================================
// FUNCIÓN PARA ACTUALIZAR AVATAR EN NAVBAR
// =================================================================

/**
 * Actualizar el avatar del usuario en el navbar
 */
async function updateUserAvatar(user) {
    try {
        // Obtener perfil del backend
        const response = await fetch(`${window.API_BASE_URL}/usuarios/${user.uid}`);
        
        if (response.ok) {
            const result = await response.json();
            const profile = result.data;
            
            // Si tiene avatar configurado, mostrarlo
            if (profile.avatar_style && profile.avatar_url) {
                const avatarUrl = `https://api.dicebear.com/7.x/${profile.avatar_style}/svg?seed=${encodeURIComponent(profile.avatar_url)}`;
                
                // Actualizar el botón del navbar con la imagen
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
                // Si no tiene avatar, mostrar emoji por defecto
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
        // No es crítico, la app puede funcionar sin avatar
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
           // console.log('👤 Usuario autenticado:', user.email);
            
            // Actualizar UI del navbar
            if (loginBtn) loginBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = user.displayName || 'Usuario';

            // Actualizar avatar desde el backend
            await updateUserAvatar(user);

            // Si está en página de login/register, redirigir a home
            const urlParams = new URLSearchParams(window.location.search);
            const currentPage = urlParams.get('page');
            
            if (currentPage === 'login' || currentPage === 'register' || currentPage === 'reset-password') {
                loadPage('home');
            }

        } else {
            // Actualizar UI del navbar
            if (loginBtn) loginBtn.style.display = 'block';
            if (profileBtn) profileBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userNameSpan) userNameSpan.textContent = '';

            // Resetear el botón de avatar al estado por defecto
            const userAvatarBtn = document.querySelector('.user-avatar-btn');
            if (userAvatarBtn) {
                userAvatarBtn.innerHTML = `
                    👤 <span class="user-name"></span> <i class="fas fa-caret-down"></i>
                `;
            }
        }
    });

    //console.log('✅ Auth observer configurado');
}

// =================================================================
// FUNCIÓN DE LOGOUT
// =================================================================

window.logout = async function() {
    try {        
        await window.signOut(window.auth);

        // Redirigir a home
        loadPage('home');
        
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

    // Si se hace click en el botón de usuario
    if (userAvatarBtn.contains(e.target)) {
        e.stopPropagation();
        userMenu.classList.toggle('show');
    } 
    // Si se hace click fuera del menú, cerrarlo
    else if (!userMenu.contains(e.target)) {
        userMenu.classList.remove('show');
    }
});

// Cerrar menú al hacer click en una opción
document.addEventListener('click', (e) => {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && userMenu.contains(e.target)) {
        // Si se hizo click en un botón del menú
        if (e.target.tagName === 'BUTTON') {
            userMenu.classList.remove('show');
        }
    }
});

// =================================================================
// INICIALIZACIÓN
// =================================================================

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthHandler);
} else {
    // El DOM ya está listo
    initAuthHandler();
}

// Exponer funciones globales
window.updateUserAvatar = updateUserAvatar;