// Estado de notificaciones
const notificacionesState = {
    userId: null,
    notificaciones: [],
    filteredNotificaciones: [],
    isLoading: false,
    currentFilter: 'all',
    sortBy: 'recent'
};

// ============================================
// INICIALIZACIÓN
// ============================================
async function initializeNotificaciones() {
    notificacionesState.userId = getUserId();
    
    if (!notificacionesState.userId) {
        mostrarError('Debes iniciar sesión para ver tus notificaciones');
        return;
    }

    await cargarNotificaciones();
    setupNotificacionesEventListeners();
}

// ============================================
// CARGA DE DATOS
// ============================================
async function cargarNotificaciones() {
    if (notificacionesState.isLoading) return;
    
    notificacionesState.isLoading = true;
    mostrarLoader(true);

    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionesState.userId}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error al cargar notificaciones');
        }

        notificacionesState.notificaciones = result.data || [];
        aplicarFiltros();
        renderNotificaciones();
        actualizarContadores();
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarError('Error al cargar notificaciones');
    } finally {
        notificacionesState.isLoading = false;
        mostrarLoader(false);
    }
}

// ============================================
// ACCIONES DE NOTIFICACIONES
// ============================================
async function marcarComoLeida(notificacionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}/leida`, {
            method: 'PUT'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error al marcar como leída');
        }

        // Actualizar estado local
        const notif = notificacionesState.notificaciones.find(n => n.id === notificacionId);
        if (notif) {
            notif.status = 'read';
            notif.readAt = new Date().toISOString();
        }

        aplicarFiltros();
        renderNotificaciones();
        actualizarContadores();
        
        // Actualizar badge global si existe
        if (typeof actualizarBadgeNotificaciones === 'function') {
            actualizarBadgeNotificaciones();
        }

        return true;
    } catch (error) {
        console.error('Error al marcar como leída:', error);
        showAlert('Error al marcar como leída', 'error');
        return false;
    }
}

//TODO : NO EXISTE ENDPOINT EN BACKEND
// async function marcarTodasLeidas() {
//     try {
//         const pendientes = notificacionesState.notificaciones.filter(n => n.status === 'pending');
        
//         if (pendientes.length === 0) {
//             showAlert('No hay notificaciones pendientes', 'info');
//             return;
//         }

//         if (!confirm(`¿Marcar ${pendientes.length} notificaciones como leídas?`)) {
//             return;
//         }

//         mostrarLoader(true);

//         // Marcar todas como leídas en paralelo
//         await Promise.all(
//             pendientes.map(n => marcarComoLeida(n.id))
//         );

//         showAlert('Todas las notificaciones marcadas como leídas', 'success');
//     } catch (error) {
//         console.error('Error al marcar todas como leídas:', error);
//         showAlert('Error al marcar notificaciones', 'error');
//     } finally {
//         mostrarLoader(false);
//     }
// }

// TODO : NO EXISTE ENDPOINT EN BACKEND
// async function eliminarNotificacion(notificacionId) {
//     try {
//         const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}`, {
//             method: 'DELETE'
//         });

//         const result = await response.json();

//         if (!result.success) {
//             throw new Error(result.error || 'Error al eliminar notificación');
//         }

//         // Actualizar estado local
//         notificacionesState.notificaciones = notificacionesState.notificaciones.filter(
//             n => n.id !== notificacionId
//         );

//         aplicarFiltros();
//         renderNotificaciones();
//         actualizarContadores();

//         showAlert('Notificación eliminada', 'success');
//         return true;
//     } catch (error) {
//         console.error('Error al eliminar notificación:', error);
//         showAlert('Error al eliminar notificación', 'error');
//         return false;
//     }
// }

// ============================================
// FILTROS Y ORDENAMIENTO
// ============================================
function aplicarFiltros() {
    let filtered = [...notificacionesState.notificaciones];

    // Filtro por estado
    if (notificacionesState.currentFilter === 'pending') {
        filtered = filtered.filter(n => n.status === 'pending' || n.status === 'sent');
    } else if (notificacionesState.currentFilter === 'read') {
        filtered = filtered.filter(n => n.status === 'read');
    }

    // Ordenamiento
    if (notificacionesState.sortBy === 'recent') {
        filtered.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    } else {
        filtered.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    }

    notificacionesState.filteredNotificaciones = filtered;
}

function actualizarContadores() {
    const total = notificacionesState.notificaciones.length;
    const pending = notificacionesState.notificaciones.filter(n => n.status === 'pending' || n.status === 'sent').length;
    const read = notificacionesState.notificaciones.filter(n => n.status === 'read').length;

    document.getElementById('notificacionesCount').textContent = total;
    document.getElementById('countAll').textContent = total;
    document.getElementById('countPending').textContent = pending;
    document.getElementById('countRead').textContent = read;
}

// ============================================
// RENDERIZADO
// ============================================
function renderNotificaciones() {
    const list = document.getElementById('notificacionesList');
    const emptyState = document.getElementById('emptyState');

    list.innerHTML = '';

    if (notificacionesState.filteredNotificaciones.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'flex';
        
        // Personalizar mensaje según filtro
        const h3 = emptyState.querySelector('h3');
        const p = emptyState.querySelector('p');
        
        if (notificacionesState.currentFilter === 'pending') {
            h3.textContent = 'No tienes notificaciones pendientes';
            p.textContent = '¡Estás al día con todas tus notificaciones!';
        } else if (notificacionesState.currentFilter === 'read') {
            h3.textContent = 'No hay notificaciones leídas';
            p.textContent = 'Las notificaciones que marques como leídas aparecerán aquí';
        } else {
            h3.textContent = 'No tienes notificaciones';
            p.textContent = 'Cuando recibas notificaciones sobre ofertas y descuentos, aparecerán aquí';
        }
        
        return;
    }

    list.style.display = 'block';
    emptyState.style.display = 'none';

    notificacionesState.filteredNotificaciones.forEach(notif => {
        const item = crearNotificacionItem(notif);
        list.appendChild(item);
    });
}

function crearNotificacionItem(notif) {
    const template = document.getElementById('notificacion-item-template');
    const item = template.content.cloneNode(true);

    const itemEl = item.querySelector('.notificacion-item');
    
    // Agregar clase si está leída
    if (notif.status === 'read') {
        itemEl.classList.add('read');
    }

    // Imagen
    const img = item.querySelector('.notificacion-image img');
    img.src = notif.portada || 'https://via.placeholder.com/460x215?text=Sin+Imagen';
    img.alt = notif.nombreJuego;
    img.onerror = () => { img.src = 'https://via.placeholder.com/460x215?text=Sin+Imagen'; };

    // Título y mensaje
    item.querySelector('.notificacion-title').textContent = notif.nombreJuego;
    item.querySelector('.notificacion-mensaje').textContent = notif.mensaje;

    // Tiempo
    item.querySelector('.notificacion-time').textContent = formatearTiempo(notif.sentAt);

    // Precios
    const precioAnteriorEl = item.querySelector('.precio-anterior');
    const precioActualEl = item.querySelector('.precio-actual');
    const descuentoEl = item.querySelector('.descuento-badge');

    if (notif.precioActual !== null) {
        precioActualEl.textContent = `$${(notif.precioActual / 100).toFixed(2)} ARS`;
        
        if (notif.descuento > 0) {
            descuentoEl.textContent = `-${notif.descuento}%`;
            descuentoEl.style.display = 'inline-block';
        }
    } else {
        item.querySelector('.notificacion-precio').style.display = 'none';
    }

    // Botón ver oferta
    const btnVerOferta = item.querySelector('.btn-ver-oferta');
    btnVerOferta.onclick = async () => {
        if (notif.status === 'pending') {
            await marcarComoLeida(notif.id);
        }
        
        if (notif.idSteam) {
            sessionStorage.setItem('gameID', notif.idSteam);
            loadPage('juego');
        } else if (notif.urlOferta) {
            window.open(notif.urlOferta, '_blank');
        }
    };

    // Botón marcar como leída
    const btnMarcarLeida = item.querySelector('.btn-marcar-leida');
    if (notif.status === 'read') {
        btnMarcarLeida.style.display = 'none';
    } else {
        btnMarcarLeida.onclick = async (e) => {
            e.stopPropagation();
            await marcarComoLeida(notif.id);
        };
    }

    // Botón eliminar
    // const btnEliminar = item.querySelector('.btn-eliminar');
    // btnEliminar.onclick = async (e) => {
    //     e.stopPropagation();
    //     if (confirm('¿Eliminar esta notificación?')) {
    //         await eliminarNotificacion(notif.id);
    //     }
    // };

    return item;
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupNotificacionesEventListeners() {
    // Filtros de tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            notificacionesState.currentFilter = tab.getAttribute('data-filter');
            aplicarFiltros();
            renderNotificaciones();
        });
    });

    // Ordenamiento
    const sortSelect = document.getElementById('sortNotificaciones');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            notificacionesState.sortBy = e.target.value;
            aplicarFiltros();
            renderNotificaciones();
        });
    }

    // Marcar todas como leídas
    const btnMarcarTodas = document.getElementById('marcarTodasLeidas');
    if (btnMarcarTodas) {
        btnMarcarTodas.addEventListener('click', marcarTodasLeidas);
    }
}

// ============================================
// UTILIDADES
// ============================================
function getUserId() {
    return sessionStorage.getItem('userId') || localStorage.getItem('userId') || null;
}

function mostrarLoader(show) {
    const loader = document.getElementById('notificacionesLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function mostrarError(mensaje) {
    const list = document.getElementById('notificacionesList');
    if (list) {
        list.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${mensaje}</p>
            </div>
        `;
    }
}

function formatearTiempo(fecha) {
    const ahora = new Date();
    const notifDate = new Date(fecha);
    const diffMs = ahora - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return notifDate.toLocaleDateString('es-AR', { 
        day: 'numeric', 
        month: 'short' 
    });
}

initializeNotificaciones();