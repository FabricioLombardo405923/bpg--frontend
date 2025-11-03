window.initializePerfil = function(async) {
  const user = window.auth.currentUser;
  const nombreInput = document.getElementById("perfil-nombre");
  const emailInput = document.getElementById("perfil-email");
  const fotoImg = document.getElementById("perfil-foto");
  const fotoInput = document.getElementById("foto-input");
  const cambiarFotoBtn = document.getElementById("cambiar-foto");
  const form = document.getElementById("perfil-form");
  const volverBtn = document.getElementById("volver-inicio");

  if (!user) {
    showNotification("Debes iniciar sesión para ver tu perfil.", "warning");
    loadPage("login");
    return;
  }

  // Mostrar datos actuales
  nombreInput.value = user.displayName || "";
  emailInput.value = user.email || "";
  fotoImg.src = user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Cambiar foto
  cambiarFotoBtn.addEventListener("click", () => fotoInput.click());
  fotoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
      const newPhotoURL = event.target.result;

      try {
        await window.updateProfile(user, { photoURL: newPhotoURL });
        fotoImg.src = newPhotoURL;
        showNotification("Foto actualizada ✅", "success");

        // Actualizar el icono del navbar
        const avatarBtn = document.querySelector(".user-avatar-btn");
        if (avatarBtn) {
          avatarBtn.innerHTML = `
            <img src="${newPhotoURL}" 
                 alt="Avatar" 
                 style="width:30px;height:30px;border-radius:50%;object-fit:cover;vertical-align:middle;">
            <span class="user-name">${user.displayName || user.email}</span>
            <i class="fas fa-caret-down"></i>
          `;
        }



      } catch (error) {
        console.error("Error actualizando foto:", error);
        showNotification("No se pudo actualizar la foto", "danger");
      }
    };
    
    reader.readAsDataURL(file);
  });

  // Guardar cambios de nombre
  form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nuevoNombre = nombreInput.value.trim();
  const nuevaContraseña = document.getElementById("perfil-password")?.value.trim();

  try {
    // ✅ Actualizar nombre
    if (nuevoNombre && nuevoNombre !== user.displayName) {
      await window.updateProfile(user, { displayName: nuevoNombre });
      showNotification("Nombre actualizado ✅", "success");

      // Actualizar nombre en navbar
      const userNameEl = document.querySelector(".user-name");
      if (userNameEl) userNameEl.textContent = nuevoNombre;
    }

    // ✅ Cambiar contraseña (si el campo no está vacío)
    if (nuevaContraseña) {
      await window.updatePassword(user, nuevaContraseña);
      showNotification("Contraseña actualizada ✅", "success");
    }

  } catch (error) {
    console.error("Error actualizando perfil:", error);

    // Errores comunes
    if (error.code === "auth/requires-recent-login") {
      showNotification("Debes volver a iniciar sesión para cambiar la contraseña.", "warning");
      loadPage("login");
    } else {
      showNotification("No se pudo actualizar el perfil 😕", "danger");
    }
  }
});

  // Cambiar foto
 cambiarFotoBtn.addEventListener("click", () => fotoInput.click());

fotoInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Reducir tamaño antes de convertir
    const resizedBase64 = await compressImageToBase64(file, 200, 200); // máximo 200x200 px

    // Actualizar en Firebase Auth
    await window.updateProfile(user, { photoURL: resizedBase64 });

    // Mostrar imagen nueva
    fotoImg.src = resizedBase64;
    showNotification("Foto actualizada ✅", "success");

    // Actualizar también el navbar
    const avatarBtn = document.querySelector(".user-avatar-btn");
    if (avatarBtn) {
      avatarBtn.innerHTML = `
        <img src="${resizedBase64}" 
             alt="Avatar" 
             style="width:30px;height:30px;border-radius:50%;object-fit:cover;vertical-align:middle;">
        <span class="user-name">${user.displayName || user.email}</span>
        <i class="fas fa-caret-down"></i>
      `;
    }

  } catch (error) {
    console.error("❌ Error al actualizar la foto:", error);
    showNotification("No se pudo actualizar la foto 😕", "danger");
  }


  reader.readAsDataURL(file);
 });

 
  // Volver al inicio
  volverBtn.addEventListener("click", () => loadPage("home"));
};

async function compressImageToBase64(file, maxWidth = 200, maxHeight = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Escalar proporcionalmente
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 (calidad 80%)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}