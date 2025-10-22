const pageSize = 20;
const API_URL_RECIENTES =``
    //`http://localhost:3000/api/descuentos?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;
const API_URL_POPULARES = ``
    //`http://localhost:3000/api/descuentos/populares?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;

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
        
        container.innerHTML = '';
        data.slice(0, 5).forEach(game => {
            container.appendChild(crearHeroCard(game));
        });
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
        
        container.innerHTML = '';
        data.slice(0, 12).forEach(game => {
            container.appendChild(crearGameCard(game));
        });
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
        
        container.innerHTML = '';
        data.slice(0, 20).forEach(game => {
            container.appendChild(crearGameCard(game));
        });
        initCarousel();
    } catch {
        container.innerHTML = "<p class='error-msg'>Error al cargar los descuentos.</p>";
    }
}

// --- FUNCIONES DE UTILIDAD PARA IMÁGENES ---
function obtenerMejorImagen(game) {
    if (game.imagenHD) return game.imagenHD;
    if (game.thumb) return game.thumb;
    if (game.thumbOriginal) return game.thumbOriginal;
    return 'https://via.placeholder.com/616x353?text=Sin+Imagen';
}

function obtenerMejorImagenMiniatura(game) {
    if (game.thumbOriginal) return game.thumbOriginal;
    if (game.imagenHD) return game.imagenHD;
    if (game.thumb) return game.thumb;
    return 'https://via.placeholder.com/616x353?text=Sin+Imagen';
}

function handleImageError(event) {
    const img = event.target;
    const game = JSON.parse(img.dataset.game || '{}');

    if (game.thumbOriginal && img.src !== game.thumbOriginal) {
        img.src = game.thumbOriginal;
        return;
    }

    img.src = 'https://via.placeholder.com/616x353?text=Sin+Imagen';
    img.alt = 'Imagen no disponible';
}

// --- Creación de elementos desde templates ---
function crearHeroCard(game) {
    const template = document.getElementById('hero-template');
    const card = template.content.cloneNode(true);
    
    const img = card.querySelector('.hero-image');
    img.src = obtenerMejorImagen(game);
    img.alt = game.title;
    img.dataset.game = JSON.stringify({
        thumbOriginal: game.thumbOriginal,
        thumb: game.thumb
    });
    img.onerror = handleImageError;
    
    card.querySelector('.hero-title').textContent = game.title;
    card.querySelector('.hero-current-price').textContent = `$${parseFloat(game.salePrice).toFixed(2)}`;
    
    const originalPrice = card.querySelector('.hero-original-price');
    if (game.salePrice < game.normalPrice) {
        originalPrice.textContent = `$${parseFloat(game.normalPrice).toFixed(2)}`;
        originalPrice.style.display = 'inline';
    } else {
        originalPrice.style.display = 'none';
    }
    
    const rating = card.querySelector('.hero-rating');
    if (game.rawgRating) {
        rating.textContent = `⭐ ${game.rawgRating}/5`;
        rating.style.display = 'block';
    } else {
        rating.style.display = 'none';
    }
    
    card.querySelector('.btn').onclick = () => navigateToGame(game.gameID);
    
    return card;
}

function crearGameCard(game) {
    const template = document.getElementById('card-template');
    const card = template.content.cloneNode(true);
    
    const img = card.querySelector('.game-image img');
    img.src = obtenerMejorImagenMiniatura(game);
    img.alt = game.title;
    img.dataset.game = JSON.stringify({
        thumbOriginal: game.thumbOriginal,
        thumb: game.thumb
    });
    img.onerror = handleImageError;
    
    const badge = card.querySelector('.badge-discount');
    if (game.salePrice >= game.normalPrice) {
        badge.style.display = 'none';
    }
    
    card.querySelector('.game-title').textContent = game.title;
    
    const ratingEl = card.querySelector('.game-rating');
    if (game.steamRatingText || game.rawgRating) {
        ratingEl.textContent = `${game.steamRatingText || ''} ${game.rawgRating ? `⭐ ${game.rawgRating}` : ''}`;
    } else {
        ratingEl.textContent = 'Sin valoración';
    }
    
    const genresEl = card.querySelector('.game-genres');
    if (game.rawgGenres && game.rawgGenres.length > 0) {
        genresEl.textContent = game.rawgGenres.slice(0, 2).join(', ');
        genresEl.style.display = 'block';
    } else {
        genresEl.style.display = 'none';
    }
    
    card.querySelector('.price-current').textContent = `$${parseFloat(game.salePrice).toFixed(2)}`;
    
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