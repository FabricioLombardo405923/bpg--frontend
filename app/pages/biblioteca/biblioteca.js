// Estado de biblioteca
const bibliotecaState = {
    userId: null,
    biblioteca: [],
    filteredBiblioteca: [],
    isLoading: false,
    searchQuery: '',
    sortBy: 'recent'
};

// ============================================
// INICIALIZACIÓN
// ============================================

async function initializeBiblioteca() {
  // Obtener userId de Firebase/sessionStorage
    bibliotecaState.userId = getUserId();
    
    if (!bibliotecaState.userId) {
        mostrarError('Debes iniciar sesión para ver tu biblioteca');
        return;
    }

    // Cargar biblioteca
    await cargarBiblioteca();

    // Setup event listeners
    setupBibliotecaEventListeners();
}

// ============================================
// CARGA DE DATOS
// ============================================

async function cargarBiblioteca() {
    if (bibliotecaState.isLoading) return;

    bibliotecaState.isLoading = true;
    mostrarLoader(true);

    try {
        const response = await fetch(`${API_BASE_URL}/biblioteca/${bibliotecaState.userId}`);
        const result = await response.json();

        if (!result.success) {
        throw new Error(result.error || 'Error al cargar biblioteca');
        }

        bibliotecaState.biblioteca = result.data || [];
        bibliotecaState.filteredBiblioteca = [...bibliotecaState.biblioteca];

        // Aplicar ordenamiento y búsqueda actuales
        aplicarFiltros();
        
        // Renderizar
        renderBiblioteca();

    } catch (error) {
        console.error('Error al cargar biblioteca:', error);
        mostrarError('Error al cargar biblioteca');
    } finally {
        bibliotecaState.isLoading = false;
        mostrarLoader(false);
    }
}

// ============================================
// AGREGAR/ELIMINAR FAVORITOS
// ============================================

async function agregarBiblioteca(gameData) {
    try {
        const response = await fetch(`${API_BASE_URL}/biblioteca`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: bibliotecaState.userId,
            idSteam: gameData.idSteam,
            nombre: gameData.nombre,
            portada: gameData.imagenes?.portada?.original || gameData.imagenes?.portada?.steamHeader,
            generos: gameData.generos || [],
            plataformas: gameData.plataformas || []
        })
        });

        const result = await response.json();

        if (!result.success) {
        throw new Error(result.error || 'Error al agregar biblioteca');
        }

        // Actualizar estado local
        bibliotecaState.biblioteca.push(result.data);
        aplicarFiltros();
        renderBiblioteca();

        mostrarNotificacion('Juego agregado a biblioteca', 'success');
        return true;

    } catch (error) {
        console.error('Error al agregar a biblioteca:', error);
        mostrarNotificacion(error.message, 'error');
        return false;
    }
}

async function eliminarBiblioteca(idSteam) {
    try {
        const response = await fetch(`${API_BASE_URL}/biblioteca/${bibliotecaState.userId}/${idSteam}`, {
        method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
        throw new Error(result.error || 'Error al eliminar biblioteca');
        }

        // Actualizar estado local
        bibliotecaState.biblioteca = bibliotecaState.biblioteca.filter(f => f.idSteam !== idSteam);
        aplicarFiltros();
        renderBiblioteca();

        mostrarNotificacion('Juego eliminado de biblioteca', 'success');
        return true;

    } catch (error) {
        console.error('Error al eliminar biblioteca:', error);
        mostrarNotificacion('Error al eliminar biblioteca', 'error');
        return false;
    }
}

async function verificarBiblioteca(idSteam) {
    try {
        const response = await fetch(`${API_BASE_URL}/biblioteca/${bibliotecaState.userId}/check/${idSteam}`);
        const result = await response.json();
        return result.isBiblioteca;
    } catch (error) {
        console.error('Error al verificar biblioteca:', error);
        return false;
    }
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

function aplicarFiltros() {
    let filtered = [...bibliotecaState.biblioteca];

    // Búsqueda
    if (bibliotecaState.searchQuery) {
        const query = bibliotecaState.searchQuery.toLowerCase();
        filtered = filtered.filter(f => 
        f.nombre.toLowerCase().includes(query) ||
        (f.generos && f.generos.some(g => g.toLowerCase().includes(query)))
        );
    }

    // Ordenamiento
    switch (bibliotecaState.sortBy) {
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

    bibliotecaState.filteredBiblioteca = filtered;
}

// ============================================
// RENDERIZADO
// ============================================

function renderBiblioteca() {
    const grid = document.getElementById('bibliotecaGrid');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('bibliotecaCount');

    // Actualizar contador
    countEl.textContent = bibliotecaState.biblioteca.length;

    // Limpiar grid
    grid.innerHTML = '';

    // Verificar si hay biblioteca
    if (bibliotecaState.filteredBiblioteca.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        
        // Cambiar mensaje si es por búsqueda
        if (bibliotecaState.searchQuery) {
        emptyState.querySelector('h3').textContent = 'No se encontraron resultados';
        emptyState.querySelector('p').textContent = 'Intenta con otro término de búsqueda';
        emptyState.querySelector('button').style.display = 'none';
        }
        return;
    }

    // Mostrar grid
    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Renderizar cada biblioteca
    bibliotecaState.filteredBiblioteca.forEach(biblioteca => {
        const card = crearBibliotecaCard(biblioteca);
        grid.appendChild(card);
    });
}

function crearBibliotecaCard(biblioteca) {
    const template = document.getElementById('biblioteca-card-template');
    const card = template.content.cloneNode(true);

    // Imagen
    const img = card.querySelector('.biblioteca-image');
    img.src = biblioteca.portada || 'https://via.placeholder.com/460x215?text=Sin+Imagen';
    img.alt = biblioteca.nombre;
    img.onerror = () => { img.src = 'https://via.placeholder.com/460x215?text=Sin+Imagen'; };

    // Título
    card.querySelector('.biblioteca-title').textContent = biblioteca.nombre;

    // Géneros
    const generosEl = card.querySelector('.biblioteca-generos');
    if (biblioteca.generos && biblioteca.generos.length > 0) {
        generosEl.innerHTML = biblioteca.generos
        .slice(0, 3)
        .map(g => `<span class="genre-tag">${g}</span>`)
        .join('');
    } else {
        generosEl.style.display = 'none';
    }

    // Plataformas
    const plataformasEl = card.querySelector('.biblioteca-plataformas');
    if (biblioteca.plataformas && biblioteca.plataformas.length > 0) {
        plataformasEl.innerHTML = biblioteca.plataformas
        .slice(0, 4)
        .map(p => `<span class="plataforma-icon">${getPlatformIcon(p.toLowerCase())}</span>`)
        .join('');
    } else {
        plataformasEl.style.display = 'none';
    }

    // Botón eliminar
    const btnRemove = card.querySelector('.btn-remove-biblioteca');
    btnRemove.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar "${biblioteca.nombre}" de biblioteca?`)) {
        await eliminarBiblioteca(biblioteca.idSteam);
        }
    };

    // Botón ver detalles
    const btnDetails = card.querySelector('.btn-ver-detalles');
    btnDetails.onclick = () => navigateToGame(biblioteca.idSteam);

    // Click en card
    const cardEl = card.querySelector('.biblioteca-card');
    cardEl.onclick = (e) => {
        if (!e.target.closest('button')) {
        navigateToGame(biblioteca.idSteam);
        }
    };

    return card;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupBibliotecaEventListeners() {
  // Búsqueda
    const searchInput = document.getElementById('searchBiblioteca');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
        bibliotecaState.searchQuery = e.target.value;
        aplicarFiltros();
        renderBiblioteca();
        });
    }

    // Ordenamiento
    const sortSelect = document.getElementById('sortBiblioteca');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
        bibliotecaState.sortBy = e.target.value;
        aplicarFiltros();
        renderBiblioteca();
        });
    }
}

// ============================================
// UTILIDADES
// ============================================


function getUserId() {
    var userId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || null; 
    if (!userId)
    showAlert('Usuario no logueado. Iniciar sesión.', 'error');

    return userId;
}

function navigateToGame(gameId) {
    sessionStorage.setItem('gameID', `${gameId}`);
    window.location.href = `/app/?page=juego`;
}

function mostrarLoader(show) {
    const loader = document.getElementById('bibliotecaLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function mostrarError(mensaje) {
    const grid = document.getElementById('bibliotecaGrid');
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

initializeBiblioteca();