// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHbuUnWGH83j7EjG70he7WtmdprrKTD9I",
  authDomain: "projectgym-bd9a5.firebaseapp.com",
  projectId: "projectgym-bd9a5",
  storageBucket: "projectgym-bd9a5.firebasestorage.app",
  messagingSenderId: "908223011254",
  appId: "1:908223011254:web:e5058062cf55eb0aef8917"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Export Firestore functions
export { collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, deleteDoc, updateDoc, getDoc };

// Export Auth functions
export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
};