// Inisialisasi Firebase (modular SDK via CDN, tanpa build step)
import { firebaseConfig } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  verifyBeforeUpdateEmail, sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, writeBatch, serverTimestamp, arrayUnion, arrayRemove, deleteField, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let _db;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (e) {
  console.warn('Cache offline tidak tersedia, memakai mode online.', e);
  _db = getFirestore(app);
}
export const db = _db;

export {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, sendPasswordResetEmail,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, writeBatch, serverTimestamp, arrayUnion, arrayRemove, deleteField, Timestamp,
};
