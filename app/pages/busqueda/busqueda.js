// Estado de la búsqueda
const searchState = {
    query: '',
    pageNumber: 0,
    pageSize: 20,
    ordering: '-rating',
    isLoading: false,
    hasMore: true,
    totalResults: 0
};

async function initializeBusqueda() {
    // Obtener término de búsqueda de múltiples fuentes
    searchState.query = obtenerQueryDeBusqueda();
    
    if (!searchState.query) {
        mostrarError('No se especificó un término de búsqueda');
        return;
    }

    // Mostrar término de búsqueda
    document.getElementById('searchTerm').textContent = searchState.query;
    
    // Cargar primera página
    await cargarResultados();
    
    // Configurar scroll infinito
    setupInfiniteScroll();
}

// Obtener query de búsqueda de diferentes fuentes
function obtenerQueryDeBusqueda() {
    const storedQuery = sessionStorage.getItem('searchQuery');
    if (storedQuery) {
        sessionStorage.removeItem('searchQuery');
        return storedQuery;
    }
    
    const fullUrl = window.location.href;
    const queryMatch = fullUrl.match(/[?&]query=([^&]+)/);
    if (queryMatch) {
        return decodeURIComponent(queryMatch[1]);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    if (query) {
        return query;
    }
    
    return '';
}

// Cargar resultados de búsqueda
async function cargarResultados() {
    if (searchState.isLoading || !searchState.hasMore) return;
    
    searchState.isLoading = true;
    mostrarLoader(true);
    
    const API_BASE =  'http://localhost:3000/api';
    const url = `${API_BASE}/juegos/buscar?query=${encodeURIComponent(searchState.query)}&pageSize=${searchState.pageSize}&pageNumber=${searchState.pageNumber}&ordering=${searchState.ordering}`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success || !result.data) {
            throw new Error('Error al cargar resultados');
        }
        
        // Actualizar estado
        searchState.totalResults = result.paginacion.total;
        searchState.hasMore = result.paginacion.hasNext;
        
        // Actualizar contador
        actualizarContador();
        
        // Renderizar juegos
        const container = document.getElementById('resultadosContainer');
        result.data.forEach(game => {
            container.appendChild(crearResultadoCard(game));
        });
        
        // Incrementar página para próxima carga
        searchState.pageNumber++;
        
        // Mostrar mensaje si no hay más resultados
        if (!searchState.hasMore) {
            document.getElementById('noMoreResults').style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error al cargar resultados:', error);
        mostrarError('Error al cargar los resultados de búsqueda');
    } finally {
        searchState.isLoading = false;
        mostrarLoader(false);
    }
}

// Crear card de resultado
function crearResultadoCard(game) {
    const template = document.getElementById('resultado-template');
    const card = template.content.cloneNode(true);
    
    // Imagen
    const img = card.querySelector('.resultado-imagen');
    img.src = game.background_image || 'https://via.placeholder.com/300x400?text=Sin+Imagen';
    img.alt = game.name;
    img.onerror = () => {
        img.src = 'https://via.placeholder.com/300x400?text=Sin+Imagen';
    };
    
    // Título
    card.querySelector('.resultado-titulo').textContent = game.name;
    
    // Rating
    const ratingContainer = card.querySelector('.resultado-rating');
    const ratingValue = card.querySelector('.rating-value');
    if (game.rating) {
        ratingValue.textContent = game.rating.toFixed(1);
        ratingContainer.style.display = 'flex';
    } else {
        ratingContainer.style.display = 'none';
    }
    
    // Metacritic
    const metacriticContainer = card.querySelector('.resultado-metacritic');
    const metacriticScore = card.querySelector('.metacritic-score');
    if (game.metacritic) {
        metacriticScore.textContent = game.metacritic;
        metacriticScore.style.backgroundColor = getMetacriticColor(game.metacritic);
        metacriticContainer.style.display = 'block';
    } else {
        metacriticContainer.style.display = 'none';
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
    
    // Plataformas
    const platformsEl = card.querySelector('.resultado-plataformas');
    if (game.parent_platforms && game.parent_platforms.length > 0) {
        const platformIcons = game.parent_platforms.slice(0, 5).map(p => 
            getPlatformIcon(p.platform.slug)
        );
        platformsEl.innerHTML = platformIcons.join(' ');
    } else {
        platformsEl.style.display = 'none';
    }
    
    // Precio (si tiene ofertas)
    const precioActual = card.querySelector('.precio-actual');
    const precioOriginal = card.querySelector('.precio-original');
    
    if (game.ofertas && game.ofertas.length > 0) {
        const mejorOferta = game.ofertas.reduce((min, oferta) => 
            parseFloat(oferta.price) < parseFloat(min.price) ? oferta : min
        );
        
        precioActual.textContent = `$${parseFloat(mejorOferta.price).toFixed(2)}`;
        
        if (parseFloat(mejorOferta.savings) > 0) {
            precioOriginal.textContent = `$${parseFloat(mejorOferta.retailPrice).toFixed(2)}`;
            precioOriginal.style.display = 'inline';
        }
    } else {
        card.querySelector('.resultado-precio').style.display = 'none';
    }
    
    // Click handler
    card.querySelector('.btn-primary').onclick = () => navigateToGame(game.id);
    card.querySelector('.resultado-item').onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') {
            navigateToGame(game.id);
        }
    };
    
    return card;
}

// Configurar scroll infinito
function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !searchState.isLoading && searchState.hasMore) {
                cargarResultados();
            }
        });
    }, {
        rootMargin: '200px'
    });
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    observer.observe(loadingIndicator);
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

function navigateToGame(gameId) {
    window.location.href = `/game/${gameId}`;
}

// Inicializar cuando la página carga
initializeBusqueda();