class ConfirmModal extends ModalBase {
  constructor() {
    super('confirmModal', 'modals/confirmacion/confirmacion.html');
  }

  setupContent(data) {
    const { title, text } = data;
    
    // Actualizar contenido
    const titleEl = this.modal.querySelector('#modalTitle');
    const textEl = this.modal.querySelector('#modalText');
    
    if (titleEl) titleEl.textContent = title || 'Confirmar';
    if (textEl) textEl.textContent = text || '¿Estás seguro?';

    // Configurar botones (solo la primera vez)
    if (!this.buttonsConfigured) {
      const confirmBtn = this.modal.querySelector('#confirmBtn');
      const cancelBtn = this.modal.querySelector('#cancelBtn');
      
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => this.close(true));
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.close(false));
      }
      
      this.buttonsConfigured = true;
    }
  }

  // Método de conveniencia
  async confirm(title, text) {
    return await this.show({ title, text });
  }
}