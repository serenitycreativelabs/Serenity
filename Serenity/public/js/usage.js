// =============================================================
//  Serenity — penghitung pemakaian Firestore (sisi klien)
//  Menghitung read / write / delete / download / upload / read dihemat.
//  Angka ini ESTIMASI per perangkat (angka resmi: Firebase Console → Usage).
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
export const KINDS = ['r', 'w', 'd', 'dl', 'ul', 'sv'];
export const KIND_LABEL = { r: 'Read', w: 'Write', d: 'Delete', dl: 'Download', ul: 'Upload', sv: 'Read dihemat' };

// Total sesi ini (sejak halaman dibuka) + rincian per koleksi
export const usage = { r: 0, w: 0, d: 0, dl: 0, ul: 0, sv: 0, cols: {}, since: Date.now() };
const pending = { r: 0, w: 0, d: 0, dl: 0, ul: 0, sv: 0 };
const subs = new Set();
let raf = 0;

export function track(kind, n = 1, col = '') {
  n = Math.round(Number(n) || 0);
  if (n <= 0 || !(kind in pending)) return;
  usage[kind] += n; pending[kind] += n;
  if (col) { const c = (usage.cols[col] ||= { r: 0, w: 0, d: 0, sv: 0 }); if (kind in c) c[kind] += n; }
  if (!raf && subs.size) raf = requestAnimationFrame(() => { raf = 0; subs.forEach((f) => { try { f(usage); } catch { /* */ } }); });
}
export const onUsage = (f) => { subs.add(f); return () => subs.delete(f); };
export const hasPending = () => KINDS.some((k) => pending[k] > 0);
export function takePending() { const o = { ...pending }; KINDS.forEach((k) => { pending[k] = 0; }); return o; }
export function restorePending(o) { KINDS.forEach((k) => { pending[k] += o[k] || 0; }); }

// Kunci hari dalam zona WIB (UTC+7) → "2026_10_29" (sama dengan perhitungan di Firestore Rules)
export function dayKey(ms = Date.now()) {
  const t = new Date(ms + 7 * 3600e3);
  return `${t.getUTCFullYear()}_${t.getUTCMonth() + 1}_${t.getUTCDate()}`;
}
export function dayISO(ms = Date.now()) {
  const t = new Date(ms + 7 * 3600e3);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}
export const keyToISO = (k) => { const [y, m, d] = String(k).split('_'); return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };
