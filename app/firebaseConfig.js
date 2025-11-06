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
    updatePassword
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDw8O5W4T7qA65_TVfJQiP4vbKWB3MXIwc",
    authDomain: "bestpricegame-16642.firebaseapp.com",
    projectId: "bestpricegame-16642",
    storageBucket: "bestpricegame-16642.firebasestorage.app",
    messagingSenderId: "575667207886",
    appId: "1:575667207886:web:33300d8d0cbceacd411a9f"
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


console.log("🔥 Firebase inicializado");
