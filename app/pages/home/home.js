const pageSize = 20;
const API_URL_RECIENTES =
    `http://localhost:3000/api/descuentos?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;
const API_URL_POPULARES =
    `http://localhost:3000/api/descuentos/populares?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;

async function initializeHome() {
    await Promise.all([cargarPopulares(), cargarLista(), cargarRecientes()]);
}

// --- POPULARES (Hero grande) ---
async function cargarPopulares() {
const container = document.getElementById("heroCarousel");
container.innerHTML = `<p class="loading-msg">Cargando juegos populares...</p>`;
try {
    const res = await fetch(API_URL_POPULARES);
    const { success, data } = await res.json();
    if (!success || !data) throw new Error();
    container.innerHTML = data.slice(0, 5).map(heroTemplate).join("");
    initHeroCarousel();
} catch {
    container.innerHTML = "<p class='error-msg'>Error al cargar juegos populares.</p>";
}
}

// --- LISTA 4x3 ---
async function cargarLista() {
const container = document.getElementById("gamesList");
container.innerHTML = `<p class="loading-msg">Cargando juegos...</p>`;
try {
    const res = await fetch(API_URL_RECIENTES);
    const { success, data } = await res.json();
    if (!success || !data) throw new Error();
    container.innerHTML = data.slice(0, 12).map(cardTemplate).join("");
} catch {
    container.innerHTML = "<p class='error-msg'>Error al cargar la lista de juegos.</p>";
}
}

// --- CARRUSEL INFERIOR ---
async function cargarRecientes() {
const container = document.getElementById("carousel");
container.innerHTML = `<p class="loading-msg">Cargando descuentos...</p>`;
try {
    const res = await fetch(API_URL_RECIENTES);
    const { success, data } = await res.json();
    if (!success || !data) throw new Error();
    container.innerHTML = data.slice(0, 20).map(cardTemplate).join("");
    initCarousel();
} catch {
    container.innerHTML = "<p class='error-msg'>Error al cargar los descuentos.</p>";
}
}

// --- FUNCIONES DE UTILIDAD PARA IMÁGENES ---

/**
 * Obtiene la mejor imagen disponible con fallback inteligente
 * @param {Object} game - Objeto del juego
 * @returns {string} - URL de la imagen a usar
 */
function obtenerMejorImagen(game) {
if (game.imagenHD) {
    return game.imagenHD;
}
if (game.thumb) {
    return game.thumb;
}
if (game.thumbOriginal) {
    return game.thumbOriginal;
}
return 'https://via.placeholder.com/616x353?text=Sin+Imagen';
}

/**
 * Obtiene la imagen original 
 * @param {Object} game - Objeto del juego
 * @returns {string} - URL de la imagen a usar
 */
function obtenerMejorImagenMiniatura(game) {
if (game.thumbOriginal) {
    return game.thumbOriginal;
}
if (game.imagenHD) {
    return game.imagenHD;
}
if (game.thumb) {
    return game.thumb;
}

return 'https://via.placeholder.com/616x353?text=Sin+Imagen';
}

/**
 * Maneja errores de carga de imagen con fallback
 * @param {Event} event - Evento de error de la imagen
 */
function handleImageError(event) {
const img = event.target;
const game = JSON.parse(img.dataset.game || '{}');

// Intentar con imagen original si existe
if (game.thumbOriginal && img.src !== game.thumbOriginal) {
    img.src = game.thumbOriginal;
    return;
}

// Último recurso: placeholder
img.src = 'https://via.placeholder.com/616x353?text=Sin+Imagen';
img.alt = 'Imagen no disponible';
}

/**
 * Añade badge de calidad de imagen para debugging (opcional)
 * @param {Object} game - Objeto del juego
 * @returns {string} - HTML del badge o string vacío
 */
function imageBadge(game) {
if (!game.imageSource) return '';

const badges = {
    steam: '<span class="image-badge badge-steam" title="Imagen de Steam">🎮</span>',
    rawg: '<span class="image-badge badge-rawg" title="Imagen de RAWG">🌐</span>',
    cheapshark: '<span class="image-badge badge-cheapshark" title="Imagen Original">📦</span>'
};

// Descomentar para ver el origen de las imágenes
// return badges[game.imageSource] || '';
return ''; // Comentar esta línea para ver los badges
}

// --- Templates visuales ---
function heroTemplate(game) {
    const imagenUrl = obtenerMejorImagen(game);
    const gameData = JSON.stringify({
        thumbOriginal: game.thumbOriginal,
        thumb: game.thumb
    });
    
    return `
        <div class="hero-slide">
        <img 
            src="${imagenUrl}" 
            alt="${game.title}" 
            class="hero-image"
            data-game='${gameData}'
            onerror="handleImageError(event)"
            loading="lazy"
        >
        ${imageBadge(game)}
        <div class="hero-overlay">
            <h3 class="hero-title">${game.title}</h3>
            <p class="hero-price">
            $${parseFloat(game.salePrice).toFixed(2)}
            ${game.salePrice < game.normalPrice ? `<span class="hero-original-price">$${parseFloat(game.normalPrice).toFixed(2)}</span>` : ""}
            </p>
            ${game.rawgRating ? `<div class="hero-rating">⭐ ${game.rawgRating}/5</div>` : ''}
            <button class="btn btn-primary" onclick="navigateToGame('${game.gameID}')">Ver Detalles</button>
        </div>
        </div>
    `;
}

function cardTemplate(game) {
    const imagenUrl = obtenerMejorImagenMiniatura(game);
    const gameData = JSON.stringify({
        thumbOriginal: game.thumbOriginal,
        thumb: game.thumb
    });

    //esto iba en linea 186 despues de ${game.salePrice < game.normalPrice ? ....
    //${game.savings ? `<span class="game-badge badge-savings">-${Math.round(game.savings)}%</span>` : ''}

    return `
        <div class="game-card">
        <div class="game-image">
            <img 
            src="${imagenUrl}" 
            alt="${game.title}"
            data-game='${gameData}'
            onerror="handleImageError(event)"
            loading="lazy"
            >
            ${imageBadge(game)}
            ${game.salePrice < game.normalPrice ? '<span class="game-badge badge-discount">Oferta</span>' : ''}
        </div>
        <div class="game-content">
            <h3 class="game-title">${game.title}</h3>
            <div class="game-info">
            <div class="game-rating">
                ${game.steamRatingText || game.rawgRating ? 
                `${game.steamRatingText || ''} ${game.rawgRating ? `⭐ ${game.rawgRating}` : ''}` : 
                "Sin valoración"}
            </div>
            ${game.rawgGenres && game.rawgGenres.length > 0 ? 
                `<div class="game-genres">${game.rawgGenres.slice(0, 2).join(', ')}</div>` : ''}
            </div>
            <div class="game-price">
            <span class="price-current">$${parseFloat(game.salePrice).toFixed(2)}</span>
            ${game.salePrice < game.normalPrice ? 
                `<span class="price-original">$${parseFloat(game.normalPrice).toFixed(2)}</span>` : ""}
            </div>
            <button class="btn btn-primary" onclick="navigateToGame('${game.gameID}')">Ver Detalles</button>
        </div>
        </div>
    `;
}

// --- Carruseles ---
function initHeroCarousel() {
    const carousel = document.querySelector(".hero-carousel");
    const prevBtn = document.querySelector(".hero-prev-btn");
    const nextBtn = document.querySelector(".hero-next-btn");
    
    prevBtn.addEventListener("click", () => {
        carousel.scrollBy({ left: -window.innerWidth * 0.9, behavior: "smooth" });
    });
    
    nextBtn.addEventListener("click", () => {
        carousel.scrollBy({ left: window.innerWidth * 0.9, behavior: "smooth" });
    });
}

function initCarousel() {
    const carousel = document.querySelector(".carousel");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    
    prevBtn.addEventListener("click", () => {
        carousel.scrollBy({ left: -320, behavior: "smooth" });
    });
    
    nextBtn.addEventListener("click", () => {
        carousel.scrollBy({ left: 320, behavior: "smooth" });
    });
}

function navigateToGame(gameId) {
window.location.href = `/game/${gameId}`;
}

initializeHome();