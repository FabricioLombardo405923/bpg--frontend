const API_CONFIG = {
    // URL base de tu API en Vercel
    API_BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://bpg-back.vercel.app//api' 
        : 'http://localhost:3000/api',
    
    // Headers por defecto
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    
    // Timeout por defecto (30 segundos)
    TIMEOUT: 30000,
    
    // Endpoints específicos
    ENDPOINTS: {
        
    }
};

// Clase para manejar las peticiones HTTP
class ApiService {
    constructor(baseURL = API_CONFIG.BASE_URL) {
        this.baseURL = baseURL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    // Método genérico para hacer peticiones
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            timeout: this.timeout,
            headers: {
                ...API_CONFIG.DEFAULT_HEADERS,
                ...options.headers
            },
            ...options
        };

        try {            
            // Crear controller para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            config.signal = controller.signal;

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error(`❌ Error en petición a ${endpoint}:`, error);
            
            if (error.name === 'AbortError') {
                throw new Error(`Timeout: La petición a ${endpoint} tardó más de ${this.timeout/1000} segundos`);
            }
            
            throw error;
        }
    }

    // Métodos HTTP específicos
    async get(endpoint, params = {}) {
        let url = endpoint;
        if (Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }
        
        return await this.request(url, {
            method: 'GET'
        });
    }

    async post(endpoint, data) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return await this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Instancia del servicio API
const apiService = new ApiService();


// Exportar para uso global
if (typeof window !== 'undefined') {
    window.apiService = apiService;
    window.API_CONFIG = API_CONFIG;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiService,
        API_CONFIG
    };
}