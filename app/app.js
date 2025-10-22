// Configuración de la API
window.API_BASE_URL = (function() {
    const isProd = window.location.hostname !== 'localhost';
    return isProd 
        ? 'https://api-bpg.vercel.app/api'
        : 'http://localhost:3000/api';
})();

// Configuración de páginas
const pages = {
    home: {
        html: 'pages/home/home.html',
        css: 'pages/home/home.css',
        js: 'pages/home/home.js',
        init: 'initializeHome'
    },
    favoritos: {
        html: 'pages/favoritos/favoritos.html',
        // css: 'pages/favoritos/favoritos.css',
        // js: 'pages/favoritos/favoritos.js',
        // init: 'initializeFavoritos'
    },
    biblioteca: {
        html: 'pages/biblioteca/biblioteca.html',
        // css: 'pages/biblioteca/biblioteca.css',
        // js: 'pages/biblioteca/biblioteca.js',
        // init: 'initializeBiblioteca'
    },
    perfil: {
        html: 'pages/perfil/perfil.html',
        // css: 'pages/perfil/perfil.css',
        // js: 'pages/perfil/perfil.js',
        // init: 'initializePerfil'
    },
    juego: {
        html: 'pages/juego/juego.html',
        css: 'pages/juego/juego.css',
        js: 'pages/juego/juego.js',
        init: 'initializeJuego'
    },
    busqueda: {
        html: 'pages/busqueda/busqueda.html',
        css: 'pages/busqueda/busqueda.css',
        js: 'pages/busqueda/busqueda.js',
        init: 'initializeBusqueda'
    },
    login: { 
        html: 'pages/login/login.html', 
        js:'pages/login/login.js',
        init: 'initializeLogin'
    },
    register: { 
     html: 'pages/register/register.html', 
     js:'pages/register/register.js',
     init: 'initializeRegister' 
    }
};

// Variables globales del sistema
let currentPage = null;
let loadedStyles = new Set();
let loadedScripts = new Set();
let mobileMenuOpen = false;

// =================================================================
// FUNCIONES DE CARGA DINÁMICA
// =================================================================

// Cargar CSS dinámicamente
function loadCSS(href) {
    return new Promise((resolve, reject) => {
        if (loadedStyles.has(href)) {
            resolve();
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => {
            loadedStyles.add(href);
            resolve();
        };
        link.onerror = () => {
            console.warn(`⚠️ No se pudo cargar CSS: ${href}`);
            resolve(); // No fallar por CSS faltante
        };
        document.head.appendChild(link);
    });
}

// Cargar JavaScript dinámicamente
function loadJS(src) {
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(src)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        
        script.onload = () => {
            loadedScripts.add(src);
            resolve();
        };
        
        script.onerror = (error) => {
            console.error(`❌ Error cargando script: ${src}`, error);
            reject(new Error(`Failed to load script: ${src}`));
        };
        
        document.head.appendChild(script);
    });
}

// Cargar HTML
function loadHTML(url) {
    return fetch(url).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    });
}

// Limpiar scripts de página anterior
function cleanupPageScripts(pageName) {
    // Limpiar event listeners específicos si es necesario
    const cleanupFunctionName = `cleanup${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`;
    if (typeof window[cleanupFunctionName] === 'function') {
        window[cleanupFunctionName]();
    }
}

// Esperar a que una función esté disponible
function waitForFunction(functionName, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            if (typeof window[functionName] === 'function') {
                resolve();
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout esperando función: ${functionName}`));
                return;
            }
            
            setTimeout(check, 50);
        }
        check();
    });
}

// =================================================================
// FUNCIÓN PRINCIPAL DE NAVEGACIÓN
// =================================================================

async function loadPage(pageName, params = {}) {
    if (currentPage === pageName && Object.keys(params).length === 0) return;

    const container = document.getElementById('content-container');
    const pageConfig = pages[pageName];

    if (!pageConfig) {
        console.error(`Página '${pageName}' no encontrada`);
        showErrorPage(pageName);
        return;
    }

    try {
        // Cerrar menú móvil si está abierto
        if (mobileMenuOpen) {
            closeMobileMenu();
        }

        // Limpiar página anterior
        if (currentPage) {
            cleanupPageScripts(currentPage);
        }

        // Mostrar loading
        showLoadingState();

        // 1. Cargar dependencias primero (services)
        if (pageConfig.deps && pageConfig.deps.length > 0) {
            for (const dep of pageConfig.deps) {
                try {
                    await loadJS(dep);
                } catch (error) {
                    console.warn(`⚠️ Dependencia no cargada: ${dep} - continuando...`);
                }
            }
        }

        // 2. Cargar CSS en paralelo
        const cssPromise = pageConfig.css ? loadCSS(pageConfig.css) : Promise.resolve();

        // 3. Cargar HTML
        const htmlContent = await loadHTML(pageConfig.html);

        // 4. Esperar CSS
        await cssPromise;

        // 5. Insertar HTML
        container.innerHTML = htmlContent;

        // 6. Cargar script principal de la página
        if (pageConfig.js) {
            await loadJS(pageConfig.js);
        }

        // 7. Esperar e inicializar función de inicialización
        if (pageConfig.init) {
            try {
                await waitForFunction(pageConfig.init, 3000);
                window[pageConfig.init](params);
            } catch (error) {
                console.error(`❌ Error inicializando ${pageConfig.init}:`, error);
            }
        }

        // 8. Actualizar navegación y estado
        updateNavigation(pageName);
        updateURL(pageName, params);
        currentPage = pageName;

        // 9. Animar entrada de la página
        container.classList.add('fade-in');
        setTimeout(() => container.classList.remove('fade-in'), 300);

    } catch (error) {
        console.error(`❌ Error cargando página '${pageName}':`, error);
        showErrorPage(pageName, error);
    }
}

// =================================================================
// FUNCIONES DE UI
// =================================================================

function showLoadingState() {
    const container = document.getElementById('content-container');
    container.innerHTML = `
        <div class="loading-container" style="
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            padding: 4rem 2rem;
            min-height: 60vh;
        ">
            <div class="loading-spinner" style="
                width: 40px;
                height: 40px;
                border: 3px solid var(--color-primary);
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            "></div>
            <p style="
                font-size: 1.1rem;
                color: var(--text-secondary);
                margin: 0;
            ">Cargando página...</p>
        </div>
    `;
}

function showErrorPage(pageName, error = null) {
    const container = document.getElementById('content-container');
    container.innerHTML = `
        <div class="error-container" style="
            padding: 4rem 2rem; 
            text-align: center; 
            color: var(--color-danger);
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        ">
            <div style="font-size: 4rem; margin-bottom: 1rem;">😕</div>
            <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Error al cargar la página</h2>
            <p style="margin-bottom: 2rem; color: var(--text-secondary);">
                No se pudo cargar la página '${pageName}'.
                ${error ? `<br><small style="color: var(--text-muted);">${error.message}</small>` : ''}
            </p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                <button onclick="loadPage('${pageName}')" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
                <button onclick="loadPage('home')" class="btn btn-secondary">
                    <i class="fas fa-home"></i> Ir al Inicio
                </button>
            </div>
        </div>
    `;
}

// Actualizar navegación activa
function updateNavigation(activePage) {
    const navButtons = document.querySelectorAll('.nav-btn, .mobile-nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === activePage) {
            btn.classList.add('active');
        }
    });

    // Actualizar título de la página
    updatePageTitle(activePage);
}

// Actualizar título de la página
function updatePageTitle(pageName) {
    const titles = {
        home: 'Inicio - Best Price Games',
        juego: 'Detalle del Juego - Best Price Games',
        perfil: 'Mi Perfil - Best Price Games',
        favoritos: 'Mis Favoritos - Best Price Games',
        biblioteca: 'Mi Biblioteca - Best Price Games'
    };
    document.title = titles[pageName] || 'Best Price Games';
}

// Actualizar URL sin recargar página
function updateURL(pageName, params = {}) {
    const url = new URL(window.location);
    url.searchParams.set('page', pageName);
    
    // Agregar parámetros adicionales
    Object.keys(params).forEach(key => {
        if (params[key]) {
            url.searchParams.set(key, params[key]);
        }
    });
    
    window.history.pushState({page: pageName, params}, '', url);
}

// =================================================================
// FUNCIONES DE BÚSQUEDA Y NAVEGACIÓN
// =================================================================
/*
function handleSearch(query) {
    if (query.trim()) {
        loadPage('home', { search: query.trim() });
    }
}
*/
function navigateToGame(gameId) {
    loadPage('juego', { id: gameId });
}

function navigateToProfile() {
    loadPage('perfil');
}

function navigateToFavorites() {
    loadPage('favoritos');
}

function navigateToLibrary() {
    loadPage('biblioteca');
}

// =================================================================
// MENÚ MÓVIL
// =================================================================

function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    const mobileNav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('mobile-overlay');
    
    if (mobileMenuOpen) {
        mobileNav.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    mobileMenuOpen = false;
    const mobileNav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('mobile-overlay');
    
    if (mobileNav) mobileNav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// =================================================================
// INICIALIZACIÓN PRINCIPAL
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Inicializando Best Price Games...');

    // Crear menú móvil si no existe
    //createMobileMenu();

    // Event listeners para navegación
    setupNavigationListeners();

    // Event listeners para búsqueda
    setupSearchListeners();

    // Event listener para overlay móvil
    const overlay = document.getElementById('mobile-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }

    // Manejar navegación del browser (back/forward)
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            loadPage(event.state.page, event.state.params || {});
        }
    });

    // Detectar página inicial desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = urlParams.get('page') || 'home';
    const initialParams = {};
    
    // Extraer parámetros adicionales
    for (const [key, value] of urlParams.entries()) {
        if (key !== 'page') {
            initialParams[key] = value;
        }
    }

    // Cargar página inicial
    loadPage(initialPage, initialParams);

    // Exponer funciones globales
    window.loadPage = loadPage;
    //window.handleSearch = handleSearch;
    window.navigateToGame = navigateToGame;
    window.navigateToProfile = navigateToProfile;
    window.navigateToFavorites = navigateToFavorites;
    window.navigateToLibrary = navigateToLibrary;
    window.toggleMobileMenu = toggleMobileMenu;
    window.closeMobileMenu = closeMobileMenu;
});

// =================================================================
// FUNCIONES DE SETUP
// =================================================================

function createMobileMenu() {
    // Crear botón hamburguesa si no existe
    if (!document.querySelector('.mobile-menu-toggle')) {
        const navbar = document.querySelector('.navbar .nav-container');
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-menu-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.onclick = toggleMobileMenu;
        navbar.appendChild(toggleBtn);
    }

    // Crear menú móvil si no existe
    if (!document.getElementById('mobile-nav')) {
        const mobileNav = document.createElement('div');
        mobileNav.id = 'mobile-nav';
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = `
            <div class="mobile-nav-header">
                <div class="nav-brand">
                    <h1>BPG</h1>
                </div>
                <button onclick="closeMobileMenu()" class="mobile-menu-toggle">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <ul class="mobile-nav-menu">
                <li class="mobile-nav-item">
                    <button class="mobile-nav-btn" data-page="home">
                        <i class="fas fa-home"></i> Inicio
                    </button>
                </li>
                <li class="mobile-nav-item">
                    <button class="mobile-nav-btn" data-page="favoritos">
                        <i class="fas fa-heart"></i> Favoritos
                    </button>
                </li>
                <li class="mobile-nav-item">
                    <button class="mobile-nav-btn" data-page="biblioteca">
                        <i class="fas fa-book"></i> Biblioteca
                    </button>
                </li>
                <li class="mobile-nav-item">
                    <button class="mobile-nav-btn" data-page="perfil">
                        <i class="fas fa-user"></i> Perfil
                    </button>
                </li>
            </ul>
        `;
        document.body.appendChild(mobileNav);

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'mobile-overlay';
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
    }
} 

function setupNavigationListeners() {
    // Event listeners para botones de navegación (desktop y móvil)
    document.addEventListener('click', (e) => {
        const navBtn = e.target.closest('.nav-btn, .mobile-nav-btn');
        if (navBtn && navBtn.dataset.page) {
            e.preventDefault();
            loadPage(navBtn.dataset.page);
            
            // Cerrar menú móvil si está abierto
            if (navBtn.classList.contains('mobile-nav-btn')) {
                closeMobileMenu();
            }
        }
    });
}

function setupSearchListeners() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        // Búsqueda al presionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(searchInput.value);
            }
        });

        // Búsqueda con debounce mientras escribes
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            
            if (query.length >= 3) {
                searchTimeout = setTimeout(() => {
                    handleSearch(query);
                }, 500);
            }
        });
    }

    // Event listener para botón de búsqueda si existe
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = document.querySelector('.search-input');
            if (input) {
                handleSearch(input.value);
            }
        });
    }
}

// =================================================================
// MANEJO DE ERRORES GLOBALES
// =================================================================

window.addEventListener('error', (event) => {
    console.error('❌ Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rechazada:', event.reason);
    event.preventDefault();
});

// =================================================================
// UTILIDADES GLOBALES
// =================================================================

// Función para mostrar notificaciones
window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        <i class="alert-icon fas fa-${getIconByType(type)}"></i>
        <div class="alert-content">
            <div class="alert-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
};

function getIconByType(type) {
    const icons = {
        success: 'check-circle',
        danger: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

  

