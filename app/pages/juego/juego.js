const gameState = {
    gameId: null,
    currentSlide: 0,
    totalSlides: 0,
    gameData: null
};

const API_BASE = 'http://localhost:3000/api';

let currentGameData = null;
let isFavorite = false;
let isInLibrary = false;

async function initializeJuego() {
    gameState.gameId = sessionStorage.getItem('gameID');
    
    if (!gameState.gameId) {
        showError('No se especificó un juego para mostrar');
        return;
    }

    await loadGameData();
}

async function loadGameData() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/games/${gameState.gameId}`);
        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error('Error al cargar datos del juego');
        }

        gameState.gameData = result.data;
        currentGameData = result.data;

        renderGameDetails();
        showLoading(false);
        
        // CORRECCIÓN: Esperar un poco para que el DOM se renderice
        setTimeout(async () => {
            await initFavoriteButton();
        }, 100);

    } catch (error) {
        console.error('Error loading game:', error);
        showError('No se pudo cargar la información del juego');
    }
}

function renderGameDetails() {
    const page = document.getElementById('gamePage');
    page.innerHTML = '';

    renderTitle();
    renderCarousel();
    renderPriceSection();
    renderDescription();
    renderFeatures();
    renderRequirements();
}

function renderTitle() {
    const template = document.getElementById('title-section-template');
    const section = template.content.cloneNode(true);
    const game = gameState.gameData;

    // CORRECCIÓN: Crear el wrapper con los botones
    const titleHeader = document.createElement('div');
    titleHeader.className = 'title-header';
    
    const titleElement = section.querySelector('.game-title');
    titleElement.textContent = game.nombre;
    
    // Crear botones de acción
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'game-actions-quick';
    actionsDiv.innerHTML = `
        <button 
            id="btnFavorite" 
            class="btn-icon-action btn-favorite-toggle"
            title="Agregar a favoritos"
        >
            <i class="far fa-heart"></i>
        </button>
        
        <button 
            id="btnLibrary" 
            class="btn-icon-action btn-library-toggle"
            title="Agregar a biblioteca"
        >
            <i class="far fa-bookmark"></i>
        </button>
    `;
    
    titleHeader.appendChild(titleElement);
    titleHeader.appendChild(actionsDiv);
    
    const metadata = section.querySelector('.game-metadata');
    
    if (game.fechaLanzamiento) {
        addMetadataItem(metadata, 'fas fa-calendar', game.fechaLanzamiento);
    }
    
    if (game.desarrollador?.length) {
        addMetadataItem(metadata, 'fas fa-code', game.desarrollador.join(', '));
    }
    
    if (game.publicador?.length) {
        addMetadataItem(metadata, 'fas fa-building', game.publicador.join(', '));
    }

    // Insertar el titleHeader antes del metadata
    const titleSection = section.querySelector('.title-section');
    titleSection.insertBefore(titleHeader, titleSection.firstChild);

    document.getElementById('gamePage').appendChild(section);
}

function addMetadataItem(container, iconClass, text) {
    const template = document.getElementById('metadata-item-template');
    const item = template.content.cloneNode(true);
    
    item.querySelector('i').className = iconClass;
    item.querySelector('span').textContent = text;
    
    container.appendChild(item);
}

function renderCarousel() {
    const template = document.getElementById('carousel-section-template');
    const section = template.content.cloneNode(true);
    const game = gameState.gameData;

    const track = section.querySelector('.carousel-track');
    const indicators = section.querySelector('.carousel-indicators');

    const media = [];

    // Add screenshots
    if (game.imagenes?.screenshotsSteam?.length) {
        game.imagenes.screenshotsSteam.forEach(screenshot => {
            media.push({ type: 'image', url: screenshot.full });
        });
    } else if (game.imagenes?.screenshots?.length) {
        game.imagenes.screenshots.forEach(screenshot => {
            media.push({ type: 'image', url: screenshot.fullHD });
        });
    }

    // Add videos
    if (game.videos?.length) {
        game.videos.forEach(video => {
            media.push({ type: 'video', url: video.mp4, poster: video.thumbnail });
        });
    }

    gameState.totalSlides = media.length;

    media.forEach((item, index) => {
        if (item.type === 'image') {
            const slideTemplate = document.getElementById('carousel-slide-template');
            const slide = slideTemplate.content.cloneNode(true);
            const img = slide.querySelector('img');
            img.src = item.url;
            img.alt = `${game.nombre} - Screenshot ${index + 1}`;
            track.appendChild(slide);
        } else if (item.type === 'video') {
            const videoTemplate = document.getElementById('carousel-video-template');
            const slide = videoTemplate.content.cloneNode(true);
            const video = slide.querySelector('video');
            const source = video.querySelector('source');
            source.src = item.url;
            if (item.poster) video.poster = item.poster;
            track.appendChild(slide);
        }

        const indicatorTemplate = document.getElementById('carousel-indicator-template');
        const indicator = indicatorTemplate.content.cloneNode(true);
        const btn = indicator.querySelector('.indicator');
        if (index === 0) btn.classList.add('active');
        btn.onclick = () => goToSlide(index);
        indicators.appendChild(indicator);
    });

    const prevBtn = section.querySelector('.carousel-btn.prev');
    const nextBtn = section.querySelector('.carousel-btn.next');
    prevBtn.onclick = () => changeSlide(-1);
    nextBtn.onclick = () => changeSlide(1);

    document.getElementById('gamePage').appendChild(section);
}

function changeSlide(direction) {
    gameState.currentSlide += direction;
    if (gameState.currentSlide < 0) gameState.currentSlide = gameState.totalSlides - 1;
    if (gameState.currentSlide >= gameState.totalSlides) gameState.currentSlide = 0;
    updateCarousel();
}

function goToSlide(index) {
    gameState.currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.querySelector('.carousel-track');
    const indicators = document.querySelectorAll('.indicator');
    
    track.style.transform = `translateX(-${gameState.currentSlide * 100}%)`;
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === gameState.currentSlide);
    });
}

function renderPriceSection() {
    const game = gameState.gameData;

    if (!game.linksCompra?.length) return;

    const template = document.getElementById('price-section-template');
    const section = template.content.cloneNode(true);
    const container = section.querySelector('.purchase-options');

    const secondaryLinks = game.linksCompra.filter(link => !link.esPrincipal);

    if (secondaryLinks.length > 0) {
        secondaryLinks.forEach(link => {
            const cardTemplate = document.getElementById('purchase-card-template');
            const card = cardTemplate.content.cloneNode(true);

            card.querySelector('.store-name').textContent = link.tienda;

            if (link.precio !== null) {
                card.querySelector('.current-price').textContent = `$${link.precio.toFixed(2)}`;
            } else {
                card.querySelector('.current-price').textContent = 'Ver precio';
            }

            if (game.precioNormal && link.precio < game.precioNormal) {
                card.querySelector('.original-price').textContent = `$${game.precioNormal.toFixed(2)}`;
                card.querySelector('.discount-badge').textContent = `-${Math.round(link.descuento)}%`;
            } else {
                card.querySelector('.original-price').remove();
                card.querySelector('.discount-badge').remove();
            }

            card.querySelector('.btn-buy').href = link.url;

            container.appendChild(card);
        });
    } else {
        const mainLink = game.linksCompra.find(link => link.esPrincipal);
        if (mainLink) {
            const cardTemplate = document.getElementById('purchase-card-template');
            const card = cardTemplate.content.cloneNode(true);

            card.querySelector('.store-name').textContent = mainLink.tienda;

            const precio = mainLink.precio ?? game.precio ?? game.precioNormal;
            const descuento = mainLink.descuento ?? game.descuento ?? 0;

            if (precio !== null) {
                card.querySelector('.current-price').textContent = `$${precio.toFixed(2)}`;
            } else {
                card.querySelector('.current-price').textContent = 'Ver precio';
            }

            if (game.precioNormal && descuento > 0) {
                const precioNormal = game.precioNormal;
                card.querySelector('.original-price').textContent = `$${precioNormal.toFixed(2)}`;
                card.querySelector('.discount-badge').textContent = `-${Math.round(descuento)}%`;
            } else {
                card.querySelector('.original-price').remove();
                card.querySelector('.discount-badge').remove();
            }

            card.querySelector('.btn-buy').href = mainLink.url;

            container.appendChild(card);
        }
    }

    document.getElementById('gamePage').appendChild(section);
}

function renderDescription() {
    const game = gameState.gameData;
    
    if (!game.descripcion) return;

    const template = document.getElementById('description-section-template');
    const section = template.content.cloneNode(true);
    
    section.querySelector('.description-content').innerHTML = game.descripcion;

    document.getElementById('gamePage').appendChild(section);
}

function renderFeatures() {
    const game = gameState.gameData;
    const template = document.getElementById('features-section-template');
    const section = template.content.cloneNode(true);
    const grid = section.querySelector('.feature-grid');

    if (game.generos?.length) {
        addFeatureGroup(grid, 'fas fa-gamepad', 'Géneros', game.generos);
    }

    if (game.categorias?.length) {
        addFeatureGroup(grid, 'fas fa-th-large', 'Categorías', game.categorias);
    }

    if (game.tags?.length) {
        addFeatureGroup(grid, 'fas fa-tags', 'Etiquetas', game.tags.slice(0, 15));
    }

    if (game.plataformas?.length) {
        addFeatureGroup(grid, 'fas fa-desktop', 'Plataformas', game.plataformas);
    }

    if (game.idiomas?.length) {
        const languages = game.idiomas.map(l => l.idioma).filter(l => l !== '*');
        if (languages.length) {
            addFeatureGroup(grid, 'fas fa-language', 'Idiomas', languages);
        }
    }

    document.getElementById('gamePage').appendChild(section);
}

function addFeatureGroup(container, icon, title, items) {
    const template = document.getElementById('feature-group-template');
    const group = template.content.cloneNode(true);
    
    const titleEl = group.querySelector('.feature-group-title');
    titleEl.innerHTML = `<i class="${icon}"></i> ${title}`;
    
    const badgeContainer = group.querySelector('.badge-container');
    
    items.forEach(item => {
        const badgeTemplate = document.getElementById('badge-template');
        const badge = badgeTemplate.content.cloneNode(true);
        badge.querySelector('.badge').textContent = item;
        badgeContainer.appendChild(badge);
    });

    container.appendChild(group);
}

function renderRequirements() {
    const game = gameState.gameData;
    
    if (!game.requisitosMinimos && !game.requisitosRecomendados) return;

    const template = document.getElementById('requirements-section-template');
    const section = template.content.cloneNode(true);

    const minContent = section.querySelector('.minimum .requirements-content');
    const recContent = section.querySelector('.recommended .requirements-content');

    if (game.requisitosMinimos) {
        parseRequirements(game.requisitosMinimos, minContent);
    } else {
        minContent.innerHTML = '<p style="color: #888;">No se especifica.</p>';
    }

    if (game.requisitosRecomendados) {
        parseRequirements(game.requisitosRecomendados, recContent);
    } else {
        recContent.innerHTML = '<p style="color: #888;">No se especifica.</p>';
    }

    document.getElementById('gamePage').appendChild(section);
}

function parseRequirements(htmlString, container) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;

    const items = temp.querySelectorAll('li');
    
    items.forEach(item => {
        const text = item.textContent.trim();
        const parts = text.split(':');
        
        if (parts.length >= 2) {
            const template = document.getElementById('requirement-item-template');
            const reqItem = template.content.cloneNode(true);
            
            reqItem.querySelector('.req-label').textContent = parts[0].trim() + ':';
            reqItem.querySelector('.req-value').textContent = parts.slice(1).join(':').trim();
            
            container.appendChild(reqItem);
        }
    });
}

// CORRECCIÓN: Mejorar las funciones de loading y error
function showLoading(show) {
    const loadingEl = document.getElementById('loadingState');
    const errorEl = document.getElementById('errorState');
    
    if (loadingEl) loadingEl.style.display = show ? 'flex' : 'none';
    if (errorEl) errorEl.style.display = 'none';
}

function showError(message) {
    const errorEl = document.getElementById('errorState');
    const errorMsgEl = document.getElementById('errorMessage');
    const loadingEl = document.getElementById('loadingState');
    
    if (errorMsgEl) errorMsgEl.textContent = message;
    if (errorEl) errorEl.style.display = 'flex';
    if (loadingEl) loadingEl.style.display = 'none';
}

//=============================================
// FAVORITOS
//=============================================

async function initFavoriteButton() {
    const userId = getUserId();
    if (!userId) return;
    
    const btn = document.getElementById('btnFavorite');
    if (!btn) {
        console.warn('Botón de favoritos no encontrado');
        return;
    }
    
    // Verificar si está en favoritos
    isFavorite = await verificarFavorito(currentGameData.idSteam);
    updateFavoriteButton();
    
    // Agregar event listener al botón
    btn.onclick = toggleFavorite;
    
    // Botón de biblioteca (placeholder)
    const btnLibrary = document.getElementById('btnLibrary');
    if (btnLibrary) {
        btnLibrary.onclick = () => {
            showAlert('Sistema de biblioteca próximamente', 'info');
        };
    }
}

function updateFavoriteButton() {
    const btn = document.getElementById('btnFavorite');
    if (!btn) return;

    if (isFavorite) {
        btn.classList.add('active');
        btn.title = 'Quitar de favoritos';
        btn.querySelector('i').className = 'fas fa-heart';
    } else {
        btn.classList.remove('active');
        btn.title = 'Agregar a favoritos';
        btn.querySelector('i').className = 'far fa-heart';
    }
}

async function toggleFavorite() {
    if (!currentGameData) return;
    
    const userId = getUserId();
    if (!userId) {
        showAlert('Debes iniciar sesión para agregar favoritos', 'warning');
        return;
    }

    const btn = document.getElementById('btnFavorite');
    btn.disabled = true;

    try {
        if (isFavorite) {
            // ELIMINAR de favoritos
            const success = await eliminarFavorito(currentGameData.idSteam);
            if (success) {
                isFavorite = false;
                showAlert('Eliminado de favoritos', 'success');
            }
        } else {
            // AGREGAR a favoritos
            const success = await agregarFavorito(currentGameData);
            if (success) {
                isFavorite = true;
                showAlert('¡Agregado a favoritos! ❤️', 'success');
            }
        }
        updateFavoriteButton();
    } catch (error) {
        showAlert('Error al actualizar favoritos', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function verificarFavorito(idSteam) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE}/favoritos/${userId}/check/${idSteam}`);
        const result = await response.json();
        return result.isFavorite || false;
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        return false;
    }
}

// CORRECCIÓN: Manejar el error "ya está en favoritos"
async function agregarFavorito(gameData) {
    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE}/favoritos`, {
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
            // CORRECCIÓN: Si ya está en favoritos, actualizar el estado local
            if (result.error && result.error.includes('ya está en favoritos')) {
                isFavorite = true;
                updateFavoriteButton();
                showAlert('Este juego ya está en tus favoritos', 'info');
                return true; // Retornar true para que no se muestre error
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
        const response = await fetch(`${API_BASE}/favoritos/${userId}/${idSteam}`, {
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

function getUserId() {
    return sessionStorage.getItem('userId') || 
           localStorage.getItem('userId') || 
           'demo-user-123';
}

// Initialize
initializeJuego();