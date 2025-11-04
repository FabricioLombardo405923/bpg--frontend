window.initializeRegister = function() {
  const form = document.getElementById("register-form");
  const errorMsg = document.getElementById("register-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = ""; // Limpiar errores previos
    
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const password2 = document.getElementById("register-password2").value;

    // Validaciones
    if (!name) {
      errorMsg.textContent = "El nombre de usuario es obligatorio";
      return;
    }

    if (password !== password2) {
      errorMsg.textContent = "Las contraseñas no coinciden";
      return;
    }

    if (password.length < 6) {
      errorMsg.textContent = "La contraseña debe tener al menos 6 caracteres";
      return;
    }

    try {
      const userCredential = await window.createUserWithEmailAndPassword(
        window.auth, 
        email, 
        password
      );
      const user = userCredential.user;

      // Guardar el nombre en el perfil del usuario
      await window.updateProfile(user, { displayName: name });

      showAlert(`¡Cuenta creada con éxito! Bienvenido ${name}`, "success");
      // onAuthStateChanged (en auth-handler.js) se encargará de redirigir
      
    } catch (error) {
      let mensaje = "No se pudo crear la cuenta.";

      switch (error.code) {
        case "auth/email-already-in-use":
          mensaje = "Este correo ya está registrado. Intentá iniciar sesión.";
          break;
        case "auth/invalid-email":
          mensaje = "El correo electrónico no es válido.";
          break;
        case "auth/weak-password":
          mensaje = "La contraseña es demasiado débil (mínimo 6 caracteres).";
          break;
        case "auth/network-request-failed":
          mensaje = "Error de conexión. Verificá tu red e intentá nuevamente.";
          break;
        case "auth/operation-not-allowed":
          mensaje = "El registro de usuarios está deshabilitado.";
          break;
        default:
          mensaje = `Ocurrió un error inesperado: ${error.message}`;
          break;
      }

      errorMsg.textContent = mensaje;
      showAlert(mensaje, "danger");
    }
  });
};