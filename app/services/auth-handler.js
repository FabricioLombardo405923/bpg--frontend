function initAuthHandler() {
  // Verificar si Firebase está listo
  if (typeof firebase === 'undefined' || !firebase.auth) {
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
    console.log('⚠ No se pudo cargar el avatar del usuario:', error);
  }
}

// =================================================================
// OBSERVER DE ESTADO DE AUTENTICACIÓN
// =================================================================
function setupAuthObserver() {
  firebase.auth().onAuthStateChanged(async (user) => {
    const loginBtn = document.getElementById('login-btn');
    const profileBtn = document.getElementById('profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameSpan = document.querySelector('.user-name');
    
    if (user) {
      
      // Usuario autenticado
      await ensureUserExists(user);
      
      // INICIALIZAR NOTIFICACIONES (FCM)
      try {
        if (window.notificacionesUI) {
          await window.notificacionesUI.inicializar(user.uid);
        }
      } catch (err) {
        console.warn('⚠ No se pudieron inicializar notificaciones', err);
      }
      
      // Actualizar UI del navbar
      if (loginBtn) loginBtn.style.display = 'none';
      if (profileBtn) profileBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (userNameSpan) userNameSpan.textContent = user.displayName || 'Usuario';
      
      // Actualizar botones del menú móvil
      const mobileLoginBtn = document.getElementById('mobile-login-btn');
      const mobileProfileBtn = document.getElementById('mobile-profile-btn');
      const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
      
      if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
      if (mobileProfileBtn) mobileProfileBtn.style.display = 'flex';
      if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'flex';
      
      // Guardar userId en sessionStorage
      sessionStorage.setItem('userId', user.uid);
      
      // Actualizar avatar desde el backend
      await updateUserAvatar(user);
      
      // Solo redirigir si estamos en páginas de auth
      const urlParams = new URLSearchParams(window.location.search);
      const currentPage = urlParams.get('page');
      
      if (currentPage === 'login' || currentPage === 'register' || currentPage === 'reset-password') {
        loadPage('home');
      }
    } else {
      console.log('❌ Usuario NO autenticado');
      
      // ❌ Usuario NO autenticado
      if (loginBtn) loginBtn.style.display = 'block';
      if (profileBtn) profileBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userNameSpan) userNameSpan.textContent = '';
      
      // Actualizar botones del menú móvil
      const mobileLoginBtn = document.getElementById('mobile-login-btn');
      const mobileProfileBtn = document.getElementById('mobile-profile-btn');
      const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
      
      if (mobileLoginBtn) mobileLoginBtn.style.display = 'flex';
      if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
      if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
      
      // Limpiar sessionStorage
      sessionStorage.removeItem('userId');
      
      // Detener notificaciones
      if (window.notificacionesUI) {
        window.notificacionesUI.detenerPolling?.();
      }
      
      // Resetear el botón de avatar
      const userAvatarBtn = document.querySelector('.user-avatar-btn');
      if (userAvatarBtn) {
        userAvatarBtn.innerHTML = `
          👤 <span class="user-name"></span> <i class="fas fa-caret-down"></i>
        `;
      }
      
      // Redirigir a login solo si estamos en páginas protegidas
      const urlParams = new URLSearchParams(window.location.search);
      const currentPage = urlParams.get('page');
      const protectedPages = ['perfil', 'favoritos', 'biblioteca'];
      
      if (protectedPages.includes(currentPage)) {
        loadPage('login');
      }
    }
  });
}

async function ensureUserExists(user) {
  try {
    const checkResponse = await fetch(`${window.API_BASE_URL}/usuarios/${user.uid}`);
    
    if (checkResponse.status === 404) {
      const AVATAR_STYLE = 'fun-emoji';
      const seed = `emoji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const initialData = {
        email: user.email,
        displayName: user.displayName || 'Usuario',
        avatar_url: seed,
        avatar_style: AVATAR_STYLE
      };
      
      const createResponse = await fetch(`${window.API_BASE_URL}/usuarios/${user.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initialData)
      });
      
      if (!createResponse.ok) {
        console.error('❌ Error creando usuario en BD:', await createResponse.text());
      } else {
        console.log('✅ Usuario creado en BD');
      }
    }
  } catch (error) {
    console.error('❌ Error verificando/creando usuario:', error);
  }
}

// =================================================================
// FUNCIÓN DE LOGOUT
// =================================================================
window.logout = async function() {
  try {
    await firebase.auth().signOut();
    
    if (window.notificacionesUI) {
      window.notificacionesUI.detenerPolling?.();
    }
    
    sessionStorage.removeItem('userId');
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
document.addEventListener('click', (e) => {
  const userAvatarBtn = document.querySelector('.user-avatar-btn');
  const userMenu = document.querySelector('.user-menu');
  
  if (!userAvatarBtn || !userMenu) return;
  
  if (userAvatarBtn.contains(e.target)) {
    e.stopPropagation();
    userMenu.classList.toggle('show');
  } else if (!userMenu.contains(e.target)) {
    userMenu.classList.remove('show');
  }
});

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