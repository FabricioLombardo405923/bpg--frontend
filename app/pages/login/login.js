// =================================================================
// INICIALIZACIÓN DE LA PÁGINA DE LOGIN
// =================================================================

window.initializeLogin = function() {
  const form = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");
  const googleBtn = document.getElementById("google-login");
 
  // Login con email y contraseña
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = ""; // Limpiar errores previos
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      await window.signInWithEmailAndPassword(window.auth, email, password);
      showNotification("Iniciando sesión...", "info");
      // onAuthStateChanged (en app.js) se encargará de redirigir
    } catch (error) {
      let mensaje = "Ocurrió un error al iniciar sesión.";

      switch (error.code) {
        case "auth/user-not-found":
          mensaje = "El usuario no existe. Verificá tu correo electrónico o registrate.";
          break;
        case "auth/wrong-password":
          mensaje = "La contraseña es incorrecta. Intentá nuevamente.";
          break;
        case "auth/invalid-email":
          mensaje = "El correo ingresado no es válido.";
          break;
        case "auth/invalid-credential":
          mensaje = "Credenciales inválidas. Verificá tu correo y contraseña.";
          break;
        case "auth/too-many-requests":
          mensaje = "Demasiados intentos fallidos. Esperá un momento antes de volver a intentar.";
          break;
        case "auth/network-request-failed":
          mensaje = "Error de conexión. Verificá tu red e intentá de nuevo.";
          break;
      }

      errorMsg.textContent = mensaje;
      showNotification(mensaje, "danger");
    }
  });

  // Login con Google
  googleBtn.addEventListener("click", async () => {
    try {
      const provider = new window.GoogleAuthProvider();
      await window.signInWithPopup(window.auth, provider);
      showNotification("Iniciando sesión con Google...", "info");
      // onAuthStateChanged (en app.js) se encargará de redirigir
    } catch (error) {
      let mensaje = "Ocurrió un error al iniciar sesión con Google.";

      switch (error.code) {
        case "auth/popup-closed-by-user":
          mensaje = "Cerraste la ventana de inicio de sesión.";
          break;
        case "auth/cancelled-popup-request":
          mensaje = "Solicitud cancelada.";
          break;
        case "auth/network-request-failed":
          mensaje = "Error de conexión. Verificá tu red e intentá de nuevo.";
          break;
      }

      errorMsg.textContent = mensaje;
      showNotification(mensaje, "danger");
    }
  });
};