// Estado de favoritos
const favoritosState = {
    userId: null,
    favoritos: [],
    filteredFavoritos: [],
    isLoading: false,
    searchQuery: '',
    sortBy: 'recent'
};

// ============================================
// INICIALIZACIÓN
// ============================================

async function initializeFavoritos() {
    favoritosState.userId = getUserId();
    
    if (!favoritosState.userId) {
        mostrarError('Debes iniciar sesión para ver tus favoritos');
        return;
    }

    // Verificar si es premium
    await verificarEstadoPremium();

    // Cargar favoritos
    await cargarFavoritos();

    // Setup event listeners
    setupFavoritosEventListeners();
}

async function verificarEstadoPremium() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${favoritosState.userId}/premium`);
        const result = await response.json();
        
        favoritosState.isPremium = result.premium === 1;
        
        // Mostrar límite si no es premium
        const limitEl = document.getElementById('favoritosLimit');
        if (limitEl && !favoritosState.isPremium) {
            limitEl.style.display = 'inline';
        }
    } catch (error) {
        console.error('Error verificando estado premium:', error);
        favoritosState.isPremium = false;
    }
}

// ============================================
// CARGA DE DATOS
// ============================================

async function cargarFavoritos() {
    if (favoritosState.isLoading) return;

    favoritosState.isLoading = true;
    mostrarLoader(true);

    try {
        const response = await fetch(`${API_BASE_URL}/favoritos/${favoritosState.userId}`);
        const result = await response.json();

        if (!result.success) {
        throw new Error(result.error || 'Error al cargar favoritos');
        }

        favoritosState.favoritos = result.data || [];
        favoritosState.filteredFavoritos = [...favoritosState.favoritos];

        // Aplicar ordenamiento y búsqueda actuales
        aplicarFiltros();
        
        // Renderizar
        renderFavoritos();

    } catch (error) {
        console.error('Error al cargar favoritos:', error);
        mostrarError('Error al cargar favoritos');
    } finally {
        favoritosState.isLoading = false;
        mostrarLoader(false);
    }
}

// ============================================
// AGREGAR/ELIMINAR FAVORITOS
// ============================================

async function agregarFavorito(gameData) {
    try {
        const response = await fetch(`${API_BASE_URL}/favoritos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: favoritosState.userId,
                idSteam: gameData.idSteam,
                nombre: gameData.nombre,
                portada: gameData.imagenes?.portada?.original || gameData.imagenes?.portada?.steamHeader,
                generos: gameData.generos || [],
                plataformas: gameData.plataformas || []
            })
        });

        const result = await response.json();

        if (!result.success) {
            if (result.error && result.error.includes('límite')) {
                // Mostrar modal Premium si existe
                if (typeof mostrarModalPremium === 'function') {
                    mostrarModalPremium(result.error);
                } else {
                    showAlert(result.error, 'warning');
                    
                    // Opcional: Redirigir a Premium después de 2 segundos
                    setTimeout(() => {
                        if (confirm('¿Quieres ver los planes Premium?')) {
                            loadPage('premium');
                        }
                    }, 1500);
                }
                return false;
            }
            throw new Error(result.error || 'Error al agregar favorito');
        }

        // Actualizar estado local
        favoritosState.favoritos.push(result.data);
        aplicarFiltros();
        renderFavoritos();

        showAlert('Juego agregado a favoritos', 'success');
        return true;

    } catch (error) {
        console.error('Error al agregar favorito:', error);
        showAlert(error.message, 'error');
        return false;
    }
}

async function eliminarFavorito(idSteam) {
    try {
        const response = await fetch(`${API_BASE_URL}/favoritos/${favoritosState.userId}/${idSteam}`, {
        method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
        throw new Error(result.error || 'Error al eliminar favorito');
        }

        // Actualizar estado local
        favoritosState.favoritos = favoritosState.favoritos.filter(f => f.idSteam !== idSteam);
        aplicarFiltros();
        renderFavoritos();

        mostrarNotificacion('Juego eliminado de favoritos', 'success');
        return true;

    } catch (error) {
        console.error('Error al eliminar favorito:', error);
        mostrarNotificacion('Error al eliminar favorito', 'error');
        return false;
    }
}

async function verificarFavorito(idSteam) {
    try {
        const response = await fetch(`${API_BASE_URL}/favoritos/${favoritosState.userId}/check/${idSteam}`);
        const result = await response.json();
        return result.isFavorite;
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        return false;
    }
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

function aplicarFiltros() {
    let filtered = [...favoritosState.favoritos];

    // Búsqueda
    if (favoritosState.searchQuery) {
        const query = favoritosState.searchQuery.toLowerCase();
        filtered = filtered.filter(f => 
        f.nombre.toLowerCase().includes(query) ||
        (f.generos && f.generos.some(g => g.toLowerCase().includes(query)))
        );
    }

    // Ordenamiento
    switch (favoritosState.sortBy) {
        case 'recent':
        filtered.sort((a, b) => new Date(b.fec_alt) - new Date(a.fec_alt));
        break;
        case 'oldest':
        filtered.sort((a, b) => new Date(a.fec_alt) - new Date(b.fec_alt));
        break;
        case 'name-asc':
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
        case 'name-desc':
        filtered.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
    }

    favoritosState.filteredFavoritos = filtered;
}

// ============================================
// RENDERIZADO
// ============================================

function renderFavoritos() {
    const grid = document.getElementById('favoritosGrid');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('favoritosCount');

    // Actualizar contador
    countEl.textContent = favoritosState.favoritos.length;

    // Limpiar grid
    grid.innerHTML = '';

    // Verificar si hay favoritos
    if (favoritosState.filteredFavoritos.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        
        // Cambiar mensaje si es por búsqueda
        if (favoritosState.searchQuery) {
        emptyState.querySelector('h3').textContent = 'No se encontraron resultados';
        emptyState.querySelector('p').textContent = 'Intenta con otro término de búsqueda';
        emptyState.querySelector('button').style.display = 'none';
        }
        return;
    }

    // Mostrar grid
    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Renderizar cada favorito
    favoritosState.filteredFavoritos.forEach(favorito => {
        const card = crearFavoritoCard(favorito);
        grid.appendChild(card);
    });
}

function crearFavoritoCard(favorito) {
    const template = document.getElementById('favorito-card-template');
    const card = template.content.cloneNode(true);

    // Imagen
    const img = card.querySelector('.favorito-image');
    img.src = favorito.portada || 'https://via.placeholder.com/460x215?text=Sin+Imagen';
    img.alt = favorito.nombre;
    img.onerror = () => { img.src = 'https://via.placeholder.com/460x215?text=Sin+Imagen'; };

    // Título
    card.querySelector('.favorito-title').textContent = favorito.nombre;

    // Géneros
    const generosEl = card.querySelector('.favorito-generos');
    if (favorito.generos && favorito.generos.length > 0) {
        generosEl.innerHTML = favorito.generos
        .slice(0, 3)
        .map(g => `<span class="genre-tag">${g}</span>`)
        .join('');
    } else {
        generosEl.style.display = 'none';
    }

    // Plataformas
    const plataformasEl = card.querySelector('.favorito-plataformas');
    if (favorito.plataformas && favorito.plataformas.length > 0) {
        plataformasEl.innerHTML = favorito.plataformas
        .slice(0, 4)
        .map(p => `<span class="plataforma-icon">${getPlatformIcon(p.toLowerCase())}</span>`)
        .join('');
    } else {
        plataformasEl.style.display = 'none';
    }

    // Botón eliminar
    const btnRemove = card.querySelector('.btn-remove-favorite');
    btnRemove.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar "${favorito.nombre}" de favoritos?`)) {
        await eliminarFavorito(favorito.idSteam);
        }
    };

    // Botón ver detalles
    const btnDetails = card.querySelector('.btn-ver-detalles');
    btnDetails.onclick = () => navigateToGame(favorito.idSteam);

    // Click en card
    const cardEl = card.querySelector('.favorito-card');
    cardEl.onclick = (e) => {
        if (!e.target.closest('button')) {
        navigateToGame(favorito.idSteam);
        }
    };

    return card;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupFavoritosEventListeners() {
  // Búsqueda
    const searchInput = document.getElementById('searchFavoritos');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
        favoritosState.searchQuery = e.target.value;
        aplicarFiltros();
        renderFavoritos();
        });
    }

    // Ordenamiento
    const sortSelect = document.getElementById('sortFavoritos');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
        favoritosState.sortBy = e.target.value;
        aplicarFiltros();
        renderFavoritos();
        });
    }
}

// ============================================
// UTILIDADES
// ============================================

function getUserId() {
    var userId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || null; 
    // if (!userId)
    // showAlert('Usuario no logueado. Iniciar sesión.', 'error');

    return userId;
}

function navigateToGame(gameId) {
    sessionStorage.setItem('gameID', `${gameId}`);
    loadPage('juego');
}

function mostrarLoader(show) {
    const loader = document.getElementById('favoritosLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function mostrarError(mensaje) {
    const grid = document.getElementById('favoritosGrid');
    if (grid) {
        grid.innerHTML = `
        <div class="error-message" style="grid-column: 1/-1;">
            <i class="fas fa-exclamation-circle"></i>
            <p>${mensaje}</p>
        </div>
        `;
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  // Implementa tu sistema de notificaciones aquí
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    
    // Ejemplo simple con alert (reemplazar con tu UI de notificaciones)
    if (tipo === 'error') {
        alert(mensaje);
    }
}

function getPlatformIcon(slug) {
    const s = slug.toLowerCase();
    if (s.includes('pc') || s.includes('windows')) return '<i class="fab fa-windows"></i>';
    if (s.includes('playstation')) return '<i class="fab fa-playstation"></i>';
    if (s.includes('xbox')) return '<i class="fab fa-xbox"></i>';
    if (s.includes('nintendo')) return '<i class="fas fa-gamepad"></i>';
    if (s.includes('ios')) return '<i class="fab fa-apple"></i>';
    if (s.includes('android')) return '<i class="fab fa-android"></i>';
    if (s.includes('mac')) return '<i class="fab fa-apple"></i>';
    if (s.includes('linux')) return '<i class="fab fa-linux"></i>';
    return '<i class="fas fa-desktop"></i>';
}

// ============================================
// INICIAR
// ============================================

initializeFavoritos();