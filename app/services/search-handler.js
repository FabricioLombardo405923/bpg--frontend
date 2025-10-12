// Handler para el buscador del navbar
function initializeSearchBar() {
    const searchInput = document.querySelector('.search-input');
    
    if (!searchInput) return;
    
    // Manejar el evento Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            realizarBusqueda();
        }
    });
    
    // Opcional: agregar un botón de búsqueda si no existe
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', realizarBusqueda);
    }
    
    // Opcional: búsqueda en tiempo real con debounce
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
        // Mostrar mensaje o simplemente no hacer nada
        searchInput.focus();
        return;
    }
    
    // Guardar query en sessionStorage para que busqueda.js lo pueda leer
    sessionStorage.setItem('searchQuery', query);
    
    // Navegar a la página de búsqueda
    navigateToBusqueda(query);
}

function navigateToBusqueda(query) {
    // Solo usar el sistema de páginas, sin query en URL
    window.location.href = `/app/?page=busqueda`;
}

// Opcional: Sistema de sugerencias de búsqueda
function mostrarSugerencias(query) {
    // Aquí puedes implementar un dropdown con sugerencias
    // usando el mismo endpoint pero con menos resultados
    
    let suggestionsBox = document.getElementById('search-suggestions');
    
    if (!suggestionsBox) {
        suggestionsBox = document.createElement('div');
        suggestionsBox.id = 'search-suggestions';
        suggestionsBox.className = 'search-suggestions';
        
        const searchContainer = document.querySelector('.nav-search');
        searchContainer.appendChild(suggestionsBox);
    }
    
    // Hacer fetch de sugerencias
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000/api';
    fetch(`${API_BASE}/juegos/buscar?query=${encodeURIComponent(query)}&pageSize=5&pageNumber=0&ordering=-rating`)
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data.length > 0) {
                suggestionsBox.innerHTML = result.data.map(game => `
                    <div class="suggestion-item" data-game-name="${game.name.replace(/"/g, '&quot;')}">
                        <img src="${game.background_image || 'https://via.placeholder.com/50'}" 
                             alt="${game.name}"
                             onerror="this.src='https://via.placeholder.com/50'">
                        <div class="suggestion-info">
                            <span class="suggestion-title">${game.name}</span>
                            <span class="suggestion-rating">${game.rating ? '⭐ ' + game.rating : ''}</span>
                        </div>
                    </div>
                `).join('');
                
                // Agregar event listeners a cada sugerencia
                suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const gameName = item.getAttribute('data-game-name');
                        sessionStorage.setItem('searchQuery', gameName);
                        window.location.href = '/app/?page=busqueda';
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

// Cerrar sugerencias al hacer click fuera
document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.nav-search');
    const suggestionsBox = document.getElementById('search-suggestions');
    
    if (suggestionsBox && !searchContainer.contains(e.target)) {
        ocultarSugerencias();
    }
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearchBar);
} else {
    initializeSearchBar();
}