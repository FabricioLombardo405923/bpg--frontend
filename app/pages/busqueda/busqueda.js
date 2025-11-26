// Estado de la búsqueda
const searchState = {
    query: '',
    pageNumber: 1,
    pageSize: 10,
    ordering: 'rating',
    isLoading: false,
    totalResults: 0,
    totalPages: 0,
    pagination: null // Instancia del componente de paginación
};

// Inicializar búsqueda
async function initializeBusqueda() {
    console.log('🔍 Inicializando página de búsqueda');
    // Obtener término de búsqueda de sessionStorage
    searchState.query = sessionStorage.getItem('searchQuery') || '';
    
    if (!searchState.query) {
        mostrarError('No se especificó un término de búsqueda');
        return;
    }

    // Mostrar término de búsqueda
    document.getElementById('searchTerm').textContent = searchState.query;
    
    // Cargar primera página
    await cargarResultados();
}

// Cargar resultados de búsqueda
async function cargarResultados() {
    if (searchState.isLoading) return;

    searchState.isLoading = true;
    mostrarLoader(true);

    const container = document.getElementById('resultadosContainer');
    container.innerHTML = '';

    const url = `${API_BASE_URL}/games/search?q=${encodeURIComponent(searchState.query)}&page=${searchState.pageNumber}&pageSize=${searchState.pageSize}&ordenarPor=${searchState.ordering}`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();

        // Validación de estructura
        if (!result.success || !result.data || !Array.isArray(result.data.juegos)) {
            throw new Error('Error al cargar resultados');
        }

        const juegos = result.data.juegos;
        const { page, pageSize, total, hasNext } = result.data;

        //Actualizar estado
        searchState.pageNumber = page || 1;
        searchState.pageSize = pageSize || 10;
        searchState.totalResults = total || juegos.length;
        searchState.totalPages = Math.ceil((total || 0) / (pageSize || 10));

        // Renderizar resultados
        if (juegos.length === 0) {
            document.getElementById('noResults').style.display = 'flex';
            if (searchState.pagination) {
                searchState.pagination.destroy();
                searchState.pagination = null;
            }
        } else {
            document.getElementById('noResults').style.display = 'none';

            juegos.forEach(game => {
                container.appendChild(crearResultadoCard(game));
            });

            // Inicializar o actualizar paginador
            if (!searchState.pagination) {
                searchState.pagination = new Pagination({
                    containerId: 'paginationContainer',
                    currentPage: searchState.pageNumber -1,
                    totalPages: searchState.totalPages,
                    maxButtons: 5,
                    onPageChange: (newPage) => {
                        searchState.pageNumber = newPage + 1;
                        cargarResultados();
                    }
                });
            } else {
                searchState.pagination.update({
                    currentPage: searchState.pageNumber - 1,
                    totalPages: searchState.totalPages
                });
            }

            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

    } catch (error) {
        console.error('Error al cargar resultados:', error);
        mostrarError('Error al cargar los resultados de búsqueda');
    } finally {
        searchState.isLoading = false;
        mostrarLoader(false);
    }
}


// Crear la card del juego
function crearResultadoCard(game) {
    const template = document.getElementById('resultado-template');
    const card = template.content.cloneNode(true);

    // Imagen
    const img = card.querySelector('.resultado-imagen');
    img.src = game.imagenes.portada.original || game.imagenes.portada.steamHeader || 'https://via.placeholder.com/460x215?text=Sin+Imagen';
    img.alt = game.nombre;
    img.onerror = () => { img.src = 'https://via.placeholder.com/460x215?text=Sin+Imagen'; };

    // Título
    card.querySelector('.resultado-titulo').textContent = game.nombre;

    // Descripción
    const descripcionEl = card.querySelector('.resultado-descripcion');
    if (game.descripcion) {
        descripcionEl.textContent = game.descripcionCorta || game.descripcion;
    } else {
        descripcionEl.style.display = 'none';
    }

    // Géneros
    const generosEl = card.querySelector('.resultado-generos');
    if (game.generos && game.generos.length > 0) {
        generosEl.textContent = game.generos.join(' • ');
        generosEl.style.display = 'block';
    } else {
        generosEl.style.display = 'none';
    }

    // tags
    const tags = card.querySelector('.resultado-tags');
    if (game.tags && game.tags.length > 0) {
        tags.textContent = game.tags.slice(0, 4).join(' • ');
    } else {
        tags.style.display = 'none';
    }

    // Plataformas
    const plataformasEl = card.querySelector('.resultado-plataformas');
    if (game.plataformas && game.plataformas.length > 0) {
        plataformasEl.innerHTML = game.plataformas
            .slice(0, 6)
            .map(p => `<span class="plataforma-icon">${getPlatformIcon(p.toLowerCase())}</span>`)
            .join('');
        plataformasEl.style.display = 'flex';
    } else {
        plataformasEl.style.display = 'none';
    }

    // ============================================
    // Botones de favoritos y biblioteca
    // ============================================
    
   // Botón favorito
    const btnFavorite = card.querySelector('.btn-quick-favorite');
    if (btnFavorite) {
        btnFavorite.onclick = async (e) => {
            e.stopPropagation();
            await toggleQuickFavorite(btnFavorite, game);
        };
    } else {
        console.warn('No se encontró .btn-quick-favorite en la card:', card);
    }

    // Botón biblioteca
    const btnLibrary = card.querySelector('.btn-quick-library');
    if (btnLibrary) {
        const btnLibrary = card.querySelector('.btn-quick-library');
        btnLibrary.onclick = async (e) => {
            e.stopPropagation();
            await toggleQuickLibrary(btnLibrary, game);
        };
    } else {
        console.warn('No se encontró .btn-quick-library en la card:', card);
    }


    checkAndUpdateFavoriteButton(btnFavorite, game.idSteam);
    checkAndUpdateLibraryButton(btnLibrary, game.idSteam);

    const btnDetalles = card.querySelector('.btn-ver-detalles');
    const itemContainer = card.querySelector('.resultado-item-horizontal');

    if (btnDetalles) {
        btnDetalles.onclick = () => navigateToGame(game.idSteam);
    }

    if (itemContainer) {
        itemContainer.onclick = (e) => {
            if (!e.target.closest('button')) {
                navigateToGame(game.idSteam);
            }
        };
    }


    return card;
}

function navigateToGame(gameId) {
    sessionStorage.setItem('gameID', `${gameId}`);
    loadPage('juego');
}

// Utilidades
function actualizarContador() {
    const countEl = document.getElementById('resultsCount');
    const loaded = searchState.pageNumber * searchState.pageSize;
    const showing = Math.min(loaded, searchState.totalResults);
    countEl.textContent = `Mostrando ${showing} de ${searchState.totalResults} resultados`;
}

function mostrarLoader(show) {
    const loader = document.getElementById('loadingIndicator');
    loader.style.display = show ? 'flex' : 'none';
}

function mostrarError(mensaje) {
    const container = document.getElementById('resultadosContainer');
    container.innerHTML = `<div class="error-message"><p>${mensaje}</p></div>`;
}

function getMetacriticColor(score) {
    if (score >= 75) return '#6dc849';
    if (score >= 50) return '#fdca52';
    return '#fc4b37';
}

function getPlatformIcon(slug) {
    const s = slug.toLowerCase();

    if (s.includes('pc')) return '<i class="fab fa-windows"></i>';
    if (s.includes('playstation')) return '<i class="fab fa-playstation"></i>';
    if (s.includes('xbox')) return '<i class="fab fa-xbox"></i>';
    if (s.includes('nintendo')) return '<i class="fas fa-gamepad"></i>';
    if (s.includes('ios')) return '<i class="fab fa-apple"></i>';
    if (s.includes('android')) return '<i class="fab fa-android"></i>';
    if (s.includes('mac')) return '<i class="fab fa-apple"></i>';
    if (s.includes('linux')) return '<i class="fab fa-linux"></i>';

    return '<i class="fas fa-desktop"></i>';
}


// Inicializar cuando la página carga
initializeBusqueda();

// ============================================
// FUNCIONES DE FAVORITOS EN BÚSQUEDA
// ============================================

async function toggleQuickFavorite(btn, gameData) {
    const userId = getUserId();
    
    if (!userId) {
        showAlert('Debes iniciar sesión para agregar favoritos', 'warning');
        return;
    }

    // Deshabilitar botón mientras procesa
    btn.disabled = true;
    const icon = btn.querySelector('i');
    const wasActive = btn.classList.contains('active');

    try {
        if (wasActive) {
            // ELIMINAR de favoritos
            const success = await eliminarFavorito(gameData.idSteam);
            if (success) {
                btn.classList.remove('active');
                icon.className = 'far fa-heart';
                showAlert('Eliminado de favoritos', 'success');
            }
        } else {
            // AGREGAR a favoritos
            const success = await agregarFavorito(gameData);
            if (success) {
                btn.classList.add('active');
                icon.className = 'fas fa-heart';
                showAlert('¡Agregado a favoritos!', 'success');
            }
        }
    } catch (error) {
        showAlert('Error al actualizar favoritos', 'error');
    } finally {
        btn.disabled = false;
    }
}

// Verificar y actualizar estado del botón
async function checkAndUpdateFavoriteButton(btn, idSteam) {
    const userId = getUserId();
    if (!userId) return;

    try {
        const isFavorite = await verificarFavorito(idSteam);
        if (isFavorite) {
            btn.classList.add('active');
            btn.querySelector('i').className = 'fas fa-heart';
        }
    } catch (error) {
        console.error('Error al verificar favorito:', error);
    }
}

// Verificar si está en favoritos
async function verificarFavorito(idSteam) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/favoritos/${userId}/check/${idSteam}`);
        const result = await response.json();
        return result.isFavorite || false;
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        return false;
    }
}

// Agregar a favoritos
async function agregarFavorito(gameData) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/favoritos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                idSteam: gameData.idSteam,
                nombre: gameData.nombre,
                portada: gameData.imagenes?.portada?.original || 
                        gameData.imagenes?.portada?.steamHeader || 
                        null,
                generos: gameData.generos || [],
                plataformas: gameData.plataformas || []
            })
        });

        const result = await response.json();
        
        if (!result.success) {
            showAlert(result.error || 'Error al agregar favorito', 'error');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error al agregar favorito:', error);
        showAlert('Error de conexión', 'error');
        return false;
    }
}

// Eliminar de favoritos
async function eliminarFavorito(idSteam) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/favoritos/${userId}/${idSteam}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (!result.success) {
            showAlert(result.error || 'Error al eliminar favorito', 'error');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error al eliminar favorito:', error);
        showAlert('Error de conexión', 'error');
        return false;
    }
}
//=============================================
// BIBLIOTECA EN BÚSQUEDA
//=============================================

async function toggleQuickLibrary(btn, gameData) {
    const userId = getUserId();
    
    if (!userId) {
        showAlert('Debes iniciar sesión para agregar a biblioteca', 'warning');
        return;
    }

    btn.disabled = true;
    const icon = btn.querySelector('i');
    const wasActive = btn.classList.contains('active');

    try {
        if (wasActive) {
            // ELIMINAR de biblioteca
            const success = await eliminarBiblioteca(gameData.idSteam);
            if (success) {
                btn.classList.remove('active');
                icon.className = 'far fa-bookmark';
                showAlert('Eliminado de biblioteca', 'success');
            }
        } else {
            // AGREGAR a biblioteca
            const success = await agregarBiblioteca(gameData);
            if (success) {
                btn.classList.add('active');
                icon.className = 'fas fa-bookmark';
                showAlert('¡Agregado a biblioteca!', 'success');
            }
        }
    } catch (error) {
        showAlert('Error al actualizar biblioteca', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function checkAndUpdateLibraryButton(btn, idSteam) {
    const userId = getUserId();
    if (!userId) return;

    try {
        const isInLibrary = await verificarBiblioteca(idSteam);
        if (isInLibrary) {
            btn.classList.add('active');
            btn.querySelector('i').className = 'fas fa-bookmark';
        }
    } catch (error) {
        console.error('Error al verificar biblioteca:', error);
    }
}

async function verificarBiblioteca(idSteam) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/biblioteca/${userId}/check/${idSteam}`);
        const result = await response.json();
        return result.isBiblioteca || false;
    } catch (error) {
        console.error('Error al verificar biblioteca:', error);
        return false;
    }
}

async function agregarBiblioteca(gameData) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/biblioteca`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                idSteam: gameData.idSteam,
                nombre: gameData.nombre,
                portada: gameData.imagenes?.portada?.original || 
                        gameData.imagenes?.portada?.steamHeader || 
                        null,
                generos: gameData.generos || [],
                plataformas: gameData.plataformas || []
            })
        });

        const result = await response.json();
        
        if (!result.success) {
            if (result.error && result.error.includes('ya está en biblioteca')) {
                showAlert('Este juego ya está en tu biblioteca', 'info');
                return true;
            }
            showAlert(result.error || 'Error al agregar a biblioteca', 'error');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error al agregar a biblioteca:', error);
        showAlert('Error de conexión', 'error');
        return false;
    }
}

async function eliminarBiblioteca(idSteam) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/biblioteca/${userId}/${idSteam}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (!result.success) {
            showAlert(result.error || 'Error al eliminar de biblioteca', 'error');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error al eliminar de biblioteca:', error);
        showAlert('Error de conexión', 'error');
        return false;
    }
}

function getUserId() {
    var userId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || null; 
    return userId;
}