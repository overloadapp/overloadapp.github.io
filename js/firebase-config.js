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
  apiKey: "AIzaSyCo_B3IfFYsJ_cOgZqZjCjknrIG0c0YjiI",
  authDomain: "overloadapp.firebaseapp.com",
  projectId: "overloadapp",
  storageBucket: "overloadapp.firebasestorage.app",
  messagingSenderId: "1092579624396",
  appId: "1:1092579624396:web:f2b895ef41cb51c2620969",
  measurementId: "G-WNV5WZJEKN"
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