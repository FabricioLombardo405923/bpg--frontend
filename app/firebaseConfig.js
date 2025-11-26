import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup,
    createUserWithEmailAndPassword,
    updateProfile,
    updatePassword,
    deleteUser
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCr1Dq5PH1mXsq6t5hXhxyggiHYiWC6pD4",
    authDomain: "bestpricegame-30c56.firebaseapp.com",
    projectId: "bestpricegame-30c56",
    storageBucket: "bestpricegame-30c56.firebasestorage.app",
    messagingSenderId: "481228266856",
    appId: "1:481228266856:web:8916e81728695a8092cadd"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.auth = auth;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;
window.GoogleAuthProvider = GoogleAuthProvider;
window.signInWithPopup = signInWithPopup;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.updateProfile = updateProfile;
window.updatePassword = updatePassword;
window.deleteUser = deleteUser;

