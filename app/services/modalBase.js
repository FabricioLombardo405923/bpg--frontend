class ModalBase {
  constructor(modalId, htmlPath) {
    this.modalId = modalId;
    this.htmlPath = htmlPath;
    this.modal = null;
    this.isLoaded = false;
    this.currentResolve = null;
  }

  // Cargar HTML del modal
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

  // Eventos básicos: cerrar, esc, click fuera
  setupBaseEvents() {
    const closeBtn = this.modal.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close(null));
    }

    // Click fuera
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close(null);
      }
    });

    // ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close(null);
      }
    });
  }

  // Mostrar modal
  async show(data = {}) {
    await this.loadHTML();

    this.setupContent(data);

    // Mostrar modal 
    this.modal.style.display = 'flex';

    // Forzar recálculo para centrar 
    requestAnimationFrame(() => {
      this.modal.classList.add("modal-visible");
    });

    return new Promise((resolve) => {
      this.currentResolve = resolve;
    });
  }

  // Cerrar modal
  close(result = null) {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.modal.classList.remove("modal-visible");
    }

    if (this.currentResolve) {
      this.currentResolve(result);
      this.currentResolve = null;
    }
  }

  // Verificar si está abierto
  isOpen() {
    return this.modal && this.modal.style.display === 'flex';
  }

  // Método a sobrescribir por cada modal
  setupContent(data) {}
}
