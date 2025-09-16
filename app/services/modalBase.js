class ModalBase {
  constructor(modalId, htmlPath) {
    this.modalId = modalId;
    this.htmlPath = htmlPath;
    this.modal = null;
    this.isLoaded = false;
    this.currentResolve = null;
  }

  // Cargar el HTML del modal si no está cargado
  async loadHTML() {
    if (this.isLoaded) return;
    
    try {
      const response = await fetch(this.htmlPath);
      const html = await response.text();
      document.body.insertAdjacentHTML('beforeend', html);
      
      this.modal = document.getElementById(this.modalId);
      this.setupBaseEvents();
      this.isLoaded = true;
    } catch (error) {
      console.error(`Error cargando modal ${this.modalId}:`, error);
    }
  }

  // Configurar eventos básicos (cerrar, ESC, click fuera)
  setupBaseEvents() {
    // Botón X para cerrar
    const closeBtn = this.modal.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close(null));
    }

    // Click fuera del modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close(null);
      }
    });

    // ESC para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close(null);
      }
    });
  }

  // Mostrar modal
  async show(data = {}) {
    await this.loadHTML();
    
    // Configurar contenido específico del modal
    this.setupContent(data);
    
    // Mostrar
    this.modal.style.display = 'block';
    
    // Retornar promesa que se resuelve cuando el modal se cierra
    return new Promise((resolve) => {
      this.currentResolve = resolve;
    });
  }

  // Cerrar modal
  close(result = null) {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    
    if (this.currentResolve) {
      this.currentResolve(result);
      this.currentResolve = null;
    }
  }

  // Verificar si está abierto
  isOpen() {
    return this.modal && this.modal.style.display === 'block';
  }

  // Método abstracto - debe ser implementado por cada modal específico
  setupContent(data) {
    // Override en cada modal específico
  }
}

