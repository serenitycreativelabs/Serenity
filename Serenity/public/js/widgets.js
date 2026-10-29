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

export const WIDGET_DEFAULT = { berita: { aktif: true, kecepatan: 24, maks: 20, tinggi: 380, arah: 'atas' }, analitik: { aktif: true } };
export const widgetCfg = () => {
  const w = state.config.widget || {};
  return { berita: { ...WIDGET_DEFAULT.berita, ...(w.berita || {}) }, analitik: { ...WIDGET_DEFAULT.analitik, ...(w.analitik || {}) } };
};

// ---------------------------------------------------------------- data berita semua lembaga
export function allLembagaNews(max = 20) {
  const out = [];
  for (const l of state.lembaga) {
    if (l.published === false) continue;
    for (const b of l.berita || []) {
      if (!b?.judul) continue;
      out.push({ ...b, lembagaId: l.id, lembaga: l.singkatan || l.nama, logo: l.logo || '', thumb: (b.media || []).map((m) => mediaThumb(m.url)).find(Boolean) || '' });
    }
  }
  return out.sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || ''))).slice(0, Math.max(1, max));
}

export function lembagaNewsPanel() {
  const c = widgetCfg().berita;
  const list = allLembagaNews(c.maks);
  const item = (b) => `<a class="ln-item" href="#/lembaga/${esc(b.lembagaId)}" title="${esc(b.judul)}">
      ${b.thumb ? `<span class="ln-thumb"><img loading="lazy" src="${esc(b.thumb)}" alt="" onerror="this.parentNode.remove()"></span>` : ''}
      <span class="ln-body"><span class="ln-meta"><span class="ln-org">${b.logo ? `<img src="${esc(b.logo)}" alt="">` : ic('shield')}${esc(b.lembaga)}</span>${b.tanggal ? `<small>${esc(fmtDate(b.tanggal))}</small>` : ''}</span>
      <b>${esc(b.judul)}</b><small class="ln-ex">${esc(plainText(b.isi || '').replace(/\s+/g, ' ').trim().slice(0, 110))}</small></span></a>`;
  return `<div class="side-panel lnews">
    <div class="sp-head">${ic('news')}<div><b>Berita & Kegiatan Lembaga</b><small>${list.length ? `${list.length} kabar terbaru dari lembaga gampong` : 'Kabar dari setiap lembaga gampong'}</small></div></div>
    ${list.length ? `<div class="ln-viewport" style="height:${Math.max(200, Math.min(900, Number(c.tinggi) || 380))}px" data-speed="${Math.max(4, Math.min(120, Number(c.kecepatan) || 24))}" data-dir="${c.arah === 'bawah' ? 'bawah' : 'atas'}" tabindex="0" aria-label="Berita lembaga bergulir otomatis. Arahkan kursor untuk menjeda."><div class="ln-track">${list.map(item).join('')}</div></div>
      <p class="muted tiny ln-hint">${ic('eye')} Arahkan kursor / sentuh untuk menjeda</p>` : '<p class="muted small">Belum ada berita lembaga.</p>'}
    <a class="link small" href="#/lembaga">Semua lembaga →</a></div>`;
}

// ---------------------------------------------------------------- gulir otomatis vertikal (JavaScript, mulus & hemat CPU)
let raf = 0;
export function startNewsScroller() {
  cancelAnimationFrame(raf); raf = 0;
  const vp = $('.ln-viewport'); const track = vp?.querySelector('.ln-track'); if (!vp || !track) return;
  const base = track.innerHTML;
  if (track.scrollHeight <= vp.clientHeight + 4) { vp.classList.add('static'); return; } // muat semua → tidak perlu bergulir
  track.insertAdjacentHTML('beforeend', base);
  const loopH = track.scrollHeight / 2;
  const speed = Number(vp.dataset.speed) || 24; const dir = vp.dataset.dir === 'bawah' ? 1 : -1;
  let y = dir < 0 ? 0 : -loopH, last = performance.now(), paused = false, holdUntil = 0;
  const pause = () => { paused = true; }; const resume = () => { paused = false; holdUntil = performance.now() + 600; };
  vp.onmouseenter = pause; vp.onmouseleave = resume; vp.onfocusin = pause; vp.onfocusout = resume;
  vp.addEventListener('touchstart', pause, { passive: true }); vp.addEventListener('touchend', resume, { passive: true });
  // gulir manual dengan roda mouse saat dijeda
  vp.addEventListener('wheel', (e) => { e.preventDefault(); y -= e.deltaY * 0.6; if (y > 0) y -= loopH; if (-y >= loopH) y += loopH; track.style.transform = `translate3d(0,${y}px,0)`; }, { passive: false });
  const step = (t) => {
    if (!vp.isConnected) { raf = 0; return; }
    const dt = Math.min(64, t - last); last = t;
    if (!paused && !document.hidden && t > holdUntil) {
      y += dir * (speed * dt) / 1000;
      if (dir < 0 && -y >= loopH) y += loopH;
      if (dir > 0 && y >= 0) y -= loopH;
      track.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

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
    <div class="panel"><h3>${ic('activity')} Widget Analitik Pengunjung</h3>
      <p class="muted small">Widget kecil di kiri bawah beranda (di atas running text): jumlah pengunjung <b>online sekarang</b>, kunjungan <b>hari ini</b>, dan <b>total</b>. Klik widget untuk melihat grafik 7 hari. Hanya tampil di halaman depan.</p>
      <label class="check"><input type="checkbox" id="wa-on" ${c.analitik.aktif ? 'checked' : ''}> Tampilkan widget analitik di beranda</label>
      <div class="callout small-callout">${ic('shield')}<div><p class="small">Hemat kuota: 1 tulis per sesi pengunjung, detak kehadiran tiap 2 menit hanya saat tab terlihat, dan hitungan online memakai <i>count aggregation</i> (1 read per 1.000 pengunjung). Tidak ada data pribadi yang disimpan.</p></div></div>
      <a class="btn btn-ghost btn-sm" href="#/admin/monitor">${ic('chart')} Buka Monitor & Analitik</a>
    </div>
  </div>`;
  const read = () => ({ berita: { aktif: $('#wb-on').checked, kecepatan: Number($('#wb-speed').value) || 24, maks: Math.max(3, Math.min(60, Number($('#wb-max').value) || 20)), tinggi: Math.max(200, Math.min(900, Number($('#wb-h').value) || 380)), arah: $('#wb-dir').value }, analitik: { aktif: $('#wa-on').checked } });
  const prev = () => {
    const keep = state.config.widget; state.config.widget = read();
    $('#wb-prev').innerHTML = lembagaNewsPanel(); state.config.widget = keep;
    $('#wb-speed-v').textContent = $('#wb-speed').value;
    startNewsScroller();
  };
  $('#wb-root').addEventListener('input', prev); prev();
  $('#wb-reset').onclick = () => { $('#wb-on').checked = true; $('#wb-speed').value = 24; $('#wb-max').value = 20; $('#wb-h').value = 380; $('#wb-dir').value = 'atas'; $('#wa-on').checked = true; prev(); };
  $('#wb-save').onclick = async () => {
    const v = read();
    try {
      await cfgUpdate({ widget: v }); state.config.widget = v;
      logAudit('sistem', 'widget', 'Mengubah pengaturan widget beranda', { detail: `Berita lembaga: ${v.berita.aktif ? 'aktif' : 'nonaktif'}, ${v.berita.kecepatan} px/detik, arah ${v.berita.arah}, maks ${v.berita.maks}, tinggi ${v.berita.tinggi}px • Analitik: ${v.analitik.aktif ? 'aktif' : 'nonaktif'}` });
      toast('Pengaturan widget disimpan', 'success');
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
}
