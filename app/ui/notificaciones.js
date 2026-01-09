// Estado global de notificaciones
const notificaciones = {
    userId: null,
    pendientes: [],
    isOpen: false,
    checkInterval: null
};

// ============================================
// INICIALIZACIÓN
// ============================================
function initNotificaciones() {
    // Verificar si hay usuario logueado
    notificaciones.userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    
    if (!notificaciones.userId) {
        // Ocultar elementos de notificaciones
        ocultarElementosNotificaciones();
        return;
    }

    // Mostrar elementos de notificaciones
    mostrarElementosNotificaciones();
    
    // Setup event listeners
    setupCampanitaEventListeners();
    
    // Cargar notificaciones pendientes
    cargarNotificacionesPendientes();
    
    // Actualizar cada 30 segundos
    if (notificaciones.checkInterval) {
        clearInterval(notificaciones.checkInterval);
    }
    notificaciones.checkInterval = setInterval(() => {
        cargarNotificacionesPendientes();
    }, 30000);
}

// ============================================
// MOSTRAR/OCULTAR ELEMENTOS
// ============================================
function mostrarElementosNotificaciones() {
    const navNotif = document.getElementById('navNotificaciones');
    const mobileNotif = document.getElementById('mobileNotificacionesItem');
    
    if (navNotif) navNotif.style.display = 'block';
    if (mobileNotif) mobileNotif.style.display = 'block';
}

function ocultarElementosNotificaciones() {
    const navNotif = document.getElementById('navNotificaciones');
    const mobileNotif = document.getElementById('mobileNotificacionesItem');
    
    if (navNotif) navNotif.style.display = 'none';
    if (mobileNotif) mobileNotif.style.display = 'none';
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupCampanitaEventListeners() {
    const bellBtn = document.getElementById('notifBellBtn');
    const dropdown = document.getElementById('notifDropdown');
    const closeBtn = document.getElementById('closeNotifDropdown');

    if (bellBtn) {
        bellBtn.removeEventListener('click', handleBellClick);
        bellBtn.addEventListener('click', handleBellClick);
    }

    if (closeBtn) {
        closeBtn.removeEventListener('click', handleCloseClick);
        closeBtn.addEventListener('click', handleCloseClick);
    }

    // Cerrar al hacer click fuera
    document.removeEventListener('click', handleOutsideClick);
    document.addEventListener('click', handleOutsideClick);
}

function handleBellClick(e) {
    e.stopPropagation();
    toggleNotifDropdown();
}

function handleCloseClick(e) {
    e.stopPropagation();
    cerrarNotifDropdown();
}

function handleOutsideClick(e) {
    const dropdown = document.getElementById('notifDropdown');
    const bellBtn = document.getElementById('notifBellBtn');
    
    if (dropdown && bellBtn && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
        cerrarNotifDropdown();
    }
}

function toggleNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;

    notificaciones.isOpen = !notificaciones.isOpen;
    
    if (notificaciones.isOpen) {
        dropdown.classList.add('active');
        cargarNotificacionesPendientes();
    } else {
        dropdown.classList.remove('active');
    }
}

function cerrarNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
        notificaciones.isOpen = false;
    }
}

// ============================================
// CARGA DE NOTIFICACIONES PENDIENTES
// ============================================
async function cargarNotificacionesPendientes() {
    if (!notificaciones.userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${notificaciones.userId}/pendientes`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error al cargar notificaciones');
        }

        notificaciones.pendientes = result.data || [];
        actualizarBadgeNotificaciones();
        
        // Si el dropdown está abierto, actualizar contenido
        if (notificaciones.isOpen) {
            renderNotificacionesDropdown();
        }
    } catch (error) {
        console.error('Error al cargar notificaciones pendientes:', error);
    }
}

function actualizarBadgeNotificaciones() {
    const badge = document.getElementById('notifBadge');
    const mobileBadge = document.getElementById('mobileNotifBadge');
    const count = notificaciones.pendientes.length;
    
    const displayText = count > 99 ? '99+' : count.toString();
    
    // Badge desktop
    if (badge) {
        if (count > 0) {
            badge.textContent = displayText;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Badge móvil
    if (mobileBadge) {
        if (count > 0) {
            mobileBadge.textContent = displayText;
            mobileBadge.style.display = 'inline-block';
        } else {
            mobileBadge.style.display = 'none';
        }
    }
}

// ============================================
// RENDERIZADO DEL DROPDOWN
// ============================================
function renderNotificacionesDropdown() {
    const body = document.getElementById('notifDropdownBody');
    if (!body) return;

    body.innerHTML = '';

    if (notificaciones.pendientes.length === 0) {
        body.innerHTML = `
            <div class="notif-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No tienes notificaciones nuevas</p>
            </div>
        `;
        return;
    }

    // Mostrar máximo 5 notificaciones
    const notificacionesMostrar = notificaciones.pendientes.slice(0, 5);
    
    notificacionesMostrar.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-dropdown-item';
        item.innerHTML = `
            <div class="notif-item-image">
                <img src="${notif.portada || 'https://via.placeholder.com/80x80?text=Sin+Imagen'}" 
                     alt="${notif.nombreJuego}"
                     onerror="this.src='https://via.placeholder.com/80x80?text=Sin+Imagen'">
            </div>
            <div class="notif-item-content">
                <h4>${notif.nombreJuego}</h4>
                <p>${notif.mensaje}</p>
                ${notif.descuento > 0 ? `
                    <div class="notif-item-descuento">
                        <span class="descuento">-${notif.descuento}%</span>
                        <span class="precio">$${(notif.precioActual / 100).toFixed(2)} ARS</span>
                    </div>
                ` : ''}
                <span class="notif-item-time">${formatearTiempoCorto(notif.sentAt)}</span>
            </div>
        `;

        item.onclick = async () => {
            await marcarNotifComoLeida(notif.id);
            cerrarNotifDropdown();
            
            if (notif.idSteam) {
                sessionStorage.setItem('gameID', notif.idSteam);
                loadPage('juego');
            }
        };

        body.appendChild(item);
    });
}

// ============================================
// MARCAR COMO LEÍDA
// ============================================
async function marcarNotifComoLeida(notifId) {
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${notifId}/leida`, {
            method: 'PUT'
        });

        const result = await response.json();

        if (result.success) {
            // Actualizar estado local
            notificaciones.pendientes = notificaciones.pendientes.filter(n => n.id !== notifId);
            actualizarBadgeNotificaciones();
        }
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
}

// ============================================
// UTILIDADES
// ============================================
function formatearTiempoCorto(fecha) {
    const ahora = new Date();
    const notifDate = new Date(fecha);
    const diffMs = ahora - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return notifDate.toLocaleDateString('es-AR', { 
        day: 'numeric', 
        month: 'short' 
    });
}

// ============================================
// CLEANUP
// ============================================
function cleanupNotificaciones() {
    if (notificaciones.checkInterval) {
        clearInterval(notificaciones.checkInterval);
        notificaciones.checkInterval = null;
    }
}

// ============================================
// REINICIALIZAR AL CAMBIAR USUARIO
// ============================================
function reinitNotificaciones() {
    cleanupNotificaciones();
    initNotificaciones();
}

// ============================================
// INICIALIZAR AL CARGAR
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificaciones);
} else {
    initNotificaciones();
}

// Limpiar al descargar
window.addEventListener('beforeunload', cleanupNotificaciones);