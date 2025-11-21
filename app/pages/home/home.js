function getUserId() {
    var userId = sessionStorage.getItem('userId') || null; 
    return userId;
}

const API_URL_RECIENTES = `${window.API_BASE_URL}/games/deals/recent?pageSize=12`;
const API_URL_POPULARES = `${window.API_BASE_URL}/games/deals/popular?pageSize=10`;

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
    
    // Botón favorito
    const btnFavorite = card.querySelector('.btn-hero-favorite');
    btnFavorite.onclick = async (e) => {
        e.stopPropagation();
        await toggleQuickFavorite(btnFavorite, game);
    };
    checkAndUpdateFavoriteButton(btnFavorite, game.gameID);
    
    // Botón biblioteca
    const btnLibrary = card.querySelector('.btn-hero-library');
    btnLibrary.onclick = async (e) => {
        e.stopPropagation();
        await toggleQuickLibrary(btnLibrary, game);
    };
    checkAndUpdateLibraryButton(btnLibrary, game.gameID);
    
    // Botón ver detalles
    card.querySelector('.btn').onclick = () => navigateToGame(game.gameID);
    
    return card;
}

// --- CREAR GAME CARD (SIN botón de alerta individual) ---
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
    
    // Botón favorito
    const btnFavorite = card.querySelector('.btn-card-favorite');
    btnFavorite.onclick = async (e) => {
        e.stopPropagation();
        await toggleQuickFavorite(btnFavorite, game);
    };
    checkAndUpdateFavoriteButton(btnFavorite, game.gameID);
    
    // Botón biblioteca
    const btnLibrary = card.querySelector('.btn-card-library');
    btnLibrary.onclick = async (e) => {
        e.stopPropagation();
        await toggleQuickLibrary(btnLibrary, game);
    };
    checkAndUpdateLibraryButton(btnLibrary, game.gameID);
    
    // Botón ver detalles
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

//=============================================
// FAVORITOS Y BIBLIOTECA CON NOTIFICACIONES AUTOMÁTICAS
//=============================================

// Convertir game object a formato para API
function gameToApiFormat(game) {
    return {
        idSteam: game.gameID,
        nombre: game.title,
        portada: game.thumbOriginal || game.steamHeader || game.thumb || null,
        generos: game.genres || [],
        plataformas: [] 
    };
}

// ========== FAVORITOS CON NOTIFICACIONES ==========

async function toggleQuickFavorite(btn, game) {
    const userId = getUserId();
    if (!userId) {
        showAlert('Debes iniciar sesión para agregar favoritos', 'warning');
        return;
    }

    btn.disabled = true;
    const icon = btn.querySelector('i');
    const wasActive = btn.classList.contains('active');

    try {
        if (wasActive) {
            const success = await eliminarFavorito(game.gameID);
            if (success) {
                btn.classList.remove('active');
                icon.className = 'far fa-heart';
                showAlert('Eliminado de favoritos', 'success');
            }
        } else {
            const success = await agregarFavorito(gameToApiFormat(game));
            if (success) {
                btn.classList.add('active');
                icon.className = 'fas fa-heart';
                showAlert('¡Agregado a favoritos!', 'success'); // ← SIN mensaje de notificaciones
                
                // CREAR PREFERENCIA DE NOTIFICACIÓN AUTOMÁTICA (silencioso)
                await crearPreferenciaAutomatica(game, userId);
            }
        }
    } catch (error) {
        showAlert('Error al actualizar favoritos', 'error');
    } finally {
        btn.disabled = false;
    }
}

// NUEVA FUNCIÓN: Crear alerta de EMAIL automática al agregar a favoritos
async function crearPreferenciaAutomatica(game, userId) {
    try {
        // Configuración por defecto: 10% descuento mínimo, sin límite de precio
        // Solo envía EMAIL cuando hay descuentos, NO notificaciones in-app
        const response = await fetch(
            `${window.API_BASE_URL}/notificaciones/preferences`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    gameData: {
                        idSteam: game.gameID,
                        nombre: game.title,
                        portada: game.thumbOriginal || game.steamHeader || game.thumb
                    },
                    preferences: {
                        descuentoMinimo: 10,  // 10% descuento mínimo
                        precioMaximo: null,   // Sin límite de precio
                        notificarPorEmail: true,  // EMAIL activado
                        notificarInApp: false     // Notificaciones in-app DESACTIVADAS
                    }
                })
            }
        );

        const result = await response.json();

        if (result.success) {
            console.log('✅ Alerta de email configurada para:', game.title);
        } else {
            console.warn('⚠️ No se pudo configurar alerta de email:', result.error);
        }

    } catch (error) {
        console.error('Error configurando alerta de email:', error);
        // No mostramos error al usuario, es una acción secundaria
    }
}

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

async function verificarFavorito(idSteam) {
    try {
        const userId = getUserId();
        const response = await fetch(`${window.API_BASE_URL}/favoritos/${userId}/check/${idSteam}`);
        const result = await response.json();
        return result.isFavorite || false;
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        return false;
    }
}

async function agregarFavorito(gameData) {
    try {
        const userId = getUserId();
        const response = await fetch(`${window.API_BASE_URL}/favoritos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                ...gameData
            })
        });

        const result = await response.json();
        
        if (!result.success) {
            if (result.error && result.error.includes('ya está en favoritos')) {
                showAlert('Este juego ya está en tus favoritos', 'info');
                return true;
            }
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

async function eliminarFavorito(idSteam) {
    try {
        const userId = getUserId();
        const response = await fetch(`${window.API_BASE_URL}/favoritos/${userId}/${idSteam}`, {
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

// ========== BIBLIOTECA ==========

async function toggleQuickLibrary(btn, game) {
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
            const success = await eliminarBiblioteca(game.gameID);
            if (success) {
                btn.classList.remove('active');
                icon.className = 'far fa-bookmark';
                showAlert('Eliminado de biblioteca', 'success');
            }
        } else {
            const success = await agregarBiblioteca(gameToApiFormat(game));
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
        const response = await fetch(`${window.API_BASE_URL}/biblioteca/${userId}/check/${idSteam}`);
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
        const response = await fetch(`${window.API_BASE_URL}/biblioteca`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                ...gameData
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
        const response = await fetch(`${window.API_BASE_URL}/biblioteca/${userId}/${idSteam}`, {
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