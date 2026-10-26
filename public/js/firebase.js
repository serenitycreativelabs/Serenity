// Inisialisasi Firebase — konfigurasi dimuat saat runtime (tidak ada API key di kode sumber)
import { APP } from './config.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  verifyBeforeUpdateEmail, sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, limit, startAfter, writeBatch, serverTimestamp, arrayUnion, arrayRemove, deleteField, Timestamp,
  terminate, clearIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

async function loadConfig() {
  // 1) Firebase Hosting menyediakan konfigurasi proyek di URL khusus ini
  try {
    const r = await fetch('/__/firebase/init.json', { cache: 'no-cache' });
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
      const j = await r.json();
      if (j && j.apiKey) return j;
    }
  } catch { /* bukan di Firebase Hosting */ }
  // 2) Uji lokal: berkas firebase-config.local.js (di-.gitignore)
  try {
    const m = await import('./firebase-config.local.js');
    const c = m.default || m.firebaseConfig;
    if (c && c.apiKey && !String(c.apiKey).startsWith('ISI_')) return c;
  } catch { /* tidak ada */ }
  return null;
}

export const firebaseConfig = await loadConfig();
export const configError = firebaseConfig ? null : 'CONFIG_MISSING';

async function attachAppCheck(a) {
  if (!APP.appCheckSiteKey) return;
  try {
    if (['localhost', '127.0.0.1'].includes(location.hostname)) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    const { initializeAppCheck, ReCaptchaV3Provider } = await import(`${SDK}/firebase-app-check.js`);
    initializeAppCheck(a, { provider: new ReCaptchaV3Provider(APP.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
  } catch (e) { console.warn('App Check gagal dimuat', e); }
}

export const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
if (app) await attachAppCheck(app);
export const auth = app ? getAuth(app) : null;

let _db = null;
if (app) {
  try {
    _db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    console.warn('Cache offline tidak tersedia, memakai mode online.', e);
    _db = getFirestore(app);
  }
}
export const db = _db;

// Membuat akun admin baru tanpa mengeluarkan sesi Super Admin (memakai instance aplikasi kedua)
export async function createAuthUser(email, password) {
  const sec = initializeApp(firebaseConfig, 'sec-' + Date.now());
  await attachAppCheck(sec);
  try {
    const a = getAuth(sec);
    const c = await createUserWithEmailAndPassword(a, email, password);
    const uid = c.user.uid;
    await signOut(a);
    return uid;
  } finally {
    await deleteApp(sec).catch(() => {});
  }
}

// Hapus cache data offline di perangkat (dipanggil saat logout demi privasi data warga)
export async function wipeLocalCache() {
  try { await terminate(db); await clearIndexedDbPersistence(db); } catch (e) { console.warn('clear cache', e); }
}

export {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, sendPasswordResetEmail,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, limit, startAfter, writeBatch, serverTimestamp, arrayUnion, arrayRemove, deleteField, Timestamp,
};
