window.initializeLogin = function () {
  const form = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");
  const googleBtn = document.getElementById("google-login");

  // ================= LOGIN EMAIL =================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      await window.signInWithEmailAndPassword(email, password);
      sessionStorage.setItem("userId", window.auth.currentUser.uid);
      // onAuthStateChanged se encarga de redirigir
    } catch (error) {
      mostrarError(error, errorMsg);
    }
  });

  // ================= LOGIN GOOGLE =================
  googleBtn.addEventListener("click", async () => {
    try {
      await window.signInWithGoogle();
      sessionStorage.setItem("userId", window.auth.currentUser.uid);
    } catch (error) {
      mostrarError(error, errorMsg, true);
    }
  });
};

// ================= MANEJO DE ERRORES =================
function mostrarError(error, errorMsg, esGoogle = false) {
  let mensaje = esGoogle
    ? "Ocurrió un error al iniciar sesión con Google."
    : "Ocurrió un error al iniciar sesión.";

  switch (error.code) {
    case "auth/user-not-found":
      mensaje = "El usuario no existe. Verificá tu correo o registrate.";
      break;
    case "auth/wrong-password":
      mensaje = "La contraseña es incorrecta.";
      break;
    case "auth/invalid-email":
      mensaje = "El correo ingresado no es válido.";
      break;
    case "auth/invalid-credential":
      mensaje = "Credenciales inválidas.";
      break;
    case "auth/too-many-requests":
      mensaje = "Demasiados intentos. Esperá unos minutos.";
      break;
    case "auth/network-request-failed":
      mensaje = "Error de conexión. Verificá tu red.";
      break;
    case "auth/popup-closed-by-user":
      mensaje = "Cerraste la ventana de inicio de sesión.";
      break;
    case "auth/cancelled-popup-request":
      mensaje = "Solicitud cancelada.";
      break;
  }

  errorMsg.textContent = mensaje;
  if (typeof showAlert === "function") {
    showAlert(mensaje, "error");
  }

  console.error("🔥 Firebase Auth Error:", error);
}
