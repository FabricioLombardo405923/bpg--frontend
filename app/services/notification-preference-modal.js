// notification-preference-modal.js
// Modal para configurar preferencias de notificaciones

class NotificationPreferenceModal {
  constructor() {
    this.modal = null;
    this.currentGame = null;
    this.currentUserId = null;
    this.existingPreference = null;
  }

  // ==================== INICIALIZACIÓN ====================

  init() {
    this.createModal();
    this.attachEventListeners();
  }

  createModal() {
    // Si ya existe, no crear de nuevo
    if (document.getElementById('notification-preference-modal')) return;

    const modalHTML = `
      <div id="notification-preference-modal" class="modal-overlay" style="display: none;">
        <div class="modal-container" style="max-width: 500px;">
          <div class="modal-header">
            <h3>⭐ Configurar Alerta Personalizada</h3>
            <button class="modal-close-btn">&times;</button>
          </div>
          
          <div class="modal-body">
            <!-- Info del juego -->
            <div class="preference-game-info">
              <img id="pref-game-image" src="" alt="Juego" class="pref-game-image">
              <div class="pref-game-details">
                <h4 id="pref-game-title"></h4>
                <p class="text-muted">Configura cuándo quieres recibir notificaciones de ofertas</p>
              </div>
            </div>

            <!-- Formulario -->
            <form id="preference-form">
              <!-- Descuento mínimo -->
              <div class="form-group">
                <label for="pref-discount">
                  <i class="fas fa-percentage"></i> Descuento Mínimo
                </label>
                <div class="input-with-suffix">
                  <input 
                    type="number" 
                    id="pref-discount" 
                    class="form-input" 
                    min="1" 
                    max="99" 
                    value="10"
                    placeholder="10"
                  >
                  <span class="input-suffix">%</span>
                </div>
                <small class="form-help">
                  Solo recibirás alertas cuando el descuento sea igual o mayor a este porcentaje
                </small>
              </div>

              <!-- Precio máximo -->
              <div class="form-group">
                <label for="pref-price">
                  <i class="fas fa-dollar-sign"></i> Precio Máximo (Opcional)
                </label>
                <div class="input-with-prefix">
                  <span class="input-prefix">$</span>
                  <input 
                    type="number" 
                    id="pref-price" 
                    class="form-input" 
                    min="0" 
                    step="0.01"
                    placeholder="Ej: 50.00"
                  >
                </div>
                <small class="form-help">
                  Solo recibirás alertas si el precio está por debajo de este valor
                </small>
              </div>

              <!-- Ejemplo de alerta -->
              <div class="preference-example">
                <div class="example-icon">
                  <i class="fas fa-bell"></i>
                </div>
                <div class="example-text">
                  <strong>Recibirás una notificación cuando:</strong>
                  <p id="preference-conditions">
                    • El descuento sea ≥ <span id="example-discount">10</span>%
                  </p>
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="pref-cancel-btn">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" id="pref-save-btn" form="preference-form">
              <i class="fas fa-bell"></i> Guardar Alerta
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('notification-preference-modal');

    // Agregar estilos
    this.addStyles();
  }

  addStyles() {
    if (document.getElementById('preference-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'preference-modal-styles';
    style.textContent = `
      .preference-game-info {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: rgba(124, 58, 237, 0.05);
        border-radius: 8px;
        border-left: 3px solid var(--color-primary);
      }

      .pref-game-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
      }

      .pref-game-details h4 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .form-group label i {
        color: var(--color-primary);
        margin-right: 0.5rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 1rem;
        transition: border-color 0.2s;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .input-with-suffix,
      .input-with-prefix {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-with-suffix .form-input {
        padding-right: 3rem;
      }

      .input-with-prefix .form-input {
        padding-left: 3rem;
      }

      .input-suffix,
      .input-prefix {
        position: absolute;
        color: var(--text-secondary);
        font-weight: 600;
        pointer-events: none;
      }

      .input-suffix {
        right: 1rem;
      }

      .input-prefix {
        left: 1rem;
      }

      .form-help {
        display: block;
        margin-top: 0.5rem;
        color: var(--text-muted);
        font-size: 0.85rem;
      }

      .preference-example {
        margin-top: 2rem;
        padding: 1rem;
        background: rgba(52, 211, 153, 0.1);
        border-radius: 8px;
        border-left: 3px solid #34d399;
        display: flex;
        gap: 1rem;
      }

      .example-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(52, 211, 153, 0.2);
        border-radius: 50%;
        color: #34d399;
      }

      .example-text strong {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
      }

      .example-text p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      #example-discount,
      #example-price {
        font-weight: 600;
        color: var(--color-primary);
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    // Cerrar modal
    const closeBtn = this.modal.querySelector('.modal-close-btn');
    const cancelBtn = document.getElementById('pref-cancel-btn');
    
    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());

    // Click fuera del modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Submit formulario
    const form = document.getElementById('preference-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePreference();
    });

    // Actualizar ejemplo en tiempo real
    const discountInput = document.getElementById('pref-discount');
    const priceInput = document.getElementById('pref-price');

    discountInput.addEventListener('input', () => this.updateExample());
    priceInput.addEventListener('input', () => this.updateExample());
  }

  // ==================== ACCIONES ====================

  async open(gameData, userId) {
    if (!gameData || !userId) {
      showAlert('Error: Faltan datos del juego o usuario', 'error');
      return;
    }

    this.currentGame = gameData;
    this.currentUserId = userId;

    // Cargar información del juego
    document.getElementById('pref-game-title').textContent = gameData.nombre || gameData.title;
    document.getElementById('pref-game-image').src = 
      gameData.portada || gameData.thumbOriginal || gameData.thumb || 
      'https://via.placeholder.com/80x80?text=Game';

    // Verificar si ya tiene preferencia configurada
    await this.loadExistingPreference();

    // Mostrar modal
    this.modal.style.display = 'flex';
    this.modal.querySelector('.modal-container').style.animation = 'slideDown 0.3s ease-out';

    // Focus en primer input
    setTimeout(() => {
      document.getElementById('pref-discount').focus();
    }, 100);
  }

  close() {
    this.modal.style.display = 'none';
    this.currentGame = null;
    this.currentUserId = null;
    this.existingPreference = null;
    
    // Resetear formulario
    document.getElementById('preference-form').reset();
    document.getElementById('pref-discount').value = '10';
  }

  async loadExistingPreference() {
    try {
      const idSteam = this.currentGame.idSteam || this.currentGame.gameID;
      
      const response = await fetch(
        `${window.API_BASE_URL}/notificaciones/preferences/${this.currentUserId}/${idSteam}`
      );
      
      const result = await response.json();

      if (result.success && result.data) {
        this.existingPreference = result.data;
        
        // Cargar valores existentes
        document.getElementById('pref-discount').value = 
          result.data.descuentoMinimo || 10;
        
        if (result.data.precioMaximo) {
          document.getElementById('pref-price').value = 
            (result.data.precioMaximo / 100).toFixed(2);
        }

        this.updateExample();

        // Cambiar texto del botón
        document.getElementById('pref-save-btn').innerHTML = 
          '<i class="fas fa-sync"></i> Actualizar Alerta';
      }

    } catch (error) {
      console.error('Error cargando preferencia existente:', error);
    }
  }

  updateExample() {
    const discount = document.getElementById('pref-discount').value || 10;
    const price = document.getElementById('pref-price').value;

    document.getElementById('example-discount').textContent = discount;

    const conditionsEl = document.getElementById('preference-conditions');
    let conditions = `• El descuento sea ≥ ${discount}%`;

    if (price && parseFloat(price) > 0) {
      conditions += `\n• El precio sea ≤ $${parseFloat(price).toFixed(2)}`;
    }

    conditionsEl.innerHTML = conditions.split('\n').join('<br>');
  }

  async savePreference() {
    const discountInput = document.getElementById('pref-discount');
    const priceInput = document.getElementById('pref-price');

    const discount = parseInt(discountInput.value);
    const price = priceInput.value ? parseFloat(priceInput.value) : null;

    // Validaciones
    if (!discount || discount < 1 || discount > 99) {
      showAlert('El descuento debe estar entre 1% y 99%', 'warning');
      discountInput.focus();
      return;
    }

    if (price !== null && price < 0) {
      showAlert('El precio no puede ser negativo', 'warning');
      priceInput.focus();
      return;
    }

    // Deshabilitar botón mientras guarda
    const saveBtn = document.getElementById('pref-save-btn');
    const originalHTML = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
      const response = await fetch(
        `${window.API_BASE_URL}/notificaciones/preferences`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.currentUserId,
            gameData: {
              idSteam: this.currentGame.idSteam || this.currentGame.gameID,
              nombre: this.currentGame.nombre || this.currentGame.title,
              portada: this.currentGame.portada || this.currentGame.thumbOriginal
            },
            preferences: {
              descuentoMinimo: discount,
              precioMaximo: price ? Math.round(price * 100) : null
            }
          })
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar preferencia');
      }

      showAlert('✨ ¡Alerta configurada! Te notificaremos cuando haya ofertas que cumplan tus condiciones', 'success');
      this.close();

    } catch (error) {
      console.error('Error guardando preferencia:', error);
      showAlert(error.message, 'error');
      
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHTML;
    }
  }
}

// Instancia global
window.notificationPreferenceModal = new NotificationPreferenceModal();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.notificationPreferenceModal.init();
  });
} else {
  window.notificationPreferenceModal.init();
}

// Función helper para abrir desde cualquier parte
window.openNotificationPreference = function(gameData, userId) {
  if (!userId) {
    userId = sessionStorage.getItem('userId');
  }
  
  if (!userId) {
    showAlert('Debes iniciar sesión para configurar alertas', 'warning');
    return;
  }

  window.notificationPreferenceModal.open(gameData, userId);
};