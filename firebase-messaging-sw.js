importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

// Tu configuración de Firebase (la misma que en firebaseConfig.js)
firebase.initializeApp({
  apiKey: "AIzaSyCr1Dq5PH1mXsq6t5hXhxyggiHYiWC6pD4",
    authDomain: "bestpricegame-30c56.firebaseapp.com",
    projectId: "bestpricegame-30c56",
    storageBucket: "bestpricegame-30c56.firebasestorage.app",
    messagingSenderId: "481228266856",
    appId: "1:481228266856:web:8916e81728695a8092cadd"
});

const messaging = firebase.messaging();

// Manejar notificaciones en background (cuando la app está cerrada o minimizada)
messaging.onBackgroundMessage((payload) => {
  
  const { notification, data } = payload;
  
  // Configurar la notificación
  const notificationTitle = notification?.title || '🎮 Nueva Oferta';
  const notificationOptions = {
    body: notification?.body || 'Uno de tus juegos favoritos está en oferta',
    icon: notification?.image || '/icon.png',
    badge: '/badge.png',
    image: notification?.image || '',
    tag: data?.idSteam || 'notificacion',
    requireInteraction: true,
    actions: [
      {
        action: 'ver',
        title: 'Ver Oferta'
      },
      {
        action: 'cerrar',
        title: 'Cerrar'
      }
    ],
    data: {
      url: data?.url || '/',
      idSteam: data?.idSteam || null
    }
  };
  
  // Mostrar la notificación
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clicks en la notificación
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();
  
  if (event.action === 'ver' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    
    // Abrir o enfocar la ventana de la app
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clientList) => {
        // Si hay una ventana abierta, enfocarla
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});