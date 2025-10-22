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

    const API_BASE = 'http://localhost:3000/api';
    const url = `${API_BASE}/games/search?q=${encodeURIComponent(searchState.query)}&page=${searchState.pageNumber}&pageSize=${searchState.pageSize}&ordenarPor=${searchState.ordering}`;
    
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
    
    // Puntuación
    // const ratingContainer = card.querySelector('.resultado-rating');
    // const ratingValue = card.querySelector('.rating-value');
    // if (game.puntuacion && game.puntuacion > 0) {
    //     ratingValue.textContent = `${game.puntuacion.toFixed(0)}/100`;
    //     ratingContainer.style.display = 'flex';
    // } else {
    //     ratingContainer.style.display = 'none';
    // }

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

    // Precio y descuento
    // const precioContainer = card.querySelector('.resultado-precio');
    // const precioActual = card.querySelector('.precio-actual');
    // const precioOriginal = card.querySelector('.precio-original');
    // const precioDescuento = card.querySelector('.precio-descuento');

    // if (game.precio && game.precio > 0) {
    //     precioActual.textContent = `$${parseFloat(game.precio).toFixed(2)}`;

    //     if (game.descuento && game.descuento > 0) {
    //         const precioSinDescuento = game.precio / (1 - game.descuento / 100);
    //         precioOriginal.textContent = `$${precioSinDescuento.toFixed(2)}`;
    //         precioOriginal.style.display = 'inline';
    //         precioDescuento.textContent = `-${Math.round(game.descuento)}%`;
    //         precioDescuento.style.display = 'inline';
    //     } else {
    //         precioOriginal.style.display = 'none';
    //         precioDescuento.style.display = 'none';
    //     }

    //     precioContainer.style.display = 'flex';
    // } else {
    //     precioContainer.style.display = 'none';
    // }

    // Click
    card.querySelector('.btn-primary').onclick = () => navigateToGame(game.idSteam);
    card.querySelector('.resultado-item-horizontal').onclick = (e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('.btn-primary')) {
            navigateToGame(game.idSteam);
        }
    };

    return card;
}


function navigateToGame(gameId) {
    sessionStorage.setItem('gameID', `${gameId}`);
    window.location.href = `/app/?page=juego`;
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