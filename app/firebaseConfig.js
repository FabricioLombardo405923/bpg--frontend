// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
    apiKey: "AIzaSyCr1Dq5PH1mXsq6t5hXhxyggiHYiWC6pD4",
    authDomain: "bestpricegame-30c56.firebaseapp.com",
    projectId: "bestpricegame-30c56",
    storageBucket: "bestpricegame-30c56.appspot.com",
    messagingSenderId: "481228266856",
    appId: "1:481228266856:web:8916e81728695a8092cadd"
};

// ==================== INICIALIZAR FIREBASE ====================
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ==================== AUTH ====================
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ==================== MESSAGING ====================
let messaging = null;
if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
}

// ==================== EXPONER GLOBAL ====================
window.firebase = firebase;
window.auth = auth;
window.googleProvider = googleProvider;
window.messaging = messaging;

// ==================== AUTH FUNCTIONS ====================
window.signInWithEmailAndPassword = (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
};

window.createUserWithEmailAndPassword = (email, password) => {
    return auth.createUserWithEmailAndPassword(email, password);
};

window.signInWithGoogle = () => {
    return auth.signInWithPopup(googleProvider);
};

window.signOut = () => {
    return auth.signOut();
};

window.onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};

window.updateProfileFirebase = (user, data) => {
    return user.updateProfile(data);
};

window.updatePasswordFirebase = (user, password) => {
    return user.updatePassword(password);
};

window.deleteUserFirebase = (user) => {
    return user.delete();
};


// ==================== NOTIFICACIONES ====================
const VAPID_KEY = "BP7BrG5k2L8bSatHT4tv9ksP5DF7r-GwT2o-PKTZ_o8jJfx27HUB1fq9UltUwBIkHXz5XPn2a00cgM5aMbP9xNc";

/**
 * Solicitar permiso y registrar token FCM
 */
window.solicitarPermisoNotificaciones = async function (userId) {
    try {
        if (!messaging) {
            console.warn("⚠️ Firebase Messaging no soportado");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("⚠️ Permiso de notificaciones denegado");
            return null;
        }

        const token = await messaging.getToken({ vapidKey: VAPID_KEY });

        if (token && window.NotificacionesService) {
            await NotificacionesService.actualizarFCMToken(userId, token);
        }

        return token;
    } catch (error) {
        console.error("❌ Error notificaciones:", error);
        return null;
    }
};

/**
 * Escuchar notificaciones en foreground
 */
window.escucharNotificacionesForeground = function (callback) {
    if (!messaging) return;

    messaging.onMessage((payload) => {

        const { title, body, image } = payload.notification || {};

        if (callback) {
            callback({
                titulo: title || "Nueva oferta",
                mensaje: body || "",
                imagen: image || "",
                datos: payload.data || {}
            });
        }

        if (Notification.permission === "granted") {
            new Notification(title || "Nueva oferta", {
                body,
                icon: image || "/icon.png",
                tag: payload.data?.idSteam || "notificacion"
            });
        }
    });
};

/**
 * Service Worker
 */
window.registrarServiceWorker = async function () {
    if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker no soportado");
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        return registration;
    } catch (error) {
        console.error("❌ Error Service Worker:", error);
        return null;
    }
};
