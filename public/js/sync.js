// =============================================================
//  Serenity — Sinkronisasi Bertahap (Delta Sync) v1
//  Tujuan: hemat kuota READ Firestore. Data disimpan di perangkat (IndexedDB) dan saat halaman
//  dibuka aplikasi hanya meminta dokumen yang BERUBAH sejak kunjungan terakhir.
//
//  Cara kerja singkat:
//   1. Satu dokumen versi (meta/pub untuk publik, meta/adm untuk admin) berisi cap waktu
//      perubahan terakhir tiap koleksi. Dokumen ini didengarkan secara realtime (1 read / perubahan).
//   2. Bila versi koleksi sama dengan salinan di perangkat → 0 read (data diambil dari perangkat).
//   3. Bila berbeda → ambil hanya dokumen dengan syncAt > versi lama + hapus yang tercatat di
//      koleksi `hapus` + 1 hitungan jumlah dokumen (count). Bila jumlah tidak cocok → muat ulang penuh.
//   4. Data publik disimpan apa adanya (memang publik). Data admin (warga, dll.) DIENKRIPSI
//      AES-GCM 256-bit dengan kunci turunan password (PBKDF2-SHA256, 210.000 iterasi). Kunci dihapus
//      saat logout, sehingga salinan di perangkat tidak dapat dibaca tanpa password akun.
//   5. Semua kegagalan (Rules/indeks belum di-deploy, offline, data rusak) otomatis kembali ke cara
//      lama (listener penuh) — aplikasi tidak pernah rusak karena fitur ini.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import * as F from './firebase.js';
import { track } from './usage.js';

const DBNAME = 'serenity-sync', STORE = 'kv', VER = 1;
const FULL_EVERY = 7 * 864e5;      // pengaman: muat ulang penuh tiap 7 hari
const DELTA_MAX = 400;             // lebih dari ini → muat ulang penuh
let dbp = null;
function idb() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DBNAME, VER);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  }).catch((e) => { console.warn('IndexedDB tidak tersedia', e); return null; });
  return dbp;
}
async function tx(mode, fn) {
  const d = await idb(); if (!d) return undefined;
  return new Promise((res) => {
    try { const t = d.transaction(STORE, mode); const st = t.objectStore(STORE); const r = fn(st); t.oncomplete = () => res(r?.result); t.onerror = () => res(undefined); t.onabort = () => res(undefined); }
    catch { res(undefined); }
  });
}
const kvGet = (k) => tx('readonly', (s) => s.get(k));
const kvSet = (k, v) => tx('readwrite', (s) => s.put(v, k));
const kvDel = (k) => tx('readwrite', (s) => s.delete(k));
async function kvKeys() { return (await tx('readonly', (s) => s.getAllKeys())) || []; }

// ---------------------------------------------------------------- kriptografi (data admin)
const te = new TextEncoder(), td = new TextDecoder();
async function deriveKey(saltId, password) {
  let salt = await kvGet(`salt:${saltId}`);
  if (!salt) { salt = crypto.getRandomValues(new Uint8Array(16)); await kvSet(`salt:${saltId}`, salt); }
  const base = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encrypt(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj))); return { iv, ct }; }
async function decrypt(key, rec) { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.iv }, key, rec.ct); return JSON.parse(td.decode(pt)); }

// ---------------------------------------------------------------- serialisasi (Timestamp ↔ JSON)
function revive(v) {
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === 'object') {
    const ks = Object.keys(v);
    if (ks.includes('seconds') && ks.includes('nanoseconds') && ks.length <= 3) return new F.Timestamp(Number(v.seconds), Number(v.nanoseconds));
    const o = {}; for (const [k, x] of Object.entries(v)) o[k] = revive(x); return o;
  }
  return v;
}
const tsMs = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : t && t.seconds != null ? t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6) : 0);

// ---------------------------------------------------------------- status sesi
const S = {
  uid: '', key: null, meta: { pub: null, adm: null }, metaState: { pub: 'idle', adm: 'idle' }, metaUnsub: { pub: null, adm: null },
  watches: new Map(), login: null, stats: { hit: 0, delta: 0, full: 0, legacy: 0 },
};
export const syncStatus = () => ({ uid: S.uid, encrypted: !!S.key, enabled: F.syncState.enabled, meta: { ...S.metaState }, stats: { ...S.stats },
  watches: [...S.watches.values()].map((w) => ({ id: w.id, scope: w.scope, mode: w.mode, docs: w.doc ? (w.data ? 1 : 0) : w.docs.size, v: tsMs(w.v), last: w.last, lastCost: w.lastCost })) });

// Dipanggil form login SEBELUM signIn: kunci diturunkan dari password setelah UID diketahui
export function beginLogin(password) {
  let resolve; const p = new Promise((r) => { resolve = r; });
  S.login = { p, resolve, password };
  const t = setTimeout(() => resolve(null), 20000);
  return {
    done: (uid) => { clearTimeout(t); resolve(uid); },
    fail: () => { clearTimeout(t); resolve(null); S.login = null; },
  };
}
// Setelah ganti password: turunkan kunci baru & enkripsi ulang salinan
export async function rekey(password) {
  if (!S.uid) return;
  try { await kvDel(`salt:${S.uid}`); S.key = await deriveKey(S.uid, password); await kvSet(`key:${S.uid}`, S.key); for (const w of S.watches.values()) if (w.scope === 'adm') await save(w); } catch (e) { console.warn('rekey', e); }
}
async function loadKey(uid) {
  if (S.login) {
    const lg = S.login; const got = await lg.p; S.login = null;
    if (got === uid && lg.password) {
      try { const k = await deriveKey(uid, lg.password); await kvSet(`key:${uid}`, k); return k; } catch (e) { console.warn('kunci', e); }
    }
  }
  try { return (await kvGet(`key:${uid}`)) || null; } catch { return null; }
}

// ---------------------------------------------------------------- mulai / berhenti
export function startPublic() { listenMeta('pub'); }
export async function startAdmin(uid) {
  S.uid = uid; S.key = await loadKey(uid);
  listenMeta('adm');
}
export async function stopAdmin({ forget = false } = {}) {
  for (const w of [...S.watches.values()]) if (w.scope === 'adm') unwatch(w.id);
  S.metaUnsub.adm?.(); S.metaUnsub.adm = null; S.meta.adm = null; S.metaState.adm = 'idle';
  if (forget && S.uid) await kvDel(`key:${S.uid}`);
  S.key = null; S.uid = '';
}
export async function clearDeviceCache() {
  for (const k of await kvKeys()) if (/^(pub|adm):/.test(k)) await kvDel(k);
  for (const w of S.watches.values()) { w.v = null; w.full = 0; }
}

function listenMeta(scope) {
  if (S.metaUnsub[scope]) return;
  S.metaState[scope] = 'loading';
  let lastKey = null;
  // includeMetadataChanges: WAJIB. Tanpa ini, bila versi di cache perangkat sama dengan server,
  // Firestore tidak mengirim kabar "sudah terkonfirmasi server" → data tidak pernah dimuat
  // (dasbor tertahan di animasi loading / halaman publik menampilkan data lama).
  S.metaUnsub[scope] = F.onSnapshot(F.doc(F.db, 'meta', scope), { includeMetadataChanges: true }, (s) => {
    if (s.metadata.hasPendingWrites) return; // tulisan perangkat ini belum dikonfirmasi server (cap waktu belum final)
    const d = s.data() || {};
    if (s.metadata.fromCache) { if (S.metaState[scope] !== 'ok') { S.meta[scope] = d; S.metaState[scope] = 'cache'; } return; } // versi dari cache belum tentu terbaru
    const key = JSON.stringify(Object.entries(d).map(([k, v]) => [k, tsMs(v)]).sort());
    const wasOk = S.metaState[scope] === 'ok';
    S.meta[scope] = d; S.metaState[scope] = 'ok';
    if (wasOk && key === lastKey) return; // hanya perubahan metadata — tidak ada versi baru
    lastKey = key;
    for (const w of S.watches.values()) if (w.metaScope === scope) schedule(w);
  }, (e) => {
    console.warn(`meta/${scope} tidak terbaca — memakai listener penuh`, e?.code);
    S.metaState[scope] = 'off'; S.metaUnsub[scope] = null;
    for (const w of S.watches.values()) if (w.metaScope === scope) toLegacy(w);
  });
}
// Super Admin / admin: lengkapi versi yang belum ada agar perangkat lain bisa langsung delta
export async function ensureMeta() {
  if (!F.syncState.enabled) return;
  try {
    const keys = { pub: [...Object.entries(F.SYNC_COLS).filter(([, m]) => m === 'pub').map(([k]) => k), ...Object.values(F.SYNC_DOCS)], adm: Object.entries(F.SYNC_COLS).filter(([, m]) => m === 'adm').map(([k]) => k) };
    for (const m of ['pub', 'adm']) {
      const cur = (await F.raw.getDoc(F.doc(F.db, 'meta', m))).data() || {};
      const miss = keys[m].filter((k) => !cur[k]);
      if (miss.length) await F.raw.setDoc(F.doc(F.db, 'meta', m), Object.fromEntries(miss.map((k) => [k, F.serverTimestamp()])), { merge: true });
    }
  } catch (e) { console.warn('ensureMeta', e?.code || e); }
}

// ---------------------------------------------------------------- watch
// spec: { id, scope:'pub'|'adm', col, base:[constraints], limit, doc:'config/app', onData(list|data, info), onError }
export function watch(spec) {
  unwatch(spec.id);
  const metaKey = spec.doc ? F.SYNC_DOCS[spec.doc] : spec.col;
  const metaScope = spec.doc ? 'pub' : F.SYNC_COLS[spec.col] || 'pub';
  const w = { ...spec, metaKey, metaScope, docs: new Map(), data: null, v: null, full: 0, mode: 'init', busy: false, again: false, alive: true, restored: false, last: 0, lastCost: 0, legacyUnsub: null, emitted: false };
  S.watches.set(w.id, w);
  (async () => {
    await restore(w);
    w.restored = true;
    if (!w.alive) return;
    if (w.docs.size || w.data) emit(w, false);
    listenMeta(metaScope);
    if (S.metaState[metaScope] === 'off') toLegacy(w);
    else if (S.metaState[metaScope] === 'ok') schedule(w);
    // Pengaman: bila versi dari server belum datang (koneksi lambat/offline), jangan biarkan layar
    // tertahan di animasi loading — muat apa yang tersedia, lalu sinkron normal saat versi tiba
    const wait = typeof navigator !== 'undefined' && navigator.onLine === false ? 2500 : 6000;
    setTimeout(() => { if (w.alive && !w.emitted && !w.busy && S.metaState[metaScope] !== 'ok' && w.mode !== 'legacy') full(w, null); }, wait);
  })();
  return () => unwatch(w.id);
}
export function unwatch(id) {
  const w = S.watches.get(id); if (!w) return;
  w.alive = false; w.legacyUnsub?.(); S.watches.delete(id);
}
const storeKey = (w) => (w.scope === 'adm' ? `adm:${S.uid}:${w.id}` : `pub:${w.id}`);
async function restore(w) {
  try {
    const rec = await kvGet(storeKey(w)); if (!rec) return;
    let obj = rec;
    if (w.scope === 'adm') { if (!S.key || !rec.ct) return; obj = await decrypt(S.key, rec); }
    if (obj.fmt !== 1) return;
    w.v = obj.v ? new F.Timestamp(obj.v.s, obj.v.n) : null; w.full = obj.full || 0;
    if (w.doc) w.data = obj.data ? revive(obj.data) : null;
    else w.docs = new Map(obj.docs.map(([id, d]) => [id, revive(d)]));
  } catch (e) { console.warn('salinan perangkat tidak terbaca, muat ulang penuh', w.id, e?.name || e); w.v = null; w.docs = new Map(); w.data = null; }
}
async function save(w) {
  if (w.mode === 'legacy') return;
  try {
    const obj = { fmt: 1, v: w.v ? { s: w.v.seconds, n: w.v.nanoseconds } : null, full: w.full, at: Date.now() };
    if (w.doc) obj.data = w.data ? JSON.parse(JSON.stringify(w.data)) : null; else obj.docs = [...w.docs.entries()].map(([id, d]) => [id, JSON.parse(JSON.stringify(d))]);
    if (w.scope === 'adm') { if (!S.key) return; await kvSet(storeKey(w), await encrypt(S.key, obj)); }
    else await kvSet(storeKey(w), obj);
  } catch (e) { console.warn('simpan salinan', w.id, e); }
}
function emit(w, fromServer) {
  if (!w.alive) return;
  w.emitted = true;
  try { if (w.doc) w.onData(w.data, { fromServer }); else w.onData([...w.docs.entries()].map(([id, d]) => ({ id, ...d })), { fromServer }); }
  catch (e) { console.error('sync onData', w.id, e); }
}
function schedule(w) {
  if (!w.alive || w.mode === 'legacy' || !w.restored) return; // tunggu salinan perangkat termuat dulu
  if (w.busy) { w.again = true; return; }
  w.busy = true;
  pull(w).catch((e) => console.warn('sync', w.id, e)).finally(() => { w.busy = false; if (w.again && w.alive) { w.again = false; schedule(w); } });
}
const sameV = (a, b) => a && b && a.seconds === b.seconds && a.nanoseconds === b.nanoseconds;
const qBase = (w, extra = []) => F.query(F.collection(F.db, w.col), ...(w.base || []), ...extra);

async function pull(w) {
  const meta = S.meta[w.metaScope] || {}; const mv = meta[w.metaKey] || null;
  const have = w.doc ? !!w.data || w.v : w.docs.size > 0 || !!w.v;
  const stale = Date.now() - (w.full || 0) > FULL_EVERY;
  if (have && mv && sameV(w.v, mv) && !stale) {
    S.stats.hit++; w.mode = 'cache'; w.last = Date.now(); w.lastCost = 0;
    track('sv', w.doc ? 1 : Math.max(1, w.docs.size), w.col || 'config');
    if (!w.emitted) emit(w, true);
    return;
  }
  if (w.doc) return pullDoc(w, mv);
  if (!have || !w.v || !mv || stale) return full(w, mv);
  try { await delta(w, mv); }
  catch (e) { console.warn('delta gagal, muat penuh', w.id, e?.code || e); await full(w, mv); }
}
async function pullDoc(w, mv) {
  try {
    const s = await F.getDoc(F.doc(F.db, ...w.doc.split('/')));
    if (s.metadata.fromCache) return;
    w.data = s.exists() ? s.data() : null; w.v = mv; w.full = Date.now(); w.mode = 'doc'; w.last = Date.now(); w.lastCost = 1;
    await save(w); emit(w, true);
  } catch (e) { handleErr(w, e); }
}
async function full(w, mv) {
  try {
    const s = await F.getDocs(qBase(w, w.limit ? [F.limit(w.limit)] : []));
    if (s.metadata.fromCache) { if (!w.emitted) { w.docs = new Map(s.docs.map((d) => [d.id, d.data()])); emit(w, false); } return; }
    w.docs = new Map(s.docs.map((d) => [d.id, d.data()]));
    w.v = mv; w.full = Date.now(); w.mode = 'full'; w.last = Date.now(); w.lastCost = Math.max(1, s.size); S.stats.full++;
    await save(w); emit(w, true);
  } catch (e) { handleErr(w, e); }
}
async function delta(w, mv) {
  let cost = 0;
  const lim = Math.min(DELTA_MAX, w.limit || DELTA_MAX);
  const s = await F.getDocs(qBase(w, [F.where('syncAt', '>', w.v), F.limit(lim)]));
  cost += Math.max(1, s.size);
  if (s.metadata.fromCache) return;
  if (s.size >= lim) return full(w, mv);
  const changed = new Set();
  s.docs.forEach((d) => { w.docs.set(d.id, d.data()); changed.add(d.id); });
  if (w.scope === 'adm') {
    try {
      const t = await F.getDocs(F.query(F.collection(F.db, 'hapus'), F.where('c', '==', w.col), F.where('at', '>=', w.v), F.limit(200)));
      cost += Math.max(1, t.size);
      // catatan dari akun Kepala Dusun (ber-field `dusun`) hanya berlaku untuk warga dusun tersebut
      t.docs.forEach((d) => { const td = d.data(); (td.ids || []).forEach((id) => { if (changed.has(id)) return; if (td.dusun && w.docs.get(id)?.dusun !== td.dusun) return; w.docs.delete(id); }); });
    } catch (e) { console.warn('tombstone', e?.code); }
  }
  const c = await F.getCountFromServer(qBase(w, w.limit ? [F.limit(w.limit)] : []));
  cost += 1;
  if (c.data().count !== w.docs.size) return full(w, mv);
  track('sv', Math.max(0, w.docs.size - s.size), w.col);
  w.v = mv; w.mode = 'delta'; w.last = Date.now(); w.lastCost = cost; S.stats.delta++;
  await save(w); emit(w, true);
}
function handleErr(w, e) {
  if (/permission|insufficient/i.test(`${e?.code} ${e?.message}`)) { w.onError?.(e); return; }
  console.warn('sync baca', w.id, e?.code || e);
  if (!w.emitted) emit(w, false);
}
// Mode cadangan: listener penuh seperti versi lama
function toLegacy(w) {
  if (!w.alive || w.mode === 'legacy') return;
  w.mode = 'legacy'; S.stats.legacy++;
  if (w.doc) {
    w.legacyUnsub = F.onSnapshot(F.doc(F.db, ...w.doc.split('/')), (s) => { w.data = s.data() || null; emit(w, !s.metadata.fromCache); }, (e) => w.onError?.(e));
  } else {
    w.legacyUnsub = F.onSnapshot(qBase(w, w.limit ? [F.limit(w.limit)] : []), (s) => { w.docs = new Map(s.docs.map((d) => [d.id, d.data()])); emit(w, !s.metadata.fromCache); }, (e) => w.onError?.(e));
  }
}

// Tulisan dari perangkat ini: terapkan hapus secara lokal agar langsung hilang dari layar
F.onWrite((touched, dels) => {
  for (const [c, ids] of Object.entries(dels || {})) for (const w of S.watches.values()) {
    if (w.col !== c || w.mode === 'legacy') continue;
    let n = 0; ids.forEach((id) => { if (w.docs.delete(id)) n++; });
    if (n) emit(w, true);
  }
});
