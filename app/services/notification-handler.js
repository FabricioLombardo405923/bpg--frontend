// notification-handler.js
// Manejador de notificaciones para el frontend

class NotificationHandler {
  constructor() {
    this.userId = null;
    this.unreadCount = 0;
    this.notifications = [];
    this.checkInterval = 2 * 60 * 1000; // Verificar cada 2 minutos
    this.intervalId = null;
  }

  // ==================== INICIALIZACIÓN ====================

  init(userId) {
    if (!userId) {
      console.warn('No se puede inicializar notificaciones sin userId');
      return;
    }

    this.userId = userId;
    this.crearElementosUI();
    this.setupEventListeners();
    
    // Cargar notificaciones iniciales
    this.cargarNotificaciones();
    this.actualizarContador();

    // Iniciar polling
    this.startPolling();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  startPolling() {
    this.stop(); // Limpiar cualquier intervalo previo
    
    this.intervalId = setInterval(() => {
      this.actualizarContador();
      
      // Si el panel está abierto, actualizar también las notificaciones
      const panel = document.getElementById('notifications-panel');
      if (panel && panel.classList.contains('show')) {
        this.cargarNotificaciones();
      }
    }, this.checkInterval);
  }

  // ==================== UI ====================

  crearElementosUI() {
    const navbar = document.querySelector('.navbar .nav-container');
    if (!navbar) return;

    // Buscar si ya existe el botón
    let notifBtn = document.getElementById('notifications-btn');
    
    if (!notifBtn) {
      // Crear botón de notificaciones
      notifBtn = document.createElement('button');
      notifBtn.id = 'notifications-btn';
      notifBtn.className = 'nav-notification-btn';
      notifBtn.innerHTML = `
        <i class="fas fa-bell"></i>
        <span class="notification-badge" style="display: none;">0</span>
      `;

      // Insertar antes del nav-user
      const navUser = navbar.querySelector('.nav-user');
      if (navUser) {
        navbar.insertBefore(notifBtn, navUser);
      } else {
        navbar.appendChild(notifBtn);
      }
    }

    // Crear panel de notificaciones si no existe
    let panel = document.getElementById('notifications-panel');
    
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'notifications-panel';
      panel.className = 'notifications-panel';
      panel.innerHTML = `
        <div class="notifications-header">
          <h3>Notificaciones</h3>
          <button class="btn-mark-all-read" title="Marcar todas como leídas">
            <i class="fas fa-check-double"></i>
          </button>
        </div>
        <div class="notifications-list" id="notifications-list">
          <div class="loading-notifications">
            <div class="loading-spinner"></div>
            <p>Cargando notificaciones...</p>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    this.agregarEstilos();
  }

  agregarEstilos() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .nav-notification-btn {
        position: relative;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s;
        margin-right: 1rem;
      }

      .nav-notification-btn:hover {
        background: rgba(124, 58, 237, 0.1);
        color: var(--color-primary);
      }

      .notification-badge {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--color-danger);
        color: white;
        font-size: 0.7rem;
        padding: 0.15rem 0.35rem;
        border-radius: 10px;
        font-weight: bold;
        min-width: 18px;
        text-align: center;
      }

      .notifications-panel {
        position: fixed;
        top: 70px;
        right: 20px;
        width: 380px;
        max-width: calc(100vw - 40px);
        max-height: 500px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .notifications-panel.show {
        display: flex;
        animation: slideDown 0.2s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .notifications-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .notifications-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary);
      }

      .btn-mark-all-read {
        background: transparent;
        border: none;
        color: var(--color-primary);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .btn-mark-all-read:hover {
        background: rgba(124, 58, 237, 0.1);
      }

      .notifications-list {
        flex: 1;
        overflow-y: auto;
        max-height: 450px;
      }

      .notification-item {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        gap: 0.75rem;
      }

      .notification-item:hover {
        background: rgba(124, 58, 237, 0.05);
      }

      .notification-item.personalized {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
        border-left-color: #f59e0b;
      }

      .notification-icon.personalized-icon {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }

      .notification-item.unread {
        background: rgba(124, 58, 237, 0.08);
        border-left: 3px solid var(--color-primary);
      }

      .notification-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(124, 58, 237, 0.15);
        color: var(--color-primary);
      }

      .notification-content {
        flex: 1;
      }

      .notification-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
        font-size: 0.95rem;
      }

      .notification-message {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin-bottom: 0.25rem;
      }

      .notification-time {
        color: var(--text-muted);
        font-size: 0.75rem;
      }

      .notification-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .notification-actions .btn {
        font-size: 0.8rem;
        padding: 0.25rem 0.75rem;
      }

      .empty-notifications {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
      }

      .empty-notifications i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .loading-notifications {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
      }

      .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid var(--color-primary);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      @media (max-width: 768px) {
        .notifications-panel {
          right: 10px;
          left: 10px;
          width: auto;
          top: 60px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Toggle panel
    const btn = document.getElementById('notifications-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePanel();
      });
    }

    // Marcar todas como leídas
    const markAllBtn = document.querySelector('.btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        this.marcarTodasComoLeidas();
      });
    }

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notifications-panel');
      const btn = document.getElementById('notifications-btn');
      
      if (panel && btn && 
          !panel.contains(e.target) && 
          !btn.contains(e.target)) {
        panel.classList.remove('show');
      }
    });
  }

  // ==================== ACCIONES ====================

  togglePanel() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;

    const isShowing = panel.classList.toggle('show');
    
    if (isShowing) {
      this.cargarNotificaciones();
    }
  }

  async cargarNotificaciones() {
    if (!this.userId) return;

    const list = document.getElementById('notifications-list');
    if (!list) return;

    try {
      const response = await fetch(
        `${window.API_BASE_URL}/notificaciones/${this.userId}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      this.notifications = result.data || [];
      this.renderNotifications();

    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      list.innerHTML = `
        <div class="empty-notifications">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error al cargar notificaciones</p>
        </div>
      `;
    }
  }

  async actualizarContador() {
    if (!this.userId) return;

    try {
      const response = await fetch(
        `${window.API_BASE_URL}/notificaciones/${this.userId}/count`
      );
      const result = await response.json();

      if (result.success) {
        this.unreadCount = result.count;
        this.updateBadge();
      }

    } catch (error) {
      console.error('Error actualizando contador:', error);
    }
  }

  updateBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;

    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  async marcarComoLeida(notificationId) {
    try {
      const response = await fetch(
        `${window.API_BASE_URL}/notificaciones/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId })
        }
      );

      const result = await response.json();

      if (result.success) {
        await this.actualizarContador();
        await this.cargarNotificaciones();
      }

    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  }

  async marcarTodasComoLeidas() {
    try {
      const response = await fetch(
        `${window.API_BASE_URL}/notificaciones/${this.userId}/read-all`,
        { method: 'PATCH' }
      );

      const result = await response.json();

      if (result.success) {
        showAlert('Todas las notificaciones marcadas como leídas', 'success');
        await this.actualizarContador();
        await this.cargarNotificaciones();
      }

    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      showAlert('Error al marcar notificaciones', 'error');
    }
  }

  async eliminarNotificacion(notificationId) {
    try {
      const response = await fetch(
        `${window.API_BASE_URL}/notificaciones/${notificationId}?userId=${this.userId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        await this.actualizarContador();
        await this.cargarNotificaciones();
      }

    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  }

  // ==================== RENDER ====================

  renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = `
        <div class="empty-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>No tienes notificaciones</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.notifications
      .map(notif => this.createNotificationHTML(notif))
      .join('');

    // Agregar event listeners
    this.attachNotificationListeners();
  }

  createNotificationHTML(notif) {
    const isUnread = notif.leida === 0;
    const timeAgo = this.getTimeAgo(notif.fec_alt);
    const isPersonalized = notif.tipo === 'oferta_personalizada';
    
    return `
      <div class="notification-item ${isUnread ? 'unread' : ''} ${isPersonalized ? 'personalized' : ''}" 
           data-id="${notif.id}"
           data-game-id="${notif.data?.idSteam || ''}">
        <div class="notification-icon ${isPersonalized ? 'personalized-icon' : ''}">
          <i class="fas ${this.getIconByType(notif.tipo)}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notif.titulo}</div>
          <div class="notification-message">${notif.mensaje}</div>
          <div class="notification-time">${timeAgo}</div>
          ${notif.data?.idSteam ? `
            <div class="notification-actions">
              <button class="btn btn-sm btn-primary btn-ver-oferta">
                Ver Oferta
              </button>
              ${isPersonalized ? `
                <button class="btn btn-sm btn-secondary btn-edit-preference">
                  <i class="fas fa-cog"></i> Editar Alerta
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  attachNotificationListeners() {
    // Click en notificación
    document.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const notifId = parseInt(item.dataset.id);
        const gameId = item.dataset.gameId;

        // Si hizo click en "Ver oferta"
        if (e.target.closest('.btn-ver-oferta')) {
          if (gameId) {
            window.navigateToGame(gameId);
          }
          return;
        }

        // Si hizo click en "Editar alerta"
        if (e.target.closest('.btn-edit-preference')) {
          // Obtener datos del juego desde la notificación
          const notification = this.notifications.find(n => n.id === notifId);
          if (notification && notification.data) {
            const gameData = {
              idSteam: notification.data.idSteam,
              nombre: notification.data.title || 'Juego',
              portada: notification.data.portada
            };
            
            if (window.openNotificationPreference) {
              window.openNotificationPreference(gameData, this.userId);
            }
          }
          return;
        }

        // Marcar como leída si no lo está
        if (item.classList.contains('unread')) {
          await this.marcarComoLeida(notifId);
        }
      });
    });
  }

  // ==================== UTILIDADES ====================

  getIconByType(tipo) {
    const icons = {
      oferta: 'fa-tag',
      oferta_personalizada: 'fa-star',
      sistema: 'fa-info-circle',
      actualizacion: 'fa-sync'
    };
    return icons[tipo] || 'fa-bell';
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
    
    return date.toLocaleDateString('es-AR');
  }
}

// Instancia global
window.notificationHandler = new NotificationHandler();

// Función para inicializar desde auth-handler.js
window.initNotifications = function(userId) {
  if (userId) {
    window.notificationHandler.init(userId);
  } else {
    window.notificationHandler.stop();
  }
};