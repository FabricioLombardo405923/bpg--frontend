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
  let yaRedirigido = false;

  window.onAuthStateChanged(window.auth, (user) => {
    const avatarBtn = document.querySelector(".user-avatar-btn");
    const userName = document.querySelector(".user-name");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const profileBtn = document.getElementById("profile-btn");
  
    if (user) {
      if (loginBtn) loginBtn.style.display = "none";
      if (profileBtn) profileBtn.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "block";

      const name = user.displayName || user.email;
      const photo = user.photoURL;
    
      if (avatarBtn) {
        if (photo) {
          avatarBtn.innerHTML = `
            <img src="${photo}" 
                alt="Avatar"
                style="width:30px;height:30px;border-radius:50%;object-fit:cover;vertical-align:middle;">
            <span class="user-name">${name}</span>
            <i class="fas fa-caret-down"></i>
          `;
        } else {
          avatarBtn.innerHTML = `
            👤 <span class="user-name">${name}</span>
            <i class="fas fa-caret-down"></i>
          `;
        }
      }

      if (!yaRedirigido && window.location.href.includes("login")) {
        yaRedirigido = true;
        showAlert(`¡Bienvenido ${name}!`, "success");
        setTimeout(() => loadPage("home"), 500);
      }

    } else {
      if (loginBtn) loginBtn.style.display = "block";
      if (profileBtn) profileBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (avatarBtn) {
        avatarBtn.innerHTML = `
          👤 <span class="user-name"></span>
          <i class="fas fa-caret-down"></i>
        `;
      }
    }
  });


    // =================================================================
    // FUNCIÓN DE LOGOUT GLOBAL
    // =================================================================
    window.logout = async function() {
      try {
        await window.signOut(window.auth);
        //showAlert("Sesión cerrada", "info");
        sessionStorage.removeItem('userId');
        loadPage("login");
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showAlert("Error al cerrar sesión", "error");
      }
    };

  });
})();