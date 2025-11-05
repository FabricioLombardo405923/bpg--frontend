// =================================================================
// VARIABLES GLOBALES
// =================================================================

let currentUser = null;
let userProfile = null;
let isEditMode = false;

// Alias para showNotification
const showNotification = window.showAlert || function(msg, type) {
    console.log(`[${type}] ${msg}`);
};

// Estilos de avatares de DiceBear disponibles
const AVATAR_STYLES = [
    { id: 'adventurer', name: 'Aventurero' },
    { id: 'adventurer-neutral', name: 'Aventurero Neutral' },
    { id: 'avataaars', name: 'Avataaars' },
    { id: 'avataaars-neutral', name: 'Avataaars Neutral' },
    { id: 'big-ears', name: 'Orejas Grandes' },
    { id: 'big-ears-neutral', name: 'Orejas Grandes Neutral' },
    { id: 'big-smile', name: 'Gran Sonrisa' },
    { id: 'bottts', name: 'Robots' },
    { id: 'bottts-neutral', name: 'Robots Neutral' },
    { id: 'croodles', name: 'Croodles' },
    { id: 'croodles-neutral', name: 'Croodles Neutral' },
    { id: 'fun-emoji', name: 'Emoji Divertido' },
    { id: 'icons', name: 'Iconos' },
    { id: 'identicon', name: 'Identicon' },
    { id: 'lorelei', name: 'Lorelei' },
    { id: 'lorelei-neutral', name: 'Lorelei Neutral' },
    { id: 'micah', name: 'Micah' },
    { id: 'miniavs', name: 'Mini Avatares' },
    { id: 'notionists', name: 'Notionists' },
    { id: 'notionists-neutral', name: 'Notionists Neutral' },
    { id: 'open-peeps', name: 'Open Peeps' },
    { id: 'personas', name: 'Personas' },
    { id: 'pixel-art', name: 'Pixel Art' },
    { id: 'pixel-art-neutral', name: 'Pixel Art Neutral' }
];

// Función para generar URL de DiceBear
function getDiceBearUrl(style, seed) {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
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
    console.log('🎮 Inicializando página de perfil...');
    
    // Verificar autenticación
    currentUser = window.auth.currentUser;
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión para ver tu perfil', 'error');
        loadPage('login');
        return;
    }

    // Configurar event listeners
    setupEventListeners();
    
    // Cargar datos del perfil
    await loadUserProfile();
    
    // Cargar estadísticas
    await loadUserStats();
};

// =================================================================
// CARGA DE DATOS
// =================================================================

async function loadUserProfile() {
    try {
        showLoading(true);
        
        console.log('📡 Cargando perfil de usuario:', currentUser.uid);
        
        // Obtener perfil del backend
        const response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`);
        
        if (response.ok) {
            const result = await response.json();
            userProfile = result.data;
            console.log('✅ Perfil cargado desde BD:', userProfile);
        } else if (response.status === 404) {
            // Usuario no existe en BD, crear perfil inicial
            console.log('⚠️ Usuario no encontrado en BD, creando perfil inicial...');
            const created = await createInitialProfile();
            
            // Si falló la creación, usar datos de Firebase
            if (!created && !userProfile) {
                console.log('⚠️ Usando datos de Firebase como fallback');
                displayFirebaseData();
            }
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        // VALIDACIÓN: Asegurarse de que userProfile existe
        if (!userProfile) {
            console.log('⚠️ userProfile es null, usando datos de Firebase');
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
            showNotification('Error al cargar el perfil. Por favor, recarga la página.', 'error');
        }
        
        showNotification('Error al cargar algunos datos del perfil', 'warning');
    } finally {
        showLoading(false);
    }
}

async function createInitialProfile() {
    try {
        console.log('📝 Creando perfil inicial para:', currentUser.uid);
        
        const initialData = {
            email: currentUser.email,
            displayName: currentUser.displayName || 'Usuario',
            avatar_url: currentUser.email || 'default',
            avatar_style: 'avataaars'
        };
        
        console.log('📤 Enviando datos:', initialData);
        
        const response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(initialData)
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            userProfile = result.data;
            console.log('✅ Perfil inicial creado:', userProfile);
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
        avatar_url: currentUser.email || 'default',
        avatar_style: 'avataaars',
        telefono: null,
        nacionalidad: null,
        biografia: null
    };
    console.log('ℹ️ Usando datos de Firebase:', userProfile);
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
    
    // Avatar - Usar DiceBear
    const avatarDisplay = document.getElementById('avatar-display');
    const style = userProfile.avatar_style || 'avataaars';
    const seed = userProfile.avatar_url || userProfile.email || currentUser.email || 'default';
    
    // Crear imagen de DiceBear
    const avatarUrl = getDiceBearUrl(style, seed);
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
// ESTADÍSTICAS
// =================================================================

async function loadUserStats() {
    try {
        // Calcular días desde creación
        const creationDate = new Date(currentUser.metadata.creationTime);
        const today = new Date();
        const diffTime = Math.abs(today - creationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        document.getElementById('stat-dias').textContent = diffDays;
        
        // Aquí puedes agregar llamadas a tu backend para obtener más estadísticas
        // Por ahora usamos valores por defecto
        document.getElementById('stat-favoritos').textContent = '0';
        document.getElementById('stat-biblioteca').textContent = '0';
        document.getElementById('stat-reviews').textContent = '0';
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
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
        
        console.log('💾 Guardando perfil...', updates);
        
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
            console.log('⚠️ Usuario no existe, creando...');
            
            const createData = {
                email: currentUser.email,
                avatar_url: userProfile?.avatar_url || currentUser.email || 'default',
                avatar_style: userProfile?.avatar_style || 'avataaars',
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
        
        console.log('✅ Perfil guardado:', userProfile);
        
        // Actualizar displayName en Firebase si cambió
        if (updates.displayName !== currentUser.displayName) {
            await window.updateProfile(currentUser, {
                displayName: updates.displayName
            });
            console.log('✅ DisplayName actualizado en Firebase');
        }
        
        // Re-renderizar y salir del modo edición
        renderProfile();
        exitEditMode();
        
        showNotification('¡Perfil actualizado correctamente! 🎉', 'success');
        
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        showNotification('Error al guardar el perfil: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// =================================================================
// CAMBIO DE AVATAR
// =================================================================

function generateEmojiGrid() {
    const grid = document.getElementById('emoji-grid');
    grid.innerHTML = '';
    
    AVATAR_STYLES.forEach(style => {
        const option = document.createElement('div');
        option.className = 'avatar-option';
        option.onclick = () => selectAvatar(style.id);
        
        // Generar preview del avatar
        const seed = userProfile?.email || currentUser.email || 'preview';
        const avatarUrl = getDiceBearUrl(style.id, seed);
        
        option.innerHTML = `
            <img src="${avatarUrl}" alt="${style.name}" class="avatar-preview">
            <span class="avatar-label">${style.name}</span>
        `;
        
        grid.appendChild(option);
    });
}

async function selectAvatar(avatarStyle) {
    try {
        showLoading(true);
        closeAvatarModal();
        
        // Generar un seed único basado en el email o usar uno aleatorio
        const seed = userProfile?.email || currentUser.email || `user-${Date.now()}`;
        
        console.log('🎨 Cambiando avatar a:', avatarStyle);
        
        // Intentar PATCH primero
        let response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                avatar_url: seed,
                avatar_style: avatarStyle
            })
        });
        
        // Si no existe (404), crear con POST
        if (response.status === 404) {
            console.log('⚠️ Usuario no existe, creando con avatar...');
            
            response = await fetch(`${window.API_BASE_URL}/usuarios/${currentUser.uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentUser.email,
                    displayName: currentUser.displayName || 'Usuario',
                    avatar_url: seed,
                    avatar_style: avatarStyle
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
        
        console.log('✅ Avatar actualizado:', userProfile);
        
        // Actualizar vista
        const avatarDisplay = document.getElementById('avatar-display');
        const avatarUrl = getDiceBearUrl(avatarStyle, seed);
        avatarDisplay.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="avatar-img">`;
        
        // Actualizar avatar en navbar
        if (window.updateUserAvatar) {
            await window.updateUserAvatar(currentUser);
        }
        
        showNotification('¡Avatar actualizado! ✨', 'success');
        
    } catch (error) {
        console.error('❌ Error cambiando avatar:', error);
        showNotification('Error al cambiar el avatar: ' + error.message, 'error');
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
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Verificar si el usuario usa email/contraseña
    const isPasswordProvider = currentUser.providerData.some(
        provider => provider.providerId === 'password'
    );
    
    if (!isPasswordProvider) {
        showNotification('No puedes cambiar la contraseña porque iniciaste sesión con un proveedor externo', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        await window.updatePassword(currentUser, newPassword);
        
        // Limpiar formulario
        document.getElementById('change-password-form').reset();
        
        showNotification('¡Contraseña actualizada correctamente! 🔒', 'success');
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        
        let mensaje = 'Error al cambiar la contraseña';
        
        if (error.code === 'auth/requires-recent-login') {
            mensaje = 'Por seguridad, debes volver a iniciar sesión para cambiar tu contraseña';
        }
        
        showNotification(mensaje, 'error');
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
    overlay.style.display = show ? 'flex' : 'none';
}

// Exponer funciones globales necesarias
window.closeAvatarModal = closeAvatarModal;

console.log('✅ Módulo de perfil cargado');