window.initializeResetPassword = function() {
  const form = document.getElementById("reset-form");
  const msg = document.getElementById("reset-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const email = document.getElementById("reset-email").value;

    try {
      const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js");
      await sendPasswordResetEmail(window.auth, email);
      msg.style.color = "green";
      msg.textContent = "📩 Te enviamos un enlace para restablecer tu contraseña.";
      showAlert("Correo de recuperación enviado", "success");
    } catch (error) {
      let mensaje = "Ocurrió un error al enviar el correo.";
      switch (error.code) {
        case "auth/user-not-found":
          mensaje = "No existe una cuenta con ese correo.";
          break;
        case "auth/invalid-email":
          mensaje = "El correo ingresado no es válido.";
          break;
        case "auth/network-request-failed":
          mensaje = "Error de conexión. Intentá nuevamente.";
          break;
      }
      msg.style.color = "red";
      msg.textContent = mensaje;
      showAlert(mensaje, "error");
    }
  });
};