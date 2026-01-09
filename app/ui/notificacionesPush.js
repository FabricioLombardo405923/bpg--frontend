const solicitarPermisoNotificaciones = window.solicitarPermisoNotificaciones;
const escucharNotificacionesForeground = window.escucharNotificacionesForeground;

class NotificacionesUI {
  constructor() {
    this.userId = null;
    this.pollingInterval = null;
    this.notificacionesContainer = null;
    this.notificacionesActivas = 0;
    this.MAX_NOTIFICACIONES = 3;
  }
  
  /**
   * Inicializar sistema de notificaciones
   */
  async inicializar(userId) {
    this.userId = userId;
    
    // Crear contenedor para popups si no existe
    this.crearContenedorPopups();
    
    // Solicitar permiso de notificaciones
    await solicitarPermisoNotificaciones(userId);
    
    // Escuchar notificaciones de Firebase en foreground
    escucharNotificacionesForeground((notif) => {
      this.mostrarPopup(notif);
    });
    
    // Iniciar polling para verificar notificaciones pendientes
    this.iniciarPolling();
    
    // Verificar notificaciones pendientes al cargar
    await this.verificarPendientes();
  }
  
  /**
   * Crear contenedor para popups de notificaciones
   */
  crearContenedorPopups() {
    if (document.getElementById('notificaciones-container')) {
      this.notificacionesContainer = document.getElementById('notificaciones-container');
      return;
    }
    
    const container = document.createElement('div');
    container.id = 'notificaciones-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      width: calc(100% - 40px);
      pointer-events: none;
    `;
    
    document.body.appendChild(container);
    this.notificacionesContainer = container;
  }
  
  /**
   * Mostrar popup de notificación
   */
  mostrarPopup(notificacion) {
    // Si hay 3 o más notificaciones, no mostrar más
    if (this.notificacionesActivas >= this.MAX_NOTIFICACIONES) {
      return;
    }
    
    const popup = document.createElement('div');
    popup.className = 'notificacion-popup';
    popup.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      transition: transform 0.2s;
      border: 1px solid rgba(124, 58, 237, 0.3);
    `;
    
    // Datos de la notificación
    const { 
      titulo = notificacion.titulo || 'Nueva Oferta',
      mensaje = notificacion.mensaje || notificacion.body || '',
      imagen = notificacion.portada || notificacion.imagen || '',
      idSteam = notificacion.idSteam || notificacion.datos?.idSteam,
      nombreJuego = notificacion.nombreJuego || titulo,
      descuento = notificacion.descuento || 0,
      precioActual = notificacion.precioActual || 0,
      id = notificacion.id
    } = notificacion;
    
    const precio = precioActual ? (precioActual / 100).toFixed(2) : '';
    
    popup.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: start;">
        ${imagen ? `
        <img 
          src="${imagen}" 
          alt="${nombreJuego}"
          style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0;"
          onerror="this.style.display='none'"
        />
        ` : ''}
        
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
            <h4 style="margin: 0; color: white; font-size: 14px; font-weight: 600; line-height: 1.3;">
              🎮 ${nombreJuego}
            </h4>
            <button 
              class="btn-cerrar-popup"
              style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; flex-shrink: 0; line-height: 1;"
            >
              ×
            </button>
          </div>
          
          <p style="margin: 0 0 8px 0; color: #cbd5e1; font-size: 13px; line-height: 1.4;">
            ${mensaje}
          </p>
          
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            ${descuento > 0 ? `
            <span style="background: #ef4444; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
              -${descuento}%
            </span>
            ` : ''}
            
            ${precio ? `
            <span style="color: #10b981; font-size: 15px; font-weight: 700;">
              $${precio}
            </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Incrementar contador
    this.notificacionesActivas++;
    
    // Botón cerrar
    const btnCerrar = popup.querySelector('.btn-cerrar-popup');
    btnCerrar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cerrarPopup(popup);
    });
    
    // Hover effect
    popup.addEventListener('mouseenter', () => {
      popup.style.transform = 'translateX(-5px)';
    });
    
    popup.addEventListener('mouseleave', () => {
      popup.style.transform = 'translateX(0)';
    });
    
    // Click para ir al juego
    popup.addEventListener('click', () => {
      if (idSteam) {
        sessionStorage.setItem('gameID', idSteam);
        loadPage('juego');
      }
      
      // Marcar como leída
      if (id) {
        NotificacionesService.marcarComoLeida(id).catch(console.error);
      }
      
      this.cerrarPopup(popup);
    });
    
    // Agregar al contenedor
    this.notificacionesContainer.appendChild(popup);
    
    // Marcar como mostrada
    if (id) {
      NotificacionesService.marcarComoMostrada(id).catch(console.error);
    }

    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      this.cerrarPopup(popup);
    }, 10000);
  }
  
  /**
   * Cerrar popup con animación
   */
  cerrarPopup(popup) {
    if (!popup || !popup.parentNode) return;
    
    popup.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
        this.notificacionesActivas--;
      }
    }, 300);
  }
  
  /**
   * Mostrar notificación agrupada
   */
  mostrarNotificacionAgrupada(cantidad) {
    const popup = document.createElement('div');
    popup.className = 'notificacion-popup notificacion-agrupada';
    popup.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      transition: transform 0.2s;
      border: 1px solid rgba(124, 58, 237, 0.3);
    `;
    
    popup.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: center;">
        <div style="width: 60px; height: 60px; background: rgba(124, 58, 237, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; border: 1px solid rgba(124, 58, 237, 0.3);">
          🔔
        </div>
        
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
            <h4 style="margin: 0; color: white; font-size: 15px; font-weight: 600;">
              ${cantidad} notificaciones pendientes
            </h4>
            <button 
              class="btn-cerrar-popup"
              style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; flex-shrink: 0; line-height: 1;"
            >
              ×
            </button>
          </div>
          
          <p style="margin: 0 0 8px 0; color: #cbd5e1; font-size: 13px; line-height: 1.4;">
            Tienes varias ofertas nuevas esperándote
          </p>
          
          <div style="display: inline-block; background: rgba(124, 58, 237, 0.2); color: #a78bfa; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; border: 1px solid rgba(124, 58, 237, 0.3);">
            Ver todas →
          </div>
        </div>
      </div>
    `;
    
    // Incrementar contador
    this.notificacionesActivas++;
    
    // Botón cerrar
    const btnCerrar = popup.querySelector('.btn-cerrar-popup');
    btnCerrar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cerrarPopup(popup);
    });
    
    // Hover effect
    popup.addEventListener('mouseenter', () => {
      popup.style.transform = 'translateX(-5px)';
    });
    
    popup.addEventListener('mouseleave', () => {
      popup.style.transform = 'translateX(0)';
    });
    
    // Click para ir a notificaciones
    popup.addEventListener('click', () => {
      loadPage('notificaciones');
      this.cerrarPopup(popup);
    });
    
    // Agregar al contenedor
    this.notificacionesContainer.appendChild(popup);
    
    // Auto-cerrar después de 12 segundos
    setTimeout(() => {
      this.cerrarPopup(popup);
    }, 12000);
  }
  
  /**
   * Verificar notificaciones pendientes
   */
  async verificarPendientes() {
    if (!this.userId) return;
    
    try {
      const pendientes = await NotificacionesService.obtenerNotificacionesPendientes(
        this.userId,
        'push'
      );
      
      if (pendientes.length === 0) return;
      
      // Si hay más de 3 notificaciones, mostrar notificación agrupada
      if (pendientes.length > this.MAX_NOTIFICACIONES) {
        this.mostrarNotificacionAgrupada(pendientes.length);
        return;
      }
      
      // Mostrar cada notificación pendiente (máximo 3)
      pendientes.slice(0, this.MAX_NOTIFICACIONES).forEach(notif => {
        this.mostrarPopup(notif);
      });
      
    } catch (error) {
      console.error('Error al verificar pendientes:', error);
    }
  }
  
  /**
   * Iniciar polling para verificar notificaciones cada minuto
   */
  iniciarPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = NotificacionesService.iniciarPolling(
      this.userId,
      (pendientes) => {
        if (pendientes.length === 0) return;
        
        // Si hay más de 3, mostrar agrupada
        if (pendientes.length > this.MAX_NOTIFICACIONES) {
          this.mostrarNotificacionAgrupada(pendientes.length);
        } else {
          // Mostrar cada una (respetando el límite)
          pendientes.slice(0, this.MAX_NOTIFICACIONES).forEach(notif => {
            this.mostrarPopup(notif);
          });
        }
      },
      60000 // 60 segundos
    );
  }
  
  /**
   * Detener polling
   */
  detenerPolling() {
    NotificacionesService.detenerPolling(this.pollingInterval);
    this.pollingInterval = null;
  }
  
  /**
   * Limpiar todas las notificaciones
   */
  limpiarTodas() {
    if (this.notificacionesContainer) {
      this.notificacionesContainer.innerHTML = '';
      this.notificacionesActivas = 0;
    }
  }
}

// Agregar estilos para animaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
  
  /* Responsive para móviles */
  @media (max-width: 768px) {
    #notificaciones-container {
      top: 10px !important;
      right: 10px !important;
      left: 10px !important;
      width: calc(100% - 20px) !important;
      max-width: 100% !important;
    }
    
    .notificacion-popup {
      font-size: 14px !important;
    }
    
    .notificacion-popup img {
      width: 50px !important;
      height: 50px !important;
    }
    
    .notificacion-popup h4 {
      font-size: 13px !important;
    }
    
    .notificacion-popup p {
      font-size: 12px !important;
    }
  }
  
  /* Para pantallas muy pequeñas */
  @media (max-width: 380px) {
    .notificacion-popup {
      padding: 12px !important;
    }
    
    .notificacion-popup img {
      width: 45px !important;
      height: 45px !important;
    }
  }
`;
document.head.appendChild(style);

// Exportar instancia única
const notificacionesUI = new NotificacionesUI();

window.notificacionesUI = notificacionesUI;