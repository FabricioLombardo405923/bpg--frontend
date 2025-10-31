class Alerta extends ModalBase {
  constructor() {
    super('alertaContainer', 'modals/alerta/alerta.html');
  }

  setupContent() {
  }

  async showAlert(message, type = 'success', duration = 3000) {
    await this.loadHTML();
    const container = this.modal;

    // Crear elemento alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta ${type}`;
    alerta.textContent = message;

    container.appendChild(alerta);

    // Mostrar animación
    setTimeout(() => alerta.classList.add('show'), 50);

    // Ocultar y eliminar después de cierto tiempo
    setTimeout(() => {
      alerta.classList.remove('show');
      alerta.classList.add('hide');
      setTimeout(() => alerta.remove(), 400);
    }, duration);
  }
}

// Instancia global
const alerta = new Alerta();
window.showAlert = (msg, type, duration) => alerta.showAlert(msg, type, duration);
