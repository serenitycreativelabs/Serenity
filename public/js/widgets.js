// =============================================================
//  Serenity — Widget Beranda
//  • Panel "Berita & Kegiatan Lembaga" (di bawah Kegiatan Rutin) yang bergulir otomatis ke atas
//  • Pengaturan widget (kecepatan gulir, jumlah, tinggi, widget analitik) — khusus Super Admin
//  Berita diambil dari data lembaga yang SUDAH dimuat (tanpa read Firestore tambahan).
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import { ic, state, isSuper, logAudit, cfgUpdate } from './core.js';
import { esc, $, fmtDate, toast } from './ui.js';
import { plainText, mediaThumb } from './rich.js';

export const WIDGET_DEFAULT = { berita: { aktif: true, kecepatan: 24, maks: 20, tinggi: 380, arah: 'atas' }, kegiatan: { gerak: true, kecepatan: 18, tinggi: 260, arah: 'atas' }, analitik: { aktif: true } };
export const widgetCfg = () => {
  const w = state.config.widget || {};
  return { berita: { ...WIDGET_DEFAULT.berita, ...(w.berita || {}) }, kegiatan: { ...WIDGET_DEFAULT.kegiatan, ...(w.kegiatan || {}) }, analitik: { ...WIDGET_DEFAULT.analitik, ...(w.analitik || {}) } };
};

// ---------------------------------------------------------------- data berita semua lembaga
export function allLembagaNews(max = 20) {
  const out = [];
  for (const l of state.lembaga) {
    if (l.published === false) continue;
    for (const b of l.berita || []) {
      if (!b?.judul) continue;
      out.push({ ...b, bid: b.id || `b${(l.berita || []).indexOf(b)}`, lembagaId: l.id, lembaga: l.singkatan || l.nama, logo: l.logo || '', thumb: (b.media || []).map((m) => mediaThumb(m.url)).find(Boolean) || '' });
    }
  }
  return out.sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || ''))).slice(0, Math.max(1, max));
}

export function lembagaNewsPanel() {
  const c = widgetCfg().berita;
  const list = allLembagaNews(c.maks);
  const item = (b) => `<a class="ln-item" href="#/lembaga/${esc(b.lembagaId)}/berita/${esc(b.bid)}" title="${esc(b.judul)}">
      ${b.thumb ? `<span class="ln-thumb"><img loading="lazy" src="${esc(b.thumb)}" alt="" onerror="this.parentNode.remove()"></span>` : ''}
      <span class="ln-body"><span class="ln-meta"><span class="ln-org">${b.logo ? `<img src="${esc(b.logo)}" alt="">` : ic('shield')}${esc(b.lembaga)}</span>${b.tanggal ? `<small>${esc(fmtDate(b.tanggal))}</small>` : ''}</span>
      <b>${esc(b.judul)}</b><small class="ln-ex">${esc(plainText(b.isi || '').replace(/\s+/g, ' ').trim().slice(0, 110))}</small></span></a>`;
  return `<div class="side-panel lnews sp-card">
    <div class="sp-head">${ic('news')}<div><b>Berita & Kegiatan Lembaga</b><small>${list.length ? `${list.length} kabar terbaru` : 'Kabar dari lembaga gampong'}</small></div><a class="sp-more" href="#/lembaga" title="Semua lembaga" aria-label="Semua lembaga">${ic('chev')}</a></div>
    ${list.length ? `<div class="ln-viewport sp-fill" data-speed="${Math.max(4, Math.min(120, Number(c.kecepatan) || 24))}" data-dir="${c.arah === 'bawah' ? 'bawah' : 'atas'}" tabindex="0" aria-label="Berita lembaga bergulir otomatis. Arahkan kursor untuk menjeda."><div class="ln-track">${list.map(item).join('')}</div></div>` : '<p class="muted small kg-empty">Belum ada berita lembaga.</p>'}
  </div>`;
}

// ---------------------------------------------------------------- gulir otomatis vertikal (JavaScript, mulus & hemat CPU)
// Dipakai panel "Berita & Kegiatan Lembaga" (.ln-viewport) dan "Kegiatan Rutin" (.kg-viewport)
const runs = new Map();
export function startNewsScroller() {
  for (const [vp, id] of runs) { if (!vp.isConnected) { cancelAnimationFrame(id.raf); runs.delete(vp); } }
  document.querySelectorAll('.ln-viewport, .kg-viewport').forEach((vp) => { if (!runs.has(vp)) runScroller(vp); });
}
function runScroller(vp) {
  const track = vp.querySelector('.ln-track, .kg-track'); if (!track) return;
  const base = track.innerHTML; const baseN = track.children.length;
  if (!baseN || vp.clientHeight < 24) { vp.classList.add('static'); return; } // panel tersembunyi/kosong
  // v2.9.12: isi sedikit (mis. 1–2 kegiatan) tetap bergulir — ulangi isi sampai melebihi tinggi blok agar putarannya mulus
  let rep = 0; while (track.scrollHeight < vp.clientHeight + 8 && rep++ < 24) track.insertAdjacentHTML('beforeend', base);
  track.insertAdjacentHTML('beforeend', track.innerHTML);
  track.querySelectorAll(':scope > *').forEach((el, i) => { if (i >= baseN) { el.setAttribute('aria-hidden', 'true'); el.querySelectorAll('a,[tabindex]').forEach((a) => a.setAttribute('tabindex', '-1')); } });
  const loopH = track.scrollHeight / 2;
  const speed = Number(vp.dataset.speed) || 24; const dir = vp.dataset.dir === 'bawah' ? 1 : -1;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let y = dir < 0 ? 0 : -loopH, last = performance.now(), paused = false, holdUntil = performance.now() + 1200;
  const pause = () => { paused = true; }; const resume = () => { paused = false; holdUntil = performance.now() + 600; };
  vp.onmouseenter = pause; vp.onmouseleave = resume; vp.onfocusin = pause; vp.onfocusout = resume;
  vp.addEventListener('touchstart', pause, { passive: true }); vp.addEventListener('touchend', () => setTimeout(resume, 1500), { passive: true });
  // gulir manual dengan roda mouse saat dijeda
  vp.addEventListener('wheel', (e) => { e.preventDefault(); y -= e.deltaY * 0.6; if (y > 0) y -= loopH; if (-y >= loopH) y += loopH; track.style.transform = `translate3d(0,${y}px,0)`; }, { passive: false });
  const st = { raf: 0 }; runs.set(vp, st);
  const step = (t) => {
    if (!vp.isConnected) { runs.delete(vp); return; }
    const dt = Math.min(64, t - last); last = t;
    if (!paused && !document.hidden && t > holdUntil) {
      y += dir * ((reduce ? speed * 0.5 : speed) * dt) / 1000;
      if (dir < 0 && -y >= loopH) y += loopH;
      if (dir > 0 && y >= 0) y -= loopH;
      track.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
    }
    st.raf = requestAnimationFrame(step);
  };
  st.raf = requestAnimationFrame(step);
}

// Panel Kegiatan Rutin didaftarkan dari cms.js (menghindari impor melingkar) untuk pratinjau di pengaturan
let kegiatanPanelFn = null;
export const registerKegiatanPanel = (fn) => { kegiatanPanelFn = fn; };
// ---------------------------------------------------------------- Admin › Sistem › Widget Beranda (khusus Super Admin)
export function viewWidget(main) {
  state.view = 'form';
  if (!isSuper()) { main.innerHTML = `<div class="callout">${ic('lock')}<div><b>Khusus Super Admin</b></div></div>`; return; }
  const c = widgetCfg();
  const n = allLembagaNews(200).length;
  main.setAttribute('data-guard', '');
  main.innerHTML = `
  <div class="panel-grid two" id="wb-root">
    <div class="panel"><h3>${ic('news')} Panel Berita & Kegiatan Lembaga</h3>
      <p class="muted small">Menampilkan seluruh berita & kegiatan dari setiap lembaga gampong di beranda, tepat di bawah panel <b>Kegiatan Rutin</b>, bergulir otomatis. Saat ini tersedia <b>${n}</b> berita lembaga.</p>
      <div class="form-grid">
        <label class="check span-2"><input type="checkbox" id="wb-on" ${c.berita.aktif ? 'checked' : ''}> Tampilkan panel di beranda</label>
        <label class="field span-2"><span>Kecepatan gulir — <b id="wb-speed-v">${c.berita.kecepatan}</b> piksel/detik</span><input type="range" id="wb-speed" min="4" max="120" step="1" value="${c.berita.kecepatan}"><small class="muted">4 = sangat pelan • 24 = nyaman dibaca (bawaan) • 120 = sangat cepat</small></label>
        <label class="field"><span>Arah gulir</span><select id="wb-dir"><option value="atas" ${c.berita.arah !== 'bawah' ? 'selected' : ''}>Bergerak ke atas (berita baru muncul dari bawah)</option><option value="bawah" ${c.berita.arah === 'bawah' ? 'selected' : ''}>Bergerak ke bawah (dari atas ke bawah)</option></select></label>
        <label class="field"><span>Jumlah berita maksimum</span><input type="number" id="wb-max" min="3" max="60" value="${c.berita.maks}"></label>
        <label class="field"><span>Tinggi panel (piksel)</span><input type="number" id="wb-h" min="200" max="900" step="10" value="${c.berita.tinggi}"></label>
      </div>
      <div class="ln-preview" id="wb-prev"></div>
      <div class="row-gap"><button class="btn btn-primary" id="wb-save" data-save>${ic('check')} Simpan</button><button class="btn btn-ghost" id="wb-reset">Kembalikan bawaan</button><a class="btn btn-ghost" href="#/" target="_blank">${ic('ext')} Lihat beranda</a></div>
    </div>
    <div class="panel"><h3>${ic('repeat')} Gerak Panel Kegiatan Rutin</h3>
      <p class="muted small">Dua blok di beranda — <b>Kegiatan Rutin (hari ini)</b> dan <b>Kegiatan Lainnya</b> — masing-masing kartu sendiri yang bergulir otomatis seperti panel berita lembaga. Walau kegiatannya sedikit (mis. hanya 1), daftar tetap bergulir berulang dengan mulus; arahkan kursor/sentuh untuk menjeda.</p>
      <div class="form-grid">
        <label class="check span-2"><input type="checkbox" id="wk-on" ${c.kegiatan.gerak ? 'checked' : ''}> Gulir otomatis</label>
        <label class="field span-2"><span>Kecepatan gulir — <b id="wk-speed-v">${c.kegiatan.kecepatan}</b> piksel/detik</span><input type="range" id="wk-speed" min="4" max="120" step="1" value="${c.kegiatan.kecepatan}"><small class="muted">18 = nyaman dibaca (bawaan)</small></label>
        <label class="field"><span>Arah gulir</span><select id="wk-dir"><option value="atas" ${c.kegiatan.arah !== 'bawah' ? 'selected' : ''}>Bergerak ke atas</option><option value="bawah" ${c.kegiatan.arah === 'bawah' ? 'selected' : ''}>Bergerak ke bawah</option></select></label>
        <label class="field"><span>Tinggi tiap blok (piksel)</span><input type="number" id="wk-h" min="140" max="900" step="10" value="${c.kegiatan.tinggi}"></label>
      </div>
      <div class="kg-preview" id="wk-prev"></div>
    </div>
    <div class="panel"><h3>${ic('activity')} Widget Analitik Pengunjung</h3>
      <p class="muted small">Titik hijau kecil di footer kiri bawah beranda (sebelum running text). Tekan titik untuk melihat pengunjung <b>online sekarang</b>, kunjungan <b>hari ini</b>, <b>total</b>, dan grafik 7 hari. Hanya tampil di halaman depan.</p>
      <label class="check"><input type="checkbox" id="wa-on" ${c.analitik.aktif ? 'checked' : ''}> Tampilkan widget analitik di beranda</label>
      <div class="callout small-callout">${ic('shield')}<div><p class="small">Hemat kuota: 1 tulis per sesi pengunjung, detak kehadiran tiap 2 menit hanya saat tab terlihat, dan hitungan online memakai <i>count aggregation</i> (1 read per 1.000 pengunjung). Tidak ada data pribadi yang disimpan.</p></div></div>
      <a class="btn btn-ghost btn-sm" href="#/admin/monitor">${ic('chart')} Buka Monitor & Analitik</a>
    </div>
  </div>`;
  const read = () => ({ kegiatan: { gerak: $('#wk-on').checked, kecepatan: Number($('#wk-speed').value) || 18, arah: $('#wk-dir').value, tinggi: Math.max(140, Math.min(900, Number($('#wk-h').value) || 260)) }, berita: { aktif: $('#wb-on').checked, kecepatan: Number($('#wb-speed').value) || 24, maks: Math.max(3, Math.min(60, Number($('#wb-max').value) || 20)), tinggi: Math.max(200, Math.min(900, Number($('#wb-h').value) || 380)), arah: $('#wb-dir').value }, analitik: { aktif: $('#wa-on').checked } });
  const prev = () => {
    const keep = state.config.widget; state.config.widget = read();
    $('#wb-prev').innerHTML = lembagaNewsPanel();
    if (kegiatanPanelFn) $('#wk-prev').innerHTML = kegiatanPanelFn();
    state.config.widget = keep;
    $('#wb-speed-v').textContent = $('#wb-speed').value; $('#wk-speed-v').textContent = $('#wk-speed').value;
    startNewsScroller();
  };
  $('#wb-root').addEventListener('input', prev); prev();
  $('#wb-reset').onclick = () => { $('#wb-on').checked = true; $('#wb-speed').value = 24; $('#wb-max').value = 20; $('#wb-h').value = 380; $('#wb-dir').value = 'atas'; $('#wa-on').checked = true; $('#wk-on').checked = true; $('#wk-speed').value = 18; $('#wk-dir').value = 'atas'; $('#wk-h').value = 260; prev(); };
  $('#wb-save').onclick = async () => {
    const v = read();
    try {
      await cfgUpdate({ widget: v }); state.config.widget = v;
      logAudit('sistem', 'widget', 'Mengubah pengaturan widget beranda', { detail: `Berita lembaga: ${v.berita.aktif ? 'aktif' : 'nonaktif'}, ${v.berita.kecepatan} px/detik, arah ${v.berita.arah}, maks ${v.berita.maks}, tinggi ${v.berita.tinggi}px • Kegiatan rutin: ${v.kegiatan.gerak ? `bergulir ${v.kegiatan.kecepatan} px/detik, arah ${v.kegiatan.arah}, tinggi ${v.kegiatan.tinggi}px` : 'diam'} • Analitik: ${v.analitik.aktif ? 'aktif' : 'nonaktif'}` });
      toast('Pengaturan widget disimpan', 'success');
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
}
