const pageSize = 20;
const API_URL_RECIENTES = `http://localhost:3000/api/descuentos?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;
const API_URL_POPULARES = `http://localhost:3000/api/descuentos/populares?pageSize=${pageSize}&pageNumber=0&idsTiendas=1,25`;

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

// --- Templates visuales ---

function heroTemplate(game) {
    return `
        <div class="hero-slide">
            <img src="${game.thumb}" alt="${game.title}" class="hero-image">
            <div class="hero-overlay">
                <h3 class="hero-title">${game.title}</h3>
                <p class="hero-price">
                    $${parseFloat(game.salePrice).toFixed(2)}
                    ${game.salePrice < game.normalPrice ? `<span class="hero-original-price">$${parseFloat(game.normalPrice).toFixed(2)}</span>` : ""}
                </p>
                <button class="btn btn-primary" onclick="navigateToGame('${game.id}')">Ver Detalles</button>
            </div>
        </div>
    `;
}

function cardTemplate(game) {
    return `
        <div class="game-card">
            <div class="game-image">
                <img src="${game.thumb}" alt="${game.title}">
                ${game.salePrice < game.normalPrice ? '<span class="game-badge badge-discount">Oferta</span>' : ''}
            </div>
            <div class="game-content">
                <h3 class="game-title">${game.title}</h3>
                <div class="game-rating">${game.steamRatingText || "Sin valoración"}</div>
                <div class="game-price">
                    <span class="price-current">$${parseFloat(game.salePrice).toFixed(2)}</span>
                    ${game.salePrice < game.normalPrice ? `<span class="price-original">$${parseFloat(game.normalPrice).toFixed(2)}</span>` : ""}
                </div>
                <button class="btn btn-primary" onclick="navigateToGame('${game.id}')">Ver Detalles</button>
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

initializeHome();
