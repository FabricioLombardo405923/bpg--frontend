
class NotificacionesService {
  
  // ==================== CONFIGURACIÓN ====================
  
  /**
   * Obtener configuración de notificaciones del usuario
   */
  static async obtenerConfiguracion(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/config/${userId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.data;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar configuración de notificaciones
   */
  static async actualizarConfiguracion(userId, config) {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/config/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.data;
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar token FCM para notificaciones push
   */
  static async actualizarFCMToken(userId, fcmToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, fcmToken })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.data;
    } catch (error) {
      console.error('Error al actualizar token FCM:', error);
      throw error;
    }
  }
  
  // ==================== NOTIFICACIONES ====================
  
  /**
   * Obtener todas las notificaciones del usuario
   */
  static async obtenerNotificaciones(userId, limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/${userId}?limit=${limit}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }
  
  /**
   * Obtener notificaciones pendientes
   */
  static async obtenerNotificacionesPendientes(userId, tipo = null) {
    try {
      const url = tipo 
        ? `${API_BASE_URL}/notificaciones/${userId}/push-pendientes-mostrar`
        : `${API_BASE_URL}/notificaciones/${userId}/pendientes`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.data;
    } catch (error) {
      console.error('Error al obtener notificaciones pendientes:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como mostrada
   */
  static async marcarComoMostrada(notificacionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}/mostrada`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return true;
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      throw error;
    }
  }
  
  /**
   * Marcar notificación como leída
   */
  static async marcarComoLeida(notificacionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}/leida`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return true;
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      throw error;
    }
  }
  
  // ==================== POLLING ====================
  
  /**
   * Iniciar polling para verificar notificaciones pendientes cada X segundos
   */
  static iniciarPolling(userId, callback, intervalo = 60000) {
    const pollingInterval = setInterval(async () => {
      try {
        const pendientes = await this.obtenerNotificacionesPendientes(userId, 'push');
        
        if (pendientes && pendientes.length > 0) {
          callback(pendientes);
        }
      } catch (error) {
        console.error('Error en polling:', error);
      }
    }, intervalo);
    
    return pollingInterval;
  }
  
  /**
   * Detener polling
   */
  static detenerPolling(pollingInterval) {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  }
}

// Exportar como default para usar con import
// export default NotificacionesService;

window.NotificacionesService = NotificacionesService;
