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
  collection, doc, getDoc as _getDoc, getDocs as _getDocs, setDoc as _setDoc, addDoc as _addDoc, updateDoc as _updateDoc, deleteDoc as _deleteDoc, onSnapshot as _onSnapshot,
  query, where, orderBy, limit, startAfter, writeBatch as _writeBatch, serverTimestamp, arrayUnion, arrayRemove, deleteField, Timestamp, increment, documentId,
  getCountFromServer as _getCountFromServer, terminate, clearIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { track } from './usage.js';

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
    const { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } = await import(`${SDK}/firebase-app-check.js`);
       const Provider = APP.appCheckProvider === 'v3' ? ReCaptchaV3Provider : ReCaptchaEnterpriseProvider;
       initializeAppCheck(a, { provider: new Provider(APP.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
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

// =============================================================
//  Lapisan tulis/baca terpantau (v2.4)
//  • Menghitung read/write/delete untuk Monitor & Analitik (Super Admin)
//  • Menandai setiap tulisan pada koleksi tersinkron dengan `syncAt` dan menaikkan versi di
//    meta/pub atau meta/adm → perangkat lain cukup mengambil data yang berubah saja (delta sync)
//  • Mencatat ID yang dihapus di koleksi `hapus` (tombstone) agar perangkat admin lain ikut menghapus
//  • Bila Firestore Rules versi baru belum di-deploy, otomatis kembali ke cara tulis lama (tidak rusak)
// =============================================================
export const SYNC_COLS = { informasi: 'pub', lembaga: 'pub', dokumen: 'pub', kegiatan: 'pub', halaman: 'pub', instagram: 'pub', warga: 'adm', dusun: 'adm', master: 'adm' };
export const SYNC_DOCS = { 'config/app': 'cfg_app', 'config/stats': 'cfg_stats' };
export const syncState = { enabled: true, reason: '' };
const writeHooks = new Set();
export const onWrite = (f) => { writeHooks.add(f); return () => writeHooks.delete(f); };

export const colName = (x) => {
  try { return String(x?.path ?? x?._query?.path?.canonicalString?.() ?? '').split('/')[0] || 'lainnya'; } catch { return 'lainnya'; }
};
function syncOf(ref) {
  const p = String(ref?.path || '').split('/');
  if (p.length === 2 && SYNC_COLS[p[0]]) return { col: p[0], id: p[1], meta: SYNC_COLS[p[0]], key: p[0], inject: true };
  const k = SYNC_DOCS[p.join('/')];
  if (k) return { col: 'config', id: p[1], meta: 'pub', key: k, inject: false };
  return null;
}
const isDenied = (e) => /permission|insufficient/i.test(`${e?.code || ''} ${e?.message || ''}`);
const withSync = (s, data) => (s?.inject && syncState.enabled && data && typeof data === 'object' ? { ...data, syncAt: serverTimestamp() } : data);
function decorate(b, touched, dels) {
  const metas = {};
  for (const s of touched) (metas[s.meta] ||= {})[s.key] = serverTimestamp();
  for (const [m, v] of Object.entries(metas)) b.set(doc(_db, 'meta', m), v, { merge: true });
  for (const [c, ids] of Object.entries(dels)) for (let i = 0; i < ids.length; i += 450) b.set(doc(collection(_db, 'hapus')), { c, ids: ids.slice(i, i + 450), at: serverTimestamp() });
}
// ops: [type, ref, data, opts]
async function commitOps(ops) {
  const touched = new Map(); const dels = {};
  for (const [t, ref] of ops) { const s = syncOf(ref); if (!s) continue; touched.set(`${s.meta}:${s.key}`, s); if (t === 'delete' && s.inject) (dels[s.col] ||= []).push(s.id); }
  const build = (sync) => {
    const b = _writeBatch(_db);
    for (const [t, ref, data, opts] of ops) {
      const d = sync ? withSync(syncOf(ref), data) : data;
      if (t === 'delete') b.delete(ref); else if (t === 'update') b.update(ref, d); else b.set(ref, d, opts || {});
    }
    if (sync && touched.size) decorate(b, touched.values(), dels);
    return b;
  };
  const useSync = syncState.enabled && touched.size > 0;
  try { await build(useSync).commit(); }
  catch (e) {
    if (!useSync || !isDenied(e)) throw e;
    // Rules lama belum mengenal syncAt/meta → ulangi tanpa penanda sinkron
    await build(false).commit();
    syncState.enabled = false; syncState.reason = 'Firestore Rules v2.4 belum di-deploy — sinkron bertahap dinonaktifkan sementara.';
    console.warn(syncState.reason);
  }
  let w = 0, d = 0;
  for (const [t, ref] of ops) { if (t === 'delete') { d++; track('d', 1, colName(ref)); } else { w++; track('w', 1, colName(ref)); } }
  void w; void d;
  if (touched.size) writeHooks.forEach((f) => { try { f([...touched.values()], dels); } catch { /* */ } });
}
export const setDoc = (ref, data, opts) => commitOps([['set', ref, data, opts]]);
export const updateDoc = (ref, data, ...rest) => (rest.length || typeof data !== 'object' ? _updateDoc(ref, data, ...rest).then((r) => { track('w', 1, colName(ref)); return r; }) : commitOps([['update', ref, data]]));
export const deleteDoc = (ref) => commitOps([['delete', ref]]);
export async function addDoc(colRef, data) { const ref = doc(colRef); await commitOps([['set', ref, data]]); return ref; }
export function writeBatch() {
  const ops = [];
  const b = {
    set(ref, data, opts) { ops.push(['set', ref, data, opts]); return b; },
    update(ref, data) { ops.push(['update', ref, data]); return b; },
    delete(ref) { ops.push(['delete', ref]); return b; },
    commit() { return commitOps(ops); },
  };
  return b;
}
export async function getDoc(ref) { const s = await _getDoc(ref); if (!s.metadata.fromCache) track('r', 1, colName(ref)); return s; }
export async function getDocs(q) { const s = await _getDocs(q); if (!s.metadata.fromCache) track('r', Math.max(1, s.size), colName(q)); return s; }
export async function getCountFromServer(q) { const r = await _getCountFromServer(q); track('r', Math.max(1, Math.ceil((r.data().count || 0) / 1000)), colName(q)); return r; }
export function onSnapshot(ref, next, err) {
  let first = true;
  return _onSnapshot(ref, (s) => {
    try {
      if (!s.metadata.fromCache) {
        const n = typeof s.docChanges === 'function' ? (first ? Math.max(1, s.size) : s.docChanges().length) : 1;
        first = false; track('r', n, colName(ref));
      }
    } catch { /* */ }
    next(s);
  }, err);
}
// Akses mentah (tidak dihitung & tanpa penanda sinkron) — untuk analitik/kehadiran/flush pemakaian
export const raw = { setDoc: _setDoc, updateDoc: _updateDoc, getDoc: _getDoc, getDocs: _getDocs, deleteDoc: _deleteDoc, onSnapshot: _onSnapshot };

export {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, sendPasswordResetEmail,
  collection, doc, query, where, orderBy, limit, startAfter, serverTimestamp, arrayUnion, arrayRemove, deleteField, Timestamp, increment, documentId,
};
