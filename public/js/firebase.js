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

// Catatan tiap percobaan (ditampilkan di layar bantuan bila semua gagal)
export const configAttempts = [];
const note = (src, ok, why) => configAttempts.push({ src, ok, why });

const validCfg = (c) => c && c.apiKey && c.projectId && !String(c.apiKey).startsWith('ISI_');

// Memuat /__/firebase/init.js dari situs Firebase Hosting proyek (bisa lintas domain karena berupa <script>)
function loadHostingInitScript(origin) {
  return new Promise((resolve) => {
    let captured = null; const prev = window.firebase;
    window.firebase = { initializeApp: (c) => { captured = c; return {}; }, apps: [] };
    const s = document.createElement('script');
    const done = (why) => { clearTimeout(t); window.firebase = prev; s.remove(); resolve(captured ? { cfg: captured } : { why }); };
    const t = setTimeout(() => done('waktu habis'), 7000);
    s.src = `${origin}/__/firebase/init.js?v=${Date.now()}`;
    s.onload = () => done(captured ? '' : 'skrip tidak berisi konfigurasi');
    s.onerror = () => done('tidak dapat dimuat (situs Firebase Hosting belum pernah di-deploy?)');
    document.head.appendChild(s);
  });
}

import EMBEDDED_CONFIG from './firebase-config.js';

async function loadConfig() {
  // Utama: konfigurasi bawaan aplikasi → langsung terhubung di semua browser & perangkat
  if (validCfg(EMBEDDED_CONFIG)) { note('js/firebase-config.js', true); return EMBEDDED_CONFIG; }
  note('js/firebase-config.js', false, 'belum diisi');
  // 0) Konfigurasi sementara yang ditempel admin di browser ini (hanya tersimpan di perangkat ini)
  try {
    const c = JSON.parse(localStorage.getItem('dd:fbcfg') || 'null');
    if (validCfg(c)) { note('Konfigurasi tersimpan di browser ini', true); return c; }
  } catch { /* abaikan */ }
  // 1) Firebase Hosting: konfigurasi tersedia di domain yang sama
  try {
    const r = await fetch('/__/firebase/init.json', { cache: 'no-cache' });
    const ct = r.headers.get('content-type') || '';
    if (r.ok && ct.includes('json')) {
      const j = await r.json();
      if (validCfg(j)) { note('/__/firebase/init.json', true); return j; }
      note('/__/firebase/init.json', false, 'isi tidak valid');
    } else note('/__/firebase/init.json', false, r.ok ? 'bukan Firebase Hosting' : `HTTP ${r.status}`);
  } catch (e) { note('/__/firebase/init.json', false, 'tidak tersedia'); }

  // 2) Berkas lokal / hasil GitHub Actions (tidak pernah di-commit)
  try {
    const m = await import('./firebase-config.local.js');
    const c = m.default || m.firebaseConfig;
    if (validCfg(c)) { note('js/firebase-config.local.js', true); return c; }
    note('js/firebase-config.local.js', false, 'belum diisi');
  } catch { note('js/firebase-config.local.js', false, 'berkas tidak ada'); }

  // 3) Hosting lain (GitHub Pages, Netlify, domain sendiri, localhost): ambil dari situs Firebase Hosting proyek
  const origins = [...new Set([APP.firebaseHostingUrl, APP.firebaseProjectId && `https://${APP.firebaseProjectId}.web.app`, APP.firebaseProjectId && `https://${APP.firebaseProjectId}.firebaseapp.com`].filter(Boolean))]
    .filter((o) => !location.origin.startsWith(o));
  for (const o of origins) {
    const r = await loadHostingInitScript(o);
    if (validCfg(r.cfg)) { note(`${o}/__/firebase/init.js`, true); return r.cfg; }
    note(`${o}/__/firebase/init.js`, false, r.why || 'tidak valid');
  }
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
