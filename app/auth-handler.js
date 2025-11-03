// =================================================================
// MANEJADOR GLOBAL DE AUTENTICACIÓN
// Este archivo debe cargarse DESPUÉS de Firebase y ANTES de app.js
// =================================================================

(function() {
  // Esperar a que Firebase esté disponible
  function waitForAuth(callback, maxAttempts = 50) {
    let attempts = 0;
    
    const check = () => {
      if (window.auth && window.onAuthStateChanged) {
        callback();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, 100);
      } else {
        console.error('❌ Firebase Auth no se cargó correctamente');
      }
    };
    
    check();
  }

  // Inicializar cuando Firebase esté listo
  waitForAuth(() => {
    
    const userName = document.querySelector(".user-name");
    const userMenu = document.querySelector(".user-menu");
    const avatarBtn = document.querySelector(".user-avatar-btn");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const profileBtn = document.getElementById("profile-btn");

    // =================================================================
    // MENÚ DESPLEGABLE DEL USUARIO
    // =================================================================
    if (avatarBtn && userMenu) {
      avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userMenu.classList.toggle("show");
      });

      // Cerrar el menú si se hace clic fuera
      document.addEventListener("click", () => {
        userMenu.classList.remove("show");
      });
    }

    // =================================================================
    // OBSERVADOR DE ESTADO DE AUTENTICACIÓN
    // =================================================================
    window.onAuthStateChanged(window.auth, (user) => {
      
      if (user) {
        // Usuario logueado
        if (userName) userName.textContent = user.displayName || user.email;
        if (loginBtn) loginBtn.style.display = "none";
        if (profileBtn) profileBtn.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "block";

        // Redirigir solo si está en páginas de autenticación
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');
        
        if (currentPage === "login" || currentPage === "register") {
          showNotification(`¡Bienvenido ${user.displayName || user.email}! 👋`, "success");
          setTimeout(() => {
            loadPage("home");
          }, 500);
        }
      } else {
        // Usuario deslogueado
        if (userName) userName.textContent = "";
        if (loginBtn) loginBtn.style.display = "block";
        if (profileBtn) profileBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
      }
    });

    // =================================================================
    // FUNCIÓN DE LOGOUT GLOBAL
    // =================================================================
    window.logout = async function() {
      try {
        await window.signOut(window.auth);
        showNotification("Sesión cerrada", "info");
        loadPage("login");
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification("Error al cerrar sesión", "danger");
      }
    };

   
  });
})();