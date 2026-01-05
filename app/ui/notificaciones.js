const solicitarPermisoNotificaciones = window.solicitarPermisoNotificaciones;
const escucharNotificacionesForeground = window.escucharNotificacionesForeground;


class NotificacionesUI {
  constructor() {
    this.userId = null;
    this.pollingInterval = null;
    this.notificacionesContainer = null;
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
      width: 100%;
      pointer-events: none;
    `;
    
    document.body.appendChild(container);
    this.notificacionesContainer = container;
  }
  
  /**
   * Mostrar popup de notificación
   */
  mostrarPopup(notificacion) {
    const popup = document.createElement('div');
    popup.className = 'notificacion-popup';
    popup.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-left: 4px solid #7c3aed;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      transition: transform 0.2s;
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
          style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0;"
        />
        ` : ''}
        
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h4 style="margin: 0; color: white; font-size: 16px; font-weight: 600;">
              🎮 ${nombreJuego}
            </h4>
            <button 
              onclick="this.closest('.notificacion-popup').remove()"
              style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; flex-shrink: 0;"
            >
              ×
            </button>
          </div>
          
          <p style="margin: 0 0 8px 0; color: #cbd5e1; font-size: 14px; line-height: 1.4;">
            ${mensaje}
          </p>
          
          <div style="display: flex; gap: 8px; align-items: center;">
            ${descuento > 0 ? `
            <span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
              -${descuento}%
            </span>
            ` : ''}
            
            ${precio ? `
            <span style="color: #10b981; font-size: 16px; font-weight: 700;">
              $${precio}
            </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
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
        window.location.href = `?page=juego&id=${idSteam}`;
      }
      
      // Marcar como leída
      if (id) {
        NotificacionesService.marcarComoLeida(id).catch(console.error);
      }
      
      popup.remove();
    });
    
    // Agregar al contenedor
    this.notificacionesContainer.appendChild(popup);
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      popup.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => popup.remove(), 300);
    }, 10000);
    
    // Marcar como leída después de 3 segundos
    if (id) {
      setTimeout(() => {
        NotificacionesService.marcarComoLeida(id).catch(console.error);
      }, 3000);
    }
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
      
      // Mostrar cada notificación pendiente
      pendientes.forEach(notif => {
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
        pendientes.forEach(notif => this.mostrarPopup(notif));
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
   * Cargar página de configuración de notificaciones
   */
  async cargarPaginaConfiguracion() {
    if (!this.userId) return '';
    
    try {
      const config = await NotificacionesService.obtenerConfiguracion(this.userId);
      
      return `
        <div class="configuracion-notificaciones" style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: white; margin-bottom: 30px;">⚙️ Configuración de Notificaciones</h2>
          
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h3 style="color: white; margin-bottom: 20px;">Tipos de Notificación</h3>
            
            <label style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; color: white; cursor: pointer;">
              <input 
                type="checkbox" 
                id="notif-email"
                ${config.notificarEmail ? 'checked' : ''}
                style="width: 20px; height: 20px; cursor: pointer;"
              />
              <span>
                <strong>📧 Notificaciones por Email</strong>
                <br/>
                <small style="color: #94a3b8;">Recibe emails cuando tus juegos favoritos estén en oferta</small>
              </span>
            </label>
            
            <label style="display: flex; align-items: center; gap: 12px; color: white; cursor: pointer;">
              <input 
                type="checkbox" 
                id="notif-push"
                ${config.notificarPush ? 'checked' : ''}
                style="width: 20px; height: 20px; cursor: pointer;"
              />
              <span>
                <strong>🔔 Notificaciones Push</strong>
                <br/>
                <small style="color: #94a3b8;">Recibe notificaciones en tiempo real en tu navegador</small>
              </span>
            </label>
          </div>
          
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h3 style="color: white; margin-bottom: 20px;">Umbral de Descuento</h3>
            
            <label style="display: block; color: white; margin-bottom: 12px;">
              Solo notificar si el descuento es mayor a:
            </label>
            
            <div style="display: flex; align-items: center; gap: 12px;">
              <input 
                type="range" 
                id="umbral-descuento"
                min="0" 
                max="90" 
                step="5"
                value="${config.umbralDescuento}"
                style="flex: 1;"
              />
              <span id="umbral-valor" style="color: #10b981; font-weight: 700; font-size: 20px; min-width: 60px; text-align: right;">
                ${config.umbralDescuento}%
              </span>
            </div>
          </div>
          
          <button 
            id="guardar-config"
            style="width: 100%; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; border: none; padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;"
          >
            💾 Guardar Configuración
          </button>
        </div>
      `;
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      return '<p style="color: red;">Error al cargar la configuración</p>';
    }
  }
  
  /**
   * Inicializar eventos de la página de configuración
   */
  inicializarEventosConfiguracion() {
    // Actualizar valor del slider en tiempo real
    const slider = document.getElementById('umbral-descuento');
    const valor = document.getElementById('umbral-valor');
    
    if (slider && valor) {
      slider.addEventListener('input', (e) => {
        valor.textContent = `${e.target.value}%`;
      });
    }
    
    // Guardar configuración
    const btnGuardar = document.getElementById('guardar-config');
    if (btnGuardar) {
      btnGuardar.addEventListener('click', async () => {
        const config = {
          notificarEmail: document.getElementById('notif-email').checked ? 1 : 0,
          notificarPush: document.getElementById('notif-push').checked ? 1 : 0,
          umbralDescuento: parseInt(document.getElementById('umbral-descuento').value)
        };
        
        try {
          btnGuardar.textContent = '⏳ Guardando...';
          btnGuardar.disabled = true;
          
          await NotificacionesService.actualizarConfiguracion(this.userId, config);
          
          btnGuardar.textContent = '✅ Guardado!';
          setTimeout(() => {
            btnGuardar.textContent = '💾 Guardar Configuración';
            btnGuardar.disabled = false;
          }, 2000);
          
        } catch (error) {
          console.error('Error al guardar:', error);
          btnGuardar.textContent = '❌ Error al guardar';
          setTimeout(() => {
            btnGuardar.textContent = '💾 Guardar Configuración';
            btnGuardar.disabled = false;
          }, 2000);
        }
      });
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
`;
document.head.appendChild(style);

// Exportar instancia única
const notificacionesUI = new NotificacionesUI();

window.notificacionesUI = notificacionesUI;

// export default notificacionesUI;