// =============================================================
//  Serenity — Judul tab browser berjalan (marquee) v2.9.2 — gerak mulus
//  Teks judul bergerak dari kanan ke kiri di tab browser desktop, ponsel, tablet & bilah judul PWA.
//  Kenapa lebih halus dari sebelumnya:
//   • Ritme tetap & rapat (1 huruf tiap ±150 ms) tanpa jeda berhenti-jalan yang membuatnya terasa patah-patah.
//   • Detak dari Web Worker: browser memperlambat timer halaman saat tab tidak sedang dibuka (padahal justru
//     saat itulah judul tab terlihat). Timer di Worker tidak diperlambat → judul tetap bergerak lancar.
//   • Waktu dihitung dari jam (bukan menghitung detak) → tidak tersendat walau ada detak yang terlambat.
//  Catatan: browser hanya bisa menggeser judul tab per huruf (tidak per piksel) — ini gerak paling halus yang dimungkinkan.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
const GAP = '  •  ';  // jarak antar-putaran (spasi lebar)
const STEP_MS = 150;                       // kecepatan: 1 huruf tiap 150 ms
let base = '', chars = [], t0 = 0, last = '', worker = null, fallback = 0;

export function setMarqueeTitle(text) {
  text = String(text || '').replace(/\s+/g, ' ').trim();
  if (!text || text === base) return;
  base = text; chars = Array.from(text + GAP); t0 = performance.now();
  paint(); start();
}
function paint() {
  if (!chars.length) return;
  const pos = Math.floor((performance.now() - t0) / STEP_MS) % chars.length;
  const t = pos ? chars.slice(pos).concat(chars.slice(0, pos)).join('') : chars.join('');
  if (t !== last) { last = t; document.title = t; }
}
function start() {
  if (worker || fallback) return;
  try {
    const src = `let t=0;onmessage=(e)=>{clearInterval(t);if(e.data>0)t=setInterval(()=>postMessage(0),e.data)};`;
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = paint; worker.onerror = () => { worker?.terminate(); worker = null; useFallback(); };
    worker.postMessage(Math.round(STEP_MS / 3)); // detak 3× lebih rapat dari langkah → pergantian huruf tepat waktu
  } catch { useFallback(); }
  // Saat dicetak/dibagikan, browser memakai judul utuh
  addEventListener('beforeprint', () => { document.title = base; });
  addEventListener('afterprint', () => { last = ''; paint(); });
}
function useFallback() { if (!fallback) fallback = setInterval(paint, Math.round(STEP_MS / 3)); }
export const marqueeBase = () => base;
