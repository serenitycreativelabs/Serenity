// =============================================================
//  Serenity — Analitik kunjungan realtime (hemat kuota) & pencatat pemakaian Firestore
//  • Kunjungan: 1 tulis per sesi browser ke analytics/summary (total + harian, divalidasi Rules)
//  • Online sekarang: detak kehadiran tiap 2 menit (hanya saat tab terlihat) + hitungan agregat (count)
//  • Pemakaian Firestore: dikirim bertahap ke usage/{hari} (≤ 1 tulis / 5 menit / perangkat)
//  Tidak menyimpan data pribadi pengunjung (tanpa IP, tanpa nama, tanpa sidik jari perangkat).
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import * as F from './firebase.js';
import { track, takePending, restorePending, hasPending, dayKey, dayISO } from './usage.js';
import { esc, fmtNum } from './ui.js';

const ONLINE_WINDOW = 5 * 60e3, BEAT = 2 * 60e3, COUNT_EVERY = 90e3;
const sid = (() => {
  try { let s = sessionStorage.getItem('dd:sid'); if (!s) { s = crypto.getRandomValues(new Uint32Array(3)).join('').slice(0, 24); sessionStorage.setItem('dd:sid', s); } return s; }
  catch { return Math.random().toString(36).slice(2); }
})();
export const A = { summary: null, online: null, onlineAt: 0, subs: new Set() };
const notify = () => A.subs.forEach((f) => { try { f(A); } catch { /* */ } });
export const onAnalytics = (f) => { A.subs.add(f); return () => A.subs.delete(f); };

// ---------------------------------------------------------------- kunjungan (sekali per sesi)
export async function recordVisit() {
  try { if (sessionStorage.getItem('dd:visited')) return; sessionStorage.setItem('dd:visited', '1'); } catch { return; }
  if (/bot|crawl|spider|preview|headless/i.test(navigator.userAgent)) return;
  const ref = F.doc(F.db, 'analytics', 'summary'); const k = dayKey();
  try { await F.raw.updateDoc(ref, { total: F.increment(1), [`harian.${k}`]: F.increment(1) }); track('w', 1, 'analytics'); }
  catch (e) {
    if (/not-found|no document/i.test(`${e.code} ${e.message}`)) {
      try { await F.raw.setDoc(ref, { total: 1, harian: { [k]: 1 } }); track('w', 1, 'analytics'); } catch (x) { console.warn('kunjungan', x.code); }
    } else console.warn('kunjungan', e.code);
  }
}

// ---------------------------------------------------------------- kehadiran (online)
let beatT = 0, visBound = false, wOpen = false, outBound = false;
async function beat() {
  if (document.hidden) return;
  try {
    await F.raw.setDoc(F.doc(F.db, 'presence', sid), { at: F.serverTimestamp(), exp: F.Timestamp.fromMillis(Date.now() + 30 * 60e3) });
    track('w', 1, 'presence');
  } catch (e) { console.warn('presence', e.code); }
}
export function startPresence() {
  if (beatT) return;
  beat(); beatT = setInterval(beat, BEAT);
  if (!visBound) { visBound = true; document.addEventListener('visibilitychange', () => { if (!document.hidden && beatT) beat(); }); }
}
export function stopPresence() { clearInterval(beatT); beatT = 0; }
export async function countOnline(force = false) {
  if (!force && Date.now() - A.onlineAt < COUNT_EVERY - 2000) return A.online;
  A.onlineAt = Date.now();
  try {
    const q = F.query(F.collection(F.db, 'presence'), F.where('at', '>=', F.Timestamp.fromMillis(Date.now() - ONLINE_WINDOW)), F.limit(1000));
    const r = await F.getCountFromServer(q); A.online = Math.max(1, r.data().count);
  } catch (e) { console.warn('online', e.code); if (A.online == null) A.online = 1; }
  notify(); return A.online;
}

// ---------------------------------------------------------------- ringkasan (didengarkan hanya saat widget/monitor tampil)
let sumUnsub = null, sumRefs = 0, countT = 0;
export function listenSummary() {
  sumRefs++;
  if (!sumUnsub) {
    sumUnsub = F.onSnapshot(F.doc(F.db, 'analytics', 'summary'), (s) => { A.summary = s.data() || { total: 0, harian: {} }; notify(); }, (e) => console.warn('ringkasan', e.code));
    countOnline(true); countT = setInterval(() => { if (!document.hidden) countOnline(); }, COUNT_EVERY);
  }
  return () => { sumRefs = Math.max(0, sumRefs - 1); if (!sumRefs) { sumUnsub?.(); sumUnsub = null; clearInterval(countT); countT = 0; } };
}
export const todayVisits = () => A.summary?.harian?.[dayKey()] || 0;
export function lastDays(n = 7) {
  const out = []; const h = A.summary?.harian || {};
  for (let i = n - 1; i >= 0; i--) { const ms = Date.now() - i * 864e5; out.push({ k: dayKey(ms), iso: dayISO(ms), n: h[dayKey(ms)] || 0 }); }
  return out;
}

// ---------------------------------------------------------------- widget kecil kiri bawah (beranda)
let widgetOff = null;
export function mountVisitorWidget(el) {
  if (!el) { unmountVisitorWidget(); return; }
  if (!widgetOff) { const off1 = listenSummary(); const off2 = onAnalytics(() => paintWidget()); widgetOff = () => { off1(); off2(); }; }
  paintWidget();
}
export function unmountVisitorWidget() { widgetOff?.(); widgetOff = null; }
function paintWidget() {
  const el = document.getElementById('vis-widget'); if (!el) return;
  const days = lastDays(7); const peak = Math.max(1, ...days.map((d) => d.n));
  el.classList.toggle('open', wOpen); const open = wOpen;
  const on = A.online == null ? '–' : fmtNum(A.online);
  // v2.9.11: di footer hanya titik hijau; angka online/hari ini/total ada di panel saat titik ditekan
  el.innerHTML = `<button type="button" class="vw-pill vw-dot" aria-expanded="${open}" title="Pengunjung online: ${on} — tekan untuk statistik" aria-label="Statistik pengunjung realtime (${on} online)">
      <span class="vw-live"><i></i></span></button>
    <div class="vw-pop" role="dialog" aria-label="Statistik pengunjung"><b>Statistik pengunjung</b>
      <div class="vw-stats"><span><small>Online</small><b>${on}</b></span><span><small>Hari ini</small><b>${fmtNum(todayVisits())}</b></span><span><small>Total</small><b>${fmtNum(A.summary?.total || 0)}</b></span></div>
      <small class="vw-cap">Kunjungan 7 hari</small>
      <div class="vw-bars">${days.map((d) => `<span title="${esc(d.iso)}: ${fmtNum(d.n)} kunjungan"><i style="height:${Math.max(4, (d.n / peak) * 100)}%"></i><small>${esc(['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][new Date(d.iso + 'T12:00:00').getDay()])}</small></span>`).join('')}</div>
      <p><span class="vw-live"><i></i></span> ${on} pengunjung sedang online · diperbarui tiap 90 detik</p></div>`;
  el.querySelector('.vw-pill').onclick = () => { wOpen = !wOpen; el.classList.toggle('open', wOpen); el.querySelector('.vw-pill').setAttribute('aria-expanded', String(wOpen)); };
  if (!outBound) { outBound = true; document.addEventListener('pointerdown', (e) => { if (wOpen && !e.target.closest?.('#vis-widget')) { wOpen = false; const w = document.getElementById('vis-widget'); w?.classList.remove('open'); w?.querySelector('.vw-pill')?.setAttribute('aria-expanded', 'false'); } }); }
}

// ---------------------------------------------------------------- kirim pemakaian Firestore (bertahap)
let flushing = false;
export async function flushUsage(isStaff = false) {
  if (flushing || !hasPending()) return;
  flushing = true; const p = takePending();
  const data = { day: dayISO(), n: F.increment(1) };
  for (const [k, v] of Object.entries(p)) if (v) data[k] = F.increment(Math.min(v, 90000));
  if (p.r) data[isStaff ? 'ar' : 'pr'] = F.increment(Math.min(p.r, 90000));
  try { await F.raw.setDoc(F.doc(F.db, 'usage', dayKey()), data, { merge: true }); }
  catch (e) { restorePending(p); console.warn('pemakaian', e.code); }
  flushing = false;
}
export function startUsageFlush(getStaff) {
  setInterval(() => flushUsage(getStaff()), 5 * 60e3);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushUsage(getStaff()); });
}
