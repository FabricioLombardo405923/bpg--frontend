let currentUser = null;
let userProfile = null;
let isEditMode = false;

// Solo usamos Fun Emoji de DiceBear
const AVATAR_STYLE = 'fun-emoji';

// Función para generar URL de DiceBear
function getDiceBearUrl(seed) {
    return `https://api.dicebear.com/7.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;
}

// Mapeo de códigos de país a nombres
const PAISES = {
    'AR': 'Argentina',
    'BR': 'Brasil',
    'CL': 'Chile',
    'CO': 'Colombia',
    'MX': 'México',
    'PE': 'Perú',
    'UY': 'Uruguay',
    'VE': 'Venezuela',
    'ES': 'España',
    'US': 'Estados Unidos',
    'OTHER': 'Otro'
};

// =================================================================
// INICIALIZACIÓN
// =================================================================
window.initializePerfil = async function() {
    await waitForAuth();
    
    currentUser = window.auth.currentUser;
    if (!currentUser) {
        showAlert('Debes iniciar sesión para ver tu perfil', 'error');
        loadPage('login');
        return;
    }
    
    setupEventListeners();
    await loadUserProfile();
};

function waitForAuth() {
    return new Promise((resolve) => {
        if (window.auth && window.auth.currentUser) {
            resolve();
            return;
        }
        
        // Si no, esperar al observer
        if (!window.auth || !window.onAuthStateChanged) {
            // Firebase no está listo, esperar
            const checkAuth = setInterval(() => {
                if (window.auth && window.onAuthStateChanged) {
                    clearInterval(checkAuth);
                    
                    // Configurar listener temporal
                    const unsubscribe = window.onAuthStateChanged(window.auth, (user) => {
                        unsubscribe(); // Desuscribirse después de la primera verificación
                        resolve();
                    });
                }
            }, 50);
        } else {
            // Firebase está listo, configurar listener temporal
            const unsubscribe = window.onAuthStateChanged(window.auth, (user) => {
                unsubscribe();
                resolve();
            });
        }
    });
}

// =================================================================
// CARGA DE DATOS
// =================================================================
async function loadUserProfile() {
    try {
        showLoading(true);
        
        const response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`);
        
        if (response.ok) {
            const result = await response.json();
            userProfile = result.data;
        } else if (response.status === 404) {
            // Usuario no existe en BD, crear perfil inicial
           // console.log('⚠️ Usuario no encontrado en BD, creando perfil inicial...');
            const created = await createInitialProfile();
            
            // Si falló la creación, usar datos de Firebase
            if (!created && !userProfile) {
                //console.log('⚠️ Usando datos de Firebase como fallback');
                displayFirebaseData();
            }
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        // VALIDACIÓN: Asegurarse de que userProfile existe
        if (!userProfile) {
            //console.log('⚠️ userProfile es null, usando datos de Firebase');
            displayFirebaseData();
        }
        
        // Renderizar perfil
        renderProfile();
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        
        // Mostrar datos básicos de Firebase como fallback
        displayFirebaseData();
        
        // Intentar renderizar con datos de Firebase
        try {
            renderProfile();
        } catch (renderError) {
            console.error('❌ Error renderizando perfil:', renderError);
            showAlert('Error al cargar el perfil. Por favor, recarga la página.', 'error');
        }
        showAlert('Error al cargar algunos datos del perfil', 'warning');
    } finally {
        showLoading(false);
    }
}

async function createInitialProfile() {
    try {
        // Generar seed aleatorio para el avatar inicial
        const seed = generateRandomSeed();
        
        const initialData = {
            email: currentUser.email,
            displayName: currentUser.displayName || 'Usuario',
            avatar_url: seed,
            avatar_style: AVATAR_STYLE
        };
        
        const response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(initialData)
        });
        
        if (response.ok) {
            const result = await response.json();
            userProfile = result.data;
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Error en respuesta:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Error creando perfil inicial:', error);
        return false;
    }
}

function displayFirebaseData() {
    // Mostrar datos básicos de Firebase
    userProfile = {
        displayName: currentUser.displayName || 'Usuario',
        email: currentUser.email,
        avatar_url: seed,
        avatar_style: AVATAR_STYLE,
        telefono: null,
        nacionalidad: null,
        biografia: null
    };
    //console.log('ℹ️ Usando datos de Firebase:', userProfile);
}

// =================================================================
// RENDERIZADO
// =================================================================
function renderProfile() {
    // VALIDACIÓN: Verificar que userProfile existe
    if (!userProfile) {
        console.error('❌ renderProfile: userProfile es null');
        return;
    }
    
    // Header
    document.getElementById('perfil-display-name').textContent = userProfile.displayName || 'Usuario';
    document.getElementById('perfil-email').textContent = userProfile.email || currentUser.email || 'Sin email';
    
    // Avatar
    const avatarDisplay = document.getElementById('avatar-display');
    const seed = userProfile.avatar_url || generateRandomSeed();
    const avatarUrl = getDiceBearUrl(seed);
    avatarDisplay.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="avatar-img">`;
    
    // Vista de información
    document.getElementById('view-displayName').textContent = userProfile.displayName || '-';
    document.getElementById('view-email').textContent = userProfile.email || currentUser.email || '-';
    document.getElementById('view-telefono').textContent = userProfile.telefono || '-';
    document.getElementById('view-nacionalidad').textContent = 
        userProfile.nacionalidad ? (PAISES[userProfile.nacionalidad] || userProfile.nacionalidad) : '-';
    document.getElementById('view-biografia').textContent = userProfile.biografia || '-';
    
    // Información de seguridad
    renderSecurityInfo();
}

function renderSecurityInfo() {
    const provider = currentUser.providerData[0];
    const providerName = provider ? getProviderName(provider.providerId) : 'Email/Contraseña';
    document.getElementById('auth-provider').textContent = providerName;
    
    const creationDate = new Date(currentUser.metadata.creationTime);
    document.getElementById('creation-date').textContent = creationDate.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getProviderName(providerId) {
    const providers = {
        'password': 'Email/Contraseña',
        'google.com': 'Google',
        'facebook.com': 'Facebook',
        'twitter.com': 'Twitter'
    };
    return providers[providerId] || providerId;
}

// =================================================================
// EDICIÓN DE PERFIL
// =================================================================
function enterEditMode() {
    isEditMode = true;
    
    // Ocultar vista y mostrar formulario
    document.getElementById('profile-view').style.display = 'none';
    document.getElementById('profile-edit').style.display = 'block';
    
    // Poblar formulario con datos actuales
    document.getElementById('edit-displayName').value = userProfile.displayName || '';
    document.getElementById('edit-telefono').value = userProfile.telefono || '';
    document.getElementById('edit-nacionalidad').value = userProfile.nacionalidad || '';
    document.getElementById('edit-biografia').value = userProfile.biografia || '';
    
    // Actualizar contador de caracteres
    updateCharCounter();
    
    // Cambiar botón
    const editBtn = document.getElementById('edit-profile-btn');
    editBtn.style.display = 'none';
}

function exitEditMode() {
    isEditMode = false;
    
    // Mostrar vista y ocultar formulario
    document.getElementById('profile-view').style.display = 'block';
    document.getElementById('profile-edit').style.display = 'none';
    
    // Mostrar botón
    const editBtn = document.getElementById('edit-profile-btn');
    editBtn.style.display = 'flex';
}

async function saveProfile(formData) {
    try {
        showLoading(true);
        
        const updates = {
            displayName: formData.get('displayName'),
            telefono: formData.get('telefono') || null,
            nacionalidad: formData.get('nacionalidad') || null,
            biografia: formData.get('biografia') || null
        };
        
        
        // Intentar PATCH primero
        let response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        
        // Si no existe (404), crear con POST
        if (response.status === 404) {
            const createData = {
                email: currentUser.email,
                avatar_url: userProfile?.avatar_url || generateRandomSeed(),
                avatar_style: AVATAR_STYLE,
                ...updates
            };
            
            response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createData)
            });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', response.status, errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        userProfile = result.data;
        
        
        // Actualizar displayName en Firebase si cambió
        if (updates.displayName !== currentUser.displayName) {
            await window.updateProfile(currentUser, {
                displayName: updates.displayName
            });
        }
        
        // Re-renderizar y salir del modo edición
        renderProfile();
        exitEditMode();
        showAlert('¡Perfil actualizado!', 'success');
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        showAlert('Error al guardar el perfil: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// =================================================================
// CAMBIO DE AVATAR
// =================================================================
function generateRandomSeed() {
    // Genera un seed aleatorio único
    return `emoji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateEmojiGrid() {
    const grid = document.getElementById('emoji-grid');
    grid.innerHTML = '';
    
    // Generar 12 opciones aleatorias de Fun Emoji
    for (let i = 0; i < 12; i++) {
        const seed = generateRandomSeed();
        const option = document.createElement('div');
        option.className = 'avatar-option';
        option.onclick = () => selectAvatar(seed);
        
        const avatarUrl = getDiceBearUrl(seed);
        
        option.innerHTML = `
            <img src="${avatarUrl}" alt="Emoji ${i+1}" class="avatar-preview">
        `;
        
        grid.appendChild(option);
    }
    
    // Agregar botón para generar más opciones
    const refreshBtn = document.createElement('div');
    refreshBtn.className = 'avatar-option avatar-refresh';
    refreshBtn.onclick = generateEmojiGrid;
    refreshBtn.innerHTML = `
        <i class="fas fa-sync-alt"></i>
        <span class="avatar-label">Más opciones</span>
    `;
    grid.appendChild(refreshBtn);
}

async function selectAvatar(seed) {
    try {
        showLoading(true);
        closeAvatarModal();
        
        let response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                avatar_url: seed,
                avatar_style: AVATAR_STYLE
            })
        });
        
        // Si no existe (404), crear con POST
        if (response.status === 404) {
            response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentUser.email,
                    displayName: currentUser.displayName || 'Usuario',
                    avatar_url: seed,
                    avatar_style: AVATAR_STYLE
                })
            });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', response.status, errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        userProfile = result.data;
        
        // Actualizar vista
        const avatarDisplay = document.getElementById('avatar-display');
        const avatarUrl = getDiceBearUrl(seed);
        avatarDisplay.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="avatar-img">`;
        
        // Actualizar avatar en navbar
        if (window.updateUserAvatar) {
            await window.updateUserAvatar(currentUser);
        }
        
        showAlert('¡Avatar actualizado!', 'success');
    } catch (error) {
        console.error('❌ Error cambiando avatar:', error);
        showAlert('Error al cambiar el avatar: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function openAvatarModal() {
    document.getElementById('avatar-modal').style.display = 'flex';
}

function closeAvatarModal() {
    document.getElementById('avatar-modal').style.display = 'none';
}

// =================================================================
// CAMBIO DE CONTRASEÑA
// =================================================================
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validar contraseñas
    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Verificar si el usuario usa email/contraseña
    const isPasswordProvider = currentUser.providerData.some(
        provider => provider.providerId === 'password'
    );
    
    if (!isPasswordProvider) {
        showAlert('No puedes cambiar la contraseña porque iniciaste sesión con un proveedor externo', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        await window.updatePassword(currentUser, newPassword);
        
        // Limpiar formulario
        document.getElementById('change-password-form').reset();
        showAlert('¡Contraseña actualizada correctamente!', 'success');
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        let mensaje = 'Error al cambiar la contraseña';
        
        if (error.code === 'auth/requires-recent-login') {
            mensaje = 'Por seguridad, debes volver a iniciar sesión para cambiar tu contraseña';
        }
        
        showAlert(mensaje, 'error');
    } finally {
        showLoading(false);
    }
}

// =================================================================
// NAVEGACIÓN DE TABS
// =================================================================
function switchTab(tabName) {
    // Desactivar todos los tabs y contenidos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activar tab seleccionado
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// =================================================================
// EVENT LISTENERS
// =================================================================
function setupEventListeners() {
    // Botón editar perfil
    document.getElementById('edit-profile-btn').addEventListener('click', enterEditMode);
    
    // Botón cancelar edición
    document.getElementById('cancel-edit-btn').addEventListener('click', exitEditMode);
    
    // Formulario de edición
    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await saveProfile(formData);
    });
    
    // Contador de caracteres en biografía
    const bioTextarea = document.getElementById('edit-biografia');
    bioTextarea.addEventListener('input', updateCharCounter);
    
    // Botón cambiar avatar
    document.getElementById('change-avatar-btn').addEventListener('click', () => {
        generateEmojiGrid(); // Generar grid cuando se abre el modal
        openAvatarModal();
    });
    
    // Cerrar modal al hacer click fuera
    document.getElementById('avatar-modal').addEventListener('click', (e) => {
        if (e.target.id === 'avatar-modal') {
            closeAvatarModal();
        }
    });
    
    // Tabs de navegación
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
    
    // Formulario de cambio de contraseña
    document.getElementById('change-password-form').addEventListener('submit', handlePasswordChange);
}

// =================================================================
// UTILIDADES
// =================================================================
function updateCharCounter() {
    const bioTextarea = document.getElementById('edit-biografia');
    const counter = document.getElementById('bio-count');
    counter.textContent = bioTextarea.value.length;
}

function showLoading(show) {
    const overlay = document.getElementById('profile-loading');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// ================================================================
// ELIMINAR CUENTA
// ================================================================
window.deleteAccount = async function () {
    const user = auth.currentUser;
    if (!user) {
        showAlert("No hay usuario autenticado", "danger");
        return;
    }
    
    // Mostrar modal de confirmación
    const modal = new ConfirmModal();
    const confirmed = await modal.confirm(
        "Eliminar cuenta",
        "¿Estás seguro? Esta acción no se puede deshacer."
    );
    
    if (!confirmed) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${window.API_BASE_URL}/usuarios/${sessionStorage.getItem('userId')}`, {
            method: "DELETE"
        });
        
        if (!response.ok) throw new Error("Error al eliminar los datos del servidor");
        
        await window.deleteUserFirebase(user);
        sessionStorage.removeItem("userId");
        loadPage("home");
        showAlert("Cuenta eliminada correctamente", "success");
    } catch (error) {
        console.error("❌ Error al eliminar cuenta:", error);
        if (error.code === "auth/requires-recent-login") {
            showAlert("Debes volver a iniciar sesión para eliminar tu cuenta.", "warning");
        } else {
            showAlert("Error eliminando la cuenta", "error");
        }
    } finally {
        showLoading(false);
    }
};

// Exponer funciones globales
window.closeAvatarModal = closeAvatarModal;