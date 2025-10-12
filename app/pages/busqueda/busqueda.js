// Estado de la búsqueda
const searchState = {
    query: '',
    pageNumber: 0,
    pageSize: 10,
    ordering: '-rating',
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
    const url = `${API_BASE}/juegos/buscar?query=${encodeURIComponent(searchState.query)}&pageSize=${searchState.pageSize}&pageNumber=${searchState.pageNumber}&ordering=${searchState.ordering}`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success || !result.data) {
            throw new Error('Error al cargar resultados');
        }
        
        // Actualizar estado
        searchState.totalResults = result.paginacion.total;
        searchState.totalPages = result.paginacion.totalPages;
        
        // Actualizar contador
        //actualizarContador();
        
        // Renderizar juegos
        if (result.data.length === 0) {
            document.getElementById('noResults').style.display = 'flex';
            if (searchState.pagination) {
                searchState.pagination.destroy();
            }
        } else {
            document.getElementById('noResults').style.display = 'none';
            result.data.forEach(game => {
                container.appendChild(crearResultadoCard(game));
            });
            
            // Inicializar o actualizar paginación
            if (!searchState.pagination) {
                searchState.pagination = new Pagination({
                    containerId: 'paginationContainer',
                    currentPage: searchState.pageNumber,
                    totalPages: searchState.totalPages,
                    maxButtons: 5,
                    onPageChange: (newPage) => {
                        searchState.pageNumber = newPage;
                        cargarResultados();
                    }
                });
            } else {
                searchState.pagination.update({
                    currentPage: searchState.pageNumber,
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

function crearResultadoCard(game) {
    const template = document.getElementById('resultado-template');
    const card = template.content.cloneNode(true);
    
    // Imagen de RAWG
    const img = card.querySelector('.resultado-imagen');
    img.src = game.background_image || 'https://via.placeholder.com/460x215?text=Sin+Imagen';
    img.alt = game.name;
    img.onerror = () => {
        img.src = 'https://via.placeholder.com/460x215?text=Sin+Imagen';
    };
    
    // Título
    card.querySelector('.resultado-titulo').textContent = game.name;
    
    // Metacritic
    /* const metacriticContainer = card.querySelector('.resultado-metacritic');
    const metacriticScore = card.querySelector('.metacritic-score');
    if (game.metacritic) {
        metacriticScore.textContent = game.metacritic;
        metacriticScore.style.backgroundColor = getMetacriticColor(game.metacritic);
        metacriticContainer.style.display = 'block';
    } else {
        metacriticContainer.style.display = 'none';
    } */
    
    // Rating de RAWG
    const ratingContainer = card.querySelector('.resultado-rating');
    const ratingValue = card.querySelector('.rating-value');
    if (game.rating) {
        ratingValue.textContent = game.rating.toFixed(1) + '/5';
        ratingContainer.style.display = 'flex';
    } else {
        ratingContainer.style.display = 'none';
    }
    
    // Fecha de lanzamiento
    const fechaEl = card.querySelector('.resultado-fecha');
    if (game.released) {
        const fecha = new Date(game.released);
        fechaEl.innerHTML = `<i class="fas fa-calendar"></i> ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}`;
        fechaEl.style.display = 'flex';
    } else {
        fechaEl.style.display = 'none';
    }
    
    // Géneros
    const genresEl = card.querySelector('.resultado-generos');
    if (game.genres && game.genres.length > 0) {
        const genreNames = game.genres.slice(0, 3).map(g => g.name);
        genresEl.innerHTML = genreNames.map(name => 
            `<span class="genre-tag">${name}</span>`
        ).join('');
    } else {
        genresEl.style.display = 'none';
    }
    
    // Descripción (usando tags principales)
    const descripcionEl = card.querySelector('.resultado-descripcion');
    if (game.tags && game.tags.length > 0) {
        const mainTags = game.tags.slice(0, 4).map(t => t.name).join(' • ');
        descripcionEl.textContent = mainTags;
    } else {
        descripcionEl.style.display = 'none';
    }

    // Plataformas
    const plataformasEl = card.querySelector('.resultado-plataformas');
    if (game.parent_platforms && game.parent_platforms.length > 0) {
        plataformasEl.innerHTML = game.parent_platforms
            .slice(0, 6)
            .map(p => `<span class="plataforma-icon">${getPlatformIcon(p.platform.slug)}</span>`)
            .join('');
        plataformasEl.style.display = 'flex';
    } else {
        plataformasEl.style.display = 'none';
    }

    
    // Precio (si tiene ofertas)
    const precioContainer = card.querySelector('.resultado-precio');
    const precioActual = card.querySelector('.precio-actual');
    const precioOriginal = card.querySelector('.precio-original');
    const precioDescuento = card.querySelector('.precio-descuento');
    
    if (game.ofertas && game.ofertas.length > 0 && game.tieneOferta) {
        const mejorOferta = game.ofertas.reduce((min, oferta) => 
            parseFloat(oferta.price) < parseFloat(min.price) ? oferta : min
        );
        
        precioActual.textContent = `$${parseFloat(mejorOferta.price).toFixed(2)}`;
        
        if (parseFloat(mejorOferta.savings) > 0) {
            precioOriginal.textContent = `$${parseFloat(mejorOferta.retailPrice).toFixed(2)}`;
            precioOriginal.style.display = 'inline';
            
            precioDescuento.textContent = `-${Math.round(mejorOferta.savings)}%`;
            precioDescuento.style.display = 'inline';
        }
        
        precioContainer.style.display = 'flex';
    } else if (game.ofertas && game.ofertas.length > 0) {
        // Tiene precio pero sin descuento
        const oferta = game.ofertas[0];
        precioActual.textContent = `$${parseFloat(oferta.price).toFixed(2)}`;
        precioContainer.style.display = 'flex';
    } else {
        precioContainer.style.display = 'none';
    }
    
    // Click handler
    card.querySelector('.btn-primary').onclick = () => navigateToGame(game.id);
    card.querySelector('.resultado-item-horizontal').onclick = (e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('.btn-primary')) {
            navigateToGame(game.id);
        }
    };
    
    return card;
}

function navigateToGame(gameId) {
    window.location.href = `/?page=juego&id=${gameId}`;
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
    const icons = {
        'pc': '<i class="fab fa-windows"></i>',
        'playstation': '<i class="fab fa-playstation"></i>',
        'xbox': '<i class="fab fa-xbox"></i>',
        'nintendo': '<i class="fas fa-gamepad"></i>',
        'ios': '<i class="fab fa-apple"></i>',
        'android': '<i class="fab fa-android"></i>',
        'mac': '<i class="fab fa-apple"></i>',
        'linux': '<i class="fab fa-linux"></i>'
    };
    return icons[slug] || '<i class="fas fa-desktop"></i>';
}

// Inicializar cuando la página carga
initializeBusqueda();