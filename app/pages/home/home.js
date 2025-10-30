const pageSize = 20;
const API_URL_RECIENTES = 'http://localhost:3000/api/games/deals/recent?pageSize=5';
    //`http://localhost:3000/api/descuentos?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;
const API_URL_POPULARES = `http://localhost:3000/api/games/deals/popular?pageSize=5`
    //`http://localhost:3000/api/descuentos/populares?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;

// Inicializar la página
async function initializeHome() {
    await Promise.all([
        cargarPopulares(),
        cargarRecomendados(),
        cargarRecientes()
    ]);
}

// Mapear respuesta del API al formato interno
function mapearJuego(juego) {
    return {
        gameID: juego.idSteam || juego.igdbId,
        title: juego.nombre,
        salePrice: juego.precio ?? juego.precioNormal,
        normalPrice: juego.precioNormal ?? juego.precio,
        rating: juego.puntuacion ?? juego.metacritic,
        thumb: juego.imagenes?.portada?.small,
        thumbOriginal: juego.imagenes?.portada?.original,
        steamHeader: juego.imagenes?.portada?.steamHeader,
        genres: juego.generos || []
    };
}

// Obtener mejor imagen para hero (prioridad: steamHeader > original > small)
function obtenerImagenHero(game) {
    return game.steamHeader || game.thumbOriginal || game.thumb || 
           'https://via.placeholder.com/1920x400?text=Sin+Imagen';
}

// Obtener imagen para cards (prioridad: original > steamHeader > small)
function obtenerImagenCard(game) {
    return game.thumbOriginal || game.steamHeader || game.thumb || 
           'https://via.placeholder.com/460x215?text=Sin+Imagen';
}

// Manejo de errores de imagen
function handleImageError(img, game) {
    const fallbacks = [game.thumbOriginal, game.steamHeader, game.thumb];
    const currentSrc = img.src;
    
    for (let fallback of fallbacks) {
        if (fallback && !currentSrc.includes(fallback)) {
            img.src = fallback;
            return;
        }
    }
    
    img.src = 'https://via.placeholder.com/460x215?text=Sin+Imagen';
    img.alt = 'Imagen no disponible';
}

// --- CARGAR POPULARES (Hero carousel) ---
async function cargarPopulares() {
    const container = document.getElementById('heroCarousel');
    container.innerHTML = '<p class="loading-msg">Cargando juegos populares...</p>';
    
    try {
        const res = await fetch(API_URL_POPULARES);
        const { success, data } = await res.json();
        
        if (!success || !data?.juegos?.length) {
            throw new Error('No se encontraron juegos');
        }
        
        container.innerHTML = '';
        data.juegos.forEach(juego => {
            const game = mapearJuego(juego);
            container.appendChild(crearHeroCard(game));
        });
        
        initHeroCarousel();
    } catch (error) {
        console.error('Error cargando populares:', error);
        container.innerHTML = '<p class="error-msg">Error al cargar juegos populares.</p>';
    }
}

// --- CARGAR RECOMENDADOS (Grid list) ---
async function cargarRecomendados() {
    const container = document.getElementById('gamesList');
    container.innerHTML = '<p class="loading-msg">Cargando recomendados...</p>';
    
    try {
        const res = await fetch(API_URL_POPULARES);
        const { success, data } = await res.json();
        
        if (!success || !data?.juegos?.length) {
            throw new Error('No se encontraron juegos');
        }
        
        container.innerHTML = '';
        data.juegos.forEach(juego => {
            const game = mapearJuego(juego);
            container.appendChild(crearGameCard(game));
        });
    } catch (error) {
        console.error('Error cargando recomendados:', error);
        container.innerHTML = '<p class="error-msg">Error al cargar recomendados.</p>';
    }
}

// --- CARGAR RECIENTES (Carousel inferior) ---
async function cargarRecientes() {
    const container = document.getElementById('carousel');
    container.innerHTML = '<p class="loading-msg">Cargando descuentos...</p>';
    
    try {
        const res = await fetch(API_URL_RECIENTES);
        const { success, data } = await res.json();
        
        if (!success || !data?.juegos?.length) {
            throw new Error('No se encontraron descuentos');
        }
        
        container.innerHTML = '';
        data.juegos.forEach(juego => {
            const game = mapearJuego(juego);
            container.appendChild(crearGameCard(game));
        });
        
        initCarousel();
    } catch (error) {
        console.error('Error cargando recientes:', error);
        container.innerHTML = '<p class="error-msg">Error al cargar descuentos.</p>';
    }
}

// --- CREAR HERO CARD ---
function crearHeroCard(game) {
    const template = document.getElementById('hero-template');
    const card = template.content.cloneNode(true);
    
    const img = card.querySelector('.hero-image');
    img.src = obtenerImagenHero(game);
    img.alt = game.title;
    img.onerror = () => handleImageError(img, game);
    
    card.querySelector('.hero-title').textContent = game.title;
    card.querySelector('.hero-current-price').textContent = 
        `$${parseFloat(game.salePrice).toFixed(2)}`;
    
    const originalPrice = card.querySelector('.hero-original-price');
    if (game.salePrice < game.normalPrice) {
        originalPrice.textContent = `$${parseFloat(game.normalPrice).toFixed(2)}`;
        originalPrice.style.display = 'inline';
    } else {
        originalPrice.style.display = 'none';
    }
    
    // const rating = card.querySelector('.hero-rating');
    // if (game.rating) {
    //     rating.textContent = `⭐ ${game.rating}/5`;
    //     rating.style.display = 'block';
    // } else {
    //     rating.style.display = 'none';
    // }
    
    card.querySelector('.btn').onclick = () => navigateToGame(game.gameID);
    
    return card;
}

// --- CREAR GAME CARD ---
function crearGameCard(game) {
    const template = document.getElementById('card-template');
    const card = template.content.cloneNode(true);
    
    const img = card.querySelector('.game-image img');
    img.src = obtenerImagenCard(game);
    img.alt = game.title;
    img.onerror = () => handleImageError(img, game);
    
    const badge = card.querySelector('.badge-discount');
    if (game.salePrice >= game.normalPrice) {
        badge.style.display = 'none';
    }
    
    card.querySelector('.game-title').textContent = game.title;
    
    // const ratingEl = card.querySelector('.game-rating');
    // if (game.rating) {
    //     ratingEl.textContent = `⭐ ${game.rating}`;
    // } else {
    //     ratingEl.textContent = 'Sin valoración';
    // }
    
    const genresEl = card.querySelector('.game-genres');
    if (game.genres?.length > 0) {
        genresEl.textContent = game.genres.slice(0, 2).join(', ');
        genresEl.style.display = 'block';
    } else {
        genresEl.style.display = 'none';
    }
    
    card.querySelector('.price-current').textContent = 
        `$${parseFloat(game.salePrice).toFixed(2)}`;
    
    const originalPrice = card.querySelector('.price-original');
    if (game.salePrice < game.normalPrice) {
        originalPrice.textContent = `$${parseFloat(game.normalPrice).toFixed(2)}`;
        originalPrice.style.display = 'inline';
    } else {
        originalPrice.style.display = 'none';
    }
    
    card.querySelector('.btn').onclick = () => navigateToGame(game.gameID);
    
    return card;
}

// --- INICIALIZAR HERO CAROUSEL ---
function initHeroCarousel() {
    const carousel = document.querySelector('.hero-carousel');
    const prevBtn = document.querySelector('.hero-prev-btn');
    const nextBtn = document.querySelector('.hero-next-btn');
    
    if (!carousel || !prevBtn || !nextBtn) return;
    
    prevBtn.addEventListener('click', () => {
        carousel.scrollBy({ 
            left: -carousel.offsetWidth, 
            behavior: 'smooth' 
        });
    });
    
    nextBtn.addEventListener('click', () => {
        carousel.scrollBy({ 
            left: carousel.offsetWidth, 
            behavior: 'smooth' 
        });
    });
}

// --- INICIALIZAR CAROUSEL INFERIOR ---
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (!carousel || !prevBtn || !nextBtn) return;
    
    prevBtn.addEventListener('click', () => {
        carousel.scrollBy({ 
            left: -300, 
            behavior: 'smooth' 
        });
    });
    
    nextBtn.addEventListener('click', () => {
        carousel.scrollBy({ 
            left: 300, 
            behavior: 'smooth' 
        });
    });
}

// --- NAVEGACIÓN ---
function navigateToGame(gameId) {
    sessionStorage.setItem('gameID', `${gameId}`);
    window.location.href = '/app/?page=juego';
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHome);
} else {
    initializeHome();
}