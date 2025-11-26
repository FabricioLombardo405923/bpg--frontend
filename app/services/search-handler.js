function initializeSearchBar() {
    const searchInput = document.querySelector('.search-input');
    
    if (!searchInput) return;
    
    // Manejar el evento Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            ocultarSugerencias();
            realizarBusqueda();
        }
    });
    
    // Agregar evento al ícono de búsqueda
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', () => {
            ocultarSugerencias();
            realizarBusqueda();
        });
    }
    
    // Búsqueda en tiempo real con debounce para sugerencias
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        
        const query = e.target.value.trim();
        
        if (query.length >= 3) {
            debounceTimer = setTimeout(() => {
                mostrarSugerencias(query);
            }, 300);
        } else {
            ocultarSugerencias();
        }
    });
}

function realizarBusqueda() {
    const searchInput = document.querySelector('.search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        searchInput.focus();
        return;
    }
    
    sessionStorage.setItem('searchQuery', query);
    loadPage('busqueda');
}

function navigateAJuego(gameId) {
    sessionStorage.setItem('gameID', `${gameId}`);
    loadgamePage('juego');
}

// Sistema de sugerencias de búsqueda
function mostrarSugerencias(query) {
    let suggestionsBox = document.getElementById('search-suggestions');
    
    if (!suggestionsBox) {
        suggestionsBox = document.createElement('div');
        suggestionsBox.id = 'search-suggestions';
        suggestionsBox.className = 'search-suggestions';
        
        const searchContainer = document.querySelector('.nav-search');
        searchContainer.appendChild(suggestionsBox);
    }
    
    // Hacer fetch de sugerencias
    fetch(`${API_BASE_URL}/games/autocomplete?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(result => {
        if (result.success && result.data.length > 0) {
            suggestionsBox.innerHTML = result.data.map(game => `
                <div class="suggestion-item" data-game-id="${game.idSteam}">
                    <img src="${game.imagenPortada.small || game.imagenPortada.steam ||  'https://via.placeholder.com/150x200.png?text=No+Image'}" 
                            alt="${game.nombre}">
                    <div class="suggestion-info">
                        <span class="suggestion-title">${game.nombre}</span>
                    </div>
                </div>
            `).join('');
            
            // Agregar event listeners a cada sugerencia
            suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    //const gameId = item.getAttribute('data-game-id');
                    const gameId = item.getAttribute('data-game-id');

                    navigateAJuego(gameId);
                });
            });
            
            suggestionsBox.style.display = 'block';
        } else {
            ocultarSugerencias();
        }
    })
    .catch(() => {
        ocultarSugerencias();
    });
}

function ocultarSugerencias() {
    const suggestionsBox = document.getElementById('search-suggestions');
    if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
    }
}

// Cerrar sugerencias
document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.nav-search');
    const suggestionsBox = document.getElementById('search-suggestions');
    
    if (suggestionsBox && searchContainer && !searchContainer.contains(e.target)) {
        ocultarSugerencias();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearchBar);
} else {
    initializeSearchBar();
}