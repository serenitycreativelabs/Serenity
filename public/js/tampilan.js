// Tampilan & Tema (khusus Super Admin), Ikon Aplikasi (khusus Super Admin), dan Latar Belakang
// (Super Admin atau admin berizin "latar"). Pengunjung & admin lain hanya bisa mengganti mode gelap/terang.
// Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
import { ic, state, isSuper, can, logAudit, diff, cfgUpdate } from './core.js';
import { esc, $, $$, toast, confirmDialog, debounce } from './ui.js';
import {
  applyTheme, applyIcon, applyBackground, ensureFonts, backgroundKind, makeIconPng, guard,
  THEME_PRESETS, MODELS, READ_MODELS, FONT_PAIRS, RADII, EFFECTS, STYLE_PRESETS, DEFAULT_TEMA, FONT_LIST, FONT_CATS, fontStack, ensureFontIds,
} from './layout.js';
import { CURSORS, CLICKS, ICON_LEVELS, FX_DEFAULT, applyFx } from './motion.js';

const deny = (main, t = 'Khusus Super Admin') => { main.innerHTML = `<div class="callout">${ic('lock')}<div><b>${esc(t)}</b><p>Menu ini hanya dapat diubah oleh Super Admin${t.includes('izin') ? ' atau admin yang diberi izin' : ''}.</p></div></div>`; };

// ================================================================ Tampilan & Tema
export function viewTampilan(main) {
  state.view = 'form';
  if (!isSuper()) return deny(main);
  main.setAttribute('data-guard', '');
  const t = { ...DEFAULT_TEMA, ...(state.config.tema || {}) };
  const fx = { ...FX_DEFAULT, ...(t.fx || {}) };
  ensureFonts(Object.keys(FONT_PAIRS)); // pratinjau semua huruf (hanya di halaman ini)
  ensureFontIds(Object.keys(FONT_LIST));
  const fontSel = (id, cur, label) => `<label class="field"><span>${label}</span><select id="${id}"><option value="">— ikuti pasangan huruf di atas —</option>${Object.entries(FONT_CATS).map(([c, cl]) => `<optgroup label="${esc(cl)}">${Object.entries(FONT_LIST).filter(([, f]) => f.cat === c).map(([k, f]) => `<option value="${k}" ${cur === k ? 'selected' : ''} style="font-family:${esc(fontStack(k))}">${esc(f.label)}${f.note ? ` (${esc(f.note)})` : ''}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
  const opt = (name, entries, cur, render, cls = '') => entries.map(([k, v]) => `<label class="choice ${cls} ${cur === k ? 'on' : ''}"><input type="radio" name="${name}" value="${k}" ${cur === k ? 'checked' : ''}>${render(k, v)}</label>`).join('');
  const groups = [...new Set(Object.values(THEME_PRESETS).map((p) => p.group))];
  const ikon = state.config.ikon || {};
  main.innerHTML = `
  <div class="callout">${ic('eye')}<div><b>Tampilan & Tema — khusus Super Admin</b><p>Warna, model tampilan, efek, huruf, sudut panel, dan ikon berlaku untuk seluruh pengunjung & admin. Admin lain dan pengunjung hanya dapat mengganti <b>mode gelap/terang</b> (tombol ☾). Perubahan tampil sebagai pratinjau; klik <b>Simpan Tema</b> untuk menerapkan.</p></div></div>

  <div class="panel"><h3>${ic('star')} Gaya Siap Pakai</h3><p class="muted small">Satu klik untuk mengisi warna, efek, huruf, sudut, dan mode sekaligus — lalu sesuaikan bila perlu.</p>
    <div class="style-presets">${Object.entries(STYLE_PRESETS).map(([k, sp]) => { const p = THEME_PRESETS[sp.tema.preset]; const dark = sp.tema.mode === 'dark'; return `<button type="button" class="style-preset" data-style="${k}"><span class="sp-sw ${sp.tema.efek === 'genz' ? 'sp-genz' : ''}" style="--c:${p.brand};--a:${p.accent};background:${dark ? `radial-gradient(circle at 25% 30%, ${p.brand}88, transparent 60%), radial-gradient(circle at 80% 70%, ${p.accent}77, transparent 60%), #0f1419` : `linear-gradient(135deg, ${p.bg || '#f5f6f8'}, ${p.brand}33), ${p.bg || '#fff'}`}"></span><b>${esc(sp.label)}${sp.badge ? ` <em class="sp-new">${esc(sp.badge)}</em>` : ''}</b><small>${esc(sp.desc)}</small></button>`; }).join('')}</div></div>

  <div class="panel"><h3>${ic('grid')} Warna Tema</h3>
    ${groups.map((g) => `<h4 class="detail-h">${esc(g)}</h4><div class="choices colors">${opt('preset', Object.entries(THEME_PRESETS).filter(([, v]) => v.group === g), t.preset, (k, v) => `<span class="sw" style="--c:${v.brand};--a:${v.accent}${v.bg ? `;background:${v.bg}` : ''}"><i></i><i></i></span><b>${esc(v.label)}</b>${v.desc ? `<small>${esc(v.desc)}</small>` : ''}`)}</div>`).join('')}
    <div class="form-grid" style="margin-top:12px">
      <label class="field"><span>Warna utama kustom (opsional)</span><div class="input-group"><input type="color" id="tm-brand" value="${esc(t.brand || THEME_PRESETS[t.preset]?.brand || '#0f766e')}"><button type="button" class="btn btn-ghost btn-sm" id="tm-brand-clear">Pakai preset</button></div></label>
      <label class="field"><span>Warna aksen kustom (opsional)</span><div class="input-group"><input type="color" id="tm-accent" value="${esc(t.accent || THEME_PRESETS[t.preset]?.accent || '#b45309')}"><button type="button" class="btn btn-ghost btn-sm" id="tm-accent-clear">Pakai preset</button></div></label>
    </div></div>

  <div class="panel"><h3>${ic('eye')} Efek Visual</h3><p class="muted small">Glassy & Aurora dioptimalkan agar ringan: efek blur hanya di header, footer, panel samping & dialog; latar beranimasi memakai GPU dan berhenti otomatis bila perangkat meminta “kurangi gerakan”.</p>
    <div class="choices">${opt('efek', Object.entries(EFFECTS), t.efek, (k, v) => `<span class="fx-prev fx-${k}"></span><b>${esc(v.label)}</b><small>${esc(v.desc)}</small>`)}</div></div>

  <div class="panel"><h3>${ic('book')} Model Tampilan</h3>
    <div class="choices models">${opt('model', Object.entries(MODELS), t.model, (k, v) => `<span class="mdl mdl-${k}"><i></i><i></i><i></i></span><b>${esc(v.label.split(' — ')[0])}</b><small>${esc(v.label.split(' — ')[1] || '')}</small>`)}</div></div>

  <div class="panel"><h3>${ic('news')} Model Tampilan Baca</h3><p class="muted small">Tampilan halaman baca <b>Papan Informasi</b>, <b>Berita & Kegiatan Lembaga</b>, dan <b>Kegiatan Rutin</b> — berlaku di desktop, tablet, ponsel & PWA. Tulisan selalu berada di atas kartu pekat agar tetap kontras dengan latar/efek apa pun. <a href="#/informasi" target="_blank" rel="noopener">Buka contoh postingan ↗</a></p>
    <div class="choices models">${opt('baca', Object.entries(READ_MODELS), READ_MODELS[t.baca] ? t.baca : 'kartu', (k, v) => `<span class="rdm rdm-${k}"><i></i><i></i><i></i></span><b>${esc(v.label)}</b><small>${esc(v.desc)}</small>`)}</div></div>

  <div class="panel"><h3>Aa Huruf (Tipografi)</h3>
    <div class="font-choices">${opt('font', Object.entries(FONT_PAIRS), t.font, (k, v) => `<b style="font-family:${v.head}, ${v.font}, sans-serif">Aa 123</b><small style="font-family:${v.font}, sans-serif">${esc(v.label)}</small>`)}</div>
    <h4 class="detail-h">Pustaka Huruf — ${Object.keys(FONT_LIST).length} pilihan (atur huruf judul & teks secara terpisah)</h4>
    <p class="muted small">Huruf dari Google Fonts & Fontshare dimuat hanya bila dipakai. Huruf komersial/sistem (Proxima Nova, Butler, Perpetua, Lucida Bright, Cambria, Helvetica, dll.) memakai huruf yang terpasang di perangkat pengunjung, dan otomatis diganti huruf gratis yang paling mirip bila tidak ada.</p>
    <div class="form-grid">${fontSel('tm-fhead', t.fHead, 'Huruf judul (heading)')}${fontSel('tm-fbody', t.fBody, 'Huruf teks (isi, menu, tombol)')}</div>
    <div class="font-live" id="tm-font-live"><span class="eyebrow">Pratinjau huruf</span><h2>Portal Data & Informasi Gampong</h2><p>Informasi kegiatan, data penduduk, dan layanan gampong dalam satu tempat — 0123456789.</p><button type="button" class="btn btn-primary btn-sm">Tombol contoh</button></div>
    <details class="fieldset"><summary>Lihat semua huruf</summary><div class="font-gallery">${Object.entries(FONT_LIST).map(([k, f]) => `<div class="fg-item"><b style="font-family:${esc(fontStack(k))}">${esc(f.label)}</b><small style="font-family:${esc(fontStack(k))}">Aa Bb 123 — Gampong</small><span><button type="button" class="chip" data-fpick="tm-fhead" data-fv="${k}">Judul</button><button type="button" class="chip" data-fpick="tm-fbody" data-fv="${k}">Teks</button></span></div>`).join('')}</div></details></div>

  <div class="panel" id="tm-fx"><h3>${ic('star')} Animasi Kursor & Ikon</h3>
    <p class="muted small">Kursor animasi hanya aktif di komputer/laptop (mouse). Di HP & tablet otomatis mati. Semua animasi berhenti bila perangkat pengunjung meminta “kurangi gerakan”. Gerakkan mouse di halaman ini untuk pratinjau.</p>
    <h4 class="detail-h">Model kursor</h4>
    <div class="choices">${opt('cursor', Object.entries(CURSORS), fx.cursor, (k, v) => `<span class="cur-prev cur-${k}"><i></i><i></i></span><b>${esc(v.label)}</b><small>${esc(v.desc)}</small>`)}</div>
    <div class="form-grid" style="margin-top:12px">
      <label class="field"><span>Ukuran kursor — <b id="tm-cs-v">${Math.round(fx.size * 100)}%</b></span><input type="range" id="tm-cs" min="0.6" max="1.8" step="0.1" value="${esc(fx.size)}"></label>
      <label class="field"><span>Efek saat klik</span><select id="tm-click">${Object.entries(CLICKS).map(([k, l]) => `<option value="${k}" ${fx.click === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label class="field"><span>Ikon animasi</span><select id="tm-ikon">${Object.entries(ICON_LEVELS).map(([k, l]) => `<option value="${k}" ${fx.ikon === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label class="field"><span>Berlaku di</span><select id="tm-scope"><option value="publik" ${fx.scope !== 'semua' ? 'selected' : ''}>Halaman publik saja (dasbor admin tetap tenang)</option><option value="semua" ${fx.scope === 'semua' ? 'selected' : ''}>Halaman publik + dasbor admin</option></select></label>
      <label class="check"><input type="checkbox" id="tm-mag" ${fx.magnetic ? 'checked' : ''}> Tombol “magnetic” (tertarik ke arah kursor)</label>
      <label class="check"><input type="checkbox" id="tm-hide" ${fx.hideNative ? 'checked' : ''}> Sembunyikan panah kursor asli (kolom isian tetap memakai kursor teks)</label>
    </div>
    <div class="fx-demo"><span class="muted small">Coba arahkan kursor & klik:</span><button type="button" class="btn btn-primary btn-sm">${ic('send')} Kirim</button><button type="button" class="btn btn-ghost btn-sm">${ic('bell')} Notifikasi</button><button type="button" class="btn btn-ghost btn-sm">${ic('refresh')} Muat ulang</button><button type="button" class="btn btn-ghost btn-sm">${ic('download')} Unduh</button><button type="button" class="icon-btn" title="Lokasi">${ic('loc')}</button><button type="button" class="icon-btn" title="Bintang">${ic('star')}</button><input placeholder="Kolom teks…" style="max-width:180px"></div>
  </div>

  <div class="panel-grid two">
    <div class="panel"><h3>Sudut Panel</h3><div class="choices">${opt('radius', Object.entries(RADII), t.radius, (k, v) => `<span class="rd" style="border-radius:${v.v}"></span><small>${esc(v.label)}</small>`)}</div></div>
    <div class="panel"><h3>${ic('moon')} Mode Gelap / Terang (bawaan)</h3>
      <div class="choices">${opt('mode', [['auto', 'Ikuti perangkat'], ['light', 'Terang'], ['dark', 'Gelap']], t.mode, (k, v) => `<b>${k === 'dark' ? '🌙' : k === 'light' ? '☀️' : '🖥️'}</b><small>${esc(v)}</small>`)}</div>
      <label class="check" style="margin-top:10px"><input type="checkbox" id="tm-toggle" ${t.toggle !== false ? 'checked' : ''}> Izinkan pengunjung & admin mengganti mode gelap/terang sendiri (tombol ☾)</label></div>
  </div>

  <div class="panel" data-noguard><h3>${ic('phone')} Ikon Aplikasi (tab browser desktop & mobile, ikon layar utama)</h3>
    <p class="muted small">Unggah gambar (PNG/JPG/SVG, disarankan ≥ 512×512) atau tempel URL gambar. <b>PNG berlatar transparan tetap transparan</b> — tidak diberi latar putih di tab browser desktop, ponsel, tablet, maupun PWA. Ikon diolah menjadi PNG 256×256 + versi ikon aplikasi (PWA/layar utama) yang berlatar warna tema. Perubahan disimpan terpisah dari tema.</p>
    <div class="form-grid">
      <div class="field"><span>Sumber ikon</span><div class="row-gap"><label class="btn btn-ghost btn-sm">${ic('upload')} Unggah gambar<input type="file" accept="image/*" id="ik-file" hidden></label><input id="ik-url" placeholder="atau URL https://…/ikon.png" style="flex:1;min-width:200px"><button type="button" class="btn btn-ghost btn-sm" id="ik-url-go">Pakai URL</button></div></div>
      <div class="field"><span>Bentuk & latar</span><div class="row-gap"><label class="check"><input type="checkbox" id="ik-round" checked> Sudut membulat</label><label class="check"><input type="checkbox" id="ik-bgon"> Latar warna</label><input type="color" id="ik-bg" value="#0f766e"><label class="check"><input type="checkbox" id="ik-pad"> Beri jarak tepi</label><label class="check" title="Bila dicentang, gambar memenuhi kotak dan tepinya terpotong"><input type="checkbox" id="ik-cover"> Isi penuh (potong tepi)</label></div></div>
    </div>
    <div class="icon-prev" id="ik-prev"></div>
    <div class="row-gap" style="margin-top:10px"><button type="button" class="btn btn-ghost" id="ik-reset">Kembalikan ikon bawaan</button><span class="spacer"></span><button type="button" class="btn btn-primary" id="ik-save" disabled>${ic('check')} Simpan ikon</button></div>
  </div>

  <div class="panel"><h3>${ic('image')} Latar Belakang & Tata Letak</h3>
    <p class="muted small">Latar belakang foto/video dari URL diatur di menu <a href="#/admin/latar">Latar Belakang</a> (dapat didelegasikan ke admin berizin). Seret-tempel posisi panel di beranda publik & dasbor.</p>
    <div class="row-gap"><a class="btn btn-ghost btn-sm" href="#/admin/latar">${ic('image')} Atur latar belakang</a><a class="btn btn-ghost btn-sm" href="#/" id="tm-lay-home">Atur beranda publik</a><a class="btn btn-ghost btn-sm" href="#/admin" id="tm-lay-dash">Atur dasbor</a><button class="btn btn-ghost btn-sm" id="tm-lay-reset">Reset semua tata letak</button></div></div>

  <div class="sticky-actions"><button class="btn btn-ghost" id="tm-reset">Kembalikan tema bawaan</button><span class="spacer"></span><button class="btn btn-primary" id="tm-save" data-save>${ic('check')} Simpan Tema</button></div>`;

  let brand = t.brand, accent = t.accent;
  const val = (n) => $(`input[name=${n}]:checked`, main)?.value;
  const read = () => ({ preset: val('preset'), model: val('model'), baca: val('baca') || 'kartu', efek: val('efek'), font: val('font'), fHead: $('#tm-fhead').value, fBody: $('#tm-fbody').value, fx: { cursor: val('cursor') || 'off', size: Number($('#tm-cs').value) || 1, click: $('#tm-click').value, ikon: $('#tm-ikon').value, scope: $('#tm-scope').value, magnetic: $('#tm-mag').checked, hideNative: $('#tm-hide').checked }, radius: val('radius'), mode: val('mode'), toggle: $('#tm-toggle').checked, brand: brand || '', accent: accent || '' });
  const mark = () => $$('.choice', main).forEach((c) => c.classList.toggle('on', !!c.querySelector('input')?.checked));
  // pratinjau di dasbor: animasi diterapkan walau cakupan "publik saja" (agar bisa dicoba di halaman ini)
  const preview = () => { mark(); const r = read(); applyTheme(r); applyFx({ ...r.fx, scope: 'semua' }, 'admin'); const v = $('#tm-cs-v'); if (v) v.textContent = `${Math.round(r.fx.size * 100)}%`; };
  applyFx({ ...fx, scope: 'semua' }, 'admin');
  const setRadio = (n, v) => { const r = $(`input[name=${n}][value="${v}"]`, main); if (r) r.checked = true; };
  // onchange (bukan addEventListener) agar tidak menumpuk saat #admin-main dipakai ulang oleh menu lain
  main.onchange = (e) => {
    if (state.view !== 'form' || !$('#tm-save')) { main.onchange = null; return; }
    if (e.target.closest('[data-noguard]')) return;
    if (e.target.name === 'preset') { brand = ''; accent = ''; const p = THEME_PRESETS[e.target.value]; $('#tm-brand').value = p.brand; $('#tm-accent').value = p.accent; }
    preview();
  };
  $$('[data-style]', main).forEach((b) => b.onclick = () => {
    const sp = STYLE_PRESETS[b.dataset.style].tema;
    Object.entries(sp).forEach(([k, v]) => setRadio(k, v));
    $('#tm-fhead').value = sp.fHead || ''; $('#tm-fbody').value = sp.fBody || '';
    if (sp.fx) { const f = { ...FX_DEFAULT, ...sp.fx }; setRadio('cursor', f.cursor); $('#tm-cs').value = f.size; $('#tm-click').value = f.click; $('#tm-ikon').value = f.ikon; $('#tm-mag').checked = f.magnetic; $('#tm-hide').checked = f.hideNative; }
    brand = ''; accent = ''; const p = THEME_PRESETS[sp.preset]; $('#tm-brand').value = p.brand; $('#tm-accent').value = p.accent;
    guard.dirty = true; preview();
    // pratinjau mode juga untuk Super Admin yang sudah memilih mode sendiri
    try { if (sp.mode !== 'auto') localStorage.setItem('dd:theme', sp.mode); else localStorage.removeItem('dd:theme'); } catch { /* */ }
    applyTheme(read());
    toast(`Gaya “${STYLE_PRESETS[b.dataset.style].label}” diterapkan sebagai pratinjau — klik Simpan Tema`, 'info');
  });
  $$('[data-fpick]', main).forEach((b) => b.onclick = () => { $('#' + b.dataset.fpick).value = b.dataset.fv; guard.dirty = true; preview(); toast(`${FONT_LIST[b.dataset.fv].label} dipakai untuk ${b.dataset.fpick === 'tm-fhead' ? 'judul' : 'teks'} (pratinjau)`, 'info'); });
  $('#tm-cs').oninput = () => preview();
  $('#tm-brand').oninput = (e) => { brand = e.target.value; preview(); };
  $('#tm-accent').oninput = (e) => { accent = e.target.value; preview(); };
  $('#tm-brand-clear').onclick = () => { brand = ''; preview(); };
  $('#tm-accent-clear').onclick = () => { accent = ''; preview(); };
  $('#tm-save').onclick = async () => {
    const tema = read();
    try { await cfgUpdate({ tema }); state.config.tema = tema; guard.dirty = false; logAudit('tampilan', 'tema', `Mengubah tema (${THEME_PRESETS[tema.preset]?.label}, efek ${EFFECTS[tema.efek]?.label}, model ${tema.model}, huruf ${tema.fHead ? FONT_LIST[tema.fHead]?.label : tema.font}${tema.fBody ? ' / ' + FONT_LIST[tema.fBody]?.label : ''})`, { changes: diff(t, tema) }); toast('Tema disimpan', 'success'); }
    catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
  $('#tm-reset').onclick = async () => { if (!await confirmDialog('Kembalikan tema ke bawaan (Teal Gampong, Solid, model Klasik)?', { okText: 'Kembalikan' })) return; await cfgUpdate({ tema: DEFAULT_TEMA }); state.config.tema = DEFAULT_TEMA; guard.dirty = false; logAudit('tampilan', 'tema_reset', 'Mengembalikan tema bawaan'); viewTampilan(main); };
  $('#tm-lay-home').onclick = (e) => { e.preventDefault(); guard.dirty = false; state.layoutEdit = 'public'; location.hash = '#/'; };
  $('#tm-lay-dash').onclick = (e) => { e.preventDefault(); guard.dirty = false; state.layoutEdit = 'dash'; location.hash = '#/admin'; };
  $('#tm-lay-reset').onclick = async () => { if (!await confirmDialog('Kembalikan susunan semua panel (beranda & dasbor) ke bawaan?', { okText: 'Reset' })) return; await cfgUpdate({ layout: {} }); state.config.layout = {}; logAudit('tampilan', 'layout_reset', 'Mengembalikan semua tata letak ke bawaan'); toast('Tata letak dikembalikan', 'success'); };

  // ---- ikon
  let src = null; let rawSrc = null; let maskable = '';
  const prevIcon = (u) => {
    const s = u || ikon.src || 'icons/icon-512.png';
    $('#ik-prev').innerHTML = `<div class="tab-mock"><img src="${esc(s)}" alt=""> <span>${esc(state.config.namaDesa || 'Serenity')} — Portal Data</span></div>
      <figure><img src="${esc(s)}" width="16" height="16" alt=""><figcaption>16 px</figcaption></figure>
      <figure><img src="${esc(s)}" width="32" height="32" alt=""><figcaption>32 px (tab)</figcaption></figure>
      <figure><img src="${esc(s)}" width="60" height="60" alt=""><figcaption>Layar ponsel</figcaption></figure>
      <figure><img src="${esc(s)}" width="96" height="96" alt=""><figcaption>Desktop / PWA</figcaption></figure>
      ${maskable ? `<figure><img class="ik-app" src="${esc(maskable)}" width="60" height="60" alt=""><figcaption>Ikon aplikasi ponsel</figcaption></figure>` : ''}`;
  };
  prevIcon();
  const build = async () => {
    if (!rawSrc) return;
    try {
      src = await makeIconPng(rawSrc, { size: 256, rounded: $('#ik-round').checked, bg: $('#ik-bgon').checked ? $('#ik-bg').value : '', padding: $('#ik-pad').checked ? 28 : 0, fit: $('#ik-cover').checked ? 'cover' : 'contain' });
      // Versi ikon aplikasi (Android/iOS/PWA): sistem operasi tidak menampilkan transparansi pada ikon layar utama
      // (Android memberi lingkaran putih, iOS latar hitam) → diberi latar warna tema/pilihan agar TIDAK putih
      const mBg = $('#ik-bgon').checked ? $('#ik-bg').value : (getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#0f766e');
      maskable = await makeIconPng(rawSrc, { size: 512, rounded: false, bg: mBg, padding: 72, fit: 'contain' });
      if (maskable.length > 190000) maskable = await makeIconPng(rawSrc, { size: 320, rounded: false, bg: mBg, padding: 46, fit: 'contain' });
      if (maskable.length > 190000) maskable = '';
      if (src.length > 190000) { toast('Ikon terlalu besar setelah diolah. Gunakan gambar yang lebih sederhana.', 'error'); src = null; return; }
      prevIcon(src); $('#ik-save').disabled = false;
    } catch (e) { toast(e.message.includes('tainted') ? 'URL gambar tidak mengizinkan diolah (CORS). Unduh gambarnya lalu unggah dari perangkat.' : e.message, 'error'); }
  };
  $('#ik-file').onchange = (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 5e6) return toast('Gambar maksimal 5 MB', 'error'); rawSrc = f; build(); };
  $('#ik-url-go').onclick = () => { const u = $('#ik-url').value.trim(); if (!/^https:\/\//.test(u)) return toast('URL harus diawali https://', 'error'); rawSrc = u; build(); };
  ['ik-round', 'ik-bgon', 'ik-bg', 'ik-pad', 'ik-cover'].forEach((id) => { $(`#${id}`).addEventListener('input', debounce(build, 150)); });
  $('#ik-save').onclick = async () => {
    if (!src) return;
    try { await cfgUpdate({ ikon: { src, ...(maskable ? { maskable } : {}), updatedAt: new Date().toISOString(), updatedBy: state.user.email } }); applyIcon({ src, maskable }); logAudit('tampilan', 'ikon', 'Mengganti ikon aplikasi (tab browser & layar utama)'); toast('Ikon aplikasi disimpan', 'success'); $('#ik-save').disabled = true; }
    catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
  $('#ik-reset').onclick = async () => {
    if (!await confirmDialog('Kembalikan ikon aplikasi ke ikon bawaan Serenity?', { okText: 'Kembalikan' })) return;
    try { await cfgUpdate({ ikon: {} }); applyIcon(null); src = null; rawSrc = null; prevIcon('icons/icon-512.png'); logAudit('tampilan', 'ikon_reset', 'Mengembalikan ikon aplikasi bawaan'); toast('Ikon bawaan dipulihkan', 'success'); }
    catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
}

// ================================================================ Latar Belakang (Super Admin / izin "latar")
export function viewLatar(main) {
  state.view = 'form';
  if (!can('latar')) return deny(main, 'Butuh izin Latar Belakang');
  main.setAttribute('data-guard', '');
  const L = { aktif: false, url: '', jenis: 'auto', overlay: 55, blur: 0, cakupan: 'semua', hemat: true, poster: '', ...(state.config.latar || {}) };
  main.innerHTML = `<div class="callout">${ic('image')}<div><b>Latar Belakang Website</b><p>Pakai foto atau video dari <b>URL</b> (hemat kuota penyimpanan): YouTube, video MP4/WebM, gambar JPG/PNG/WebP, atau Google Drive (gambar dibagikan publik). Hanya Super Admin dan admin yang diberi izin <b>Latar Belakang</b> yang dapat mengubahnya.</p></div></div>
  <div class="panel"><form id="lt-f" class="form-grid">
    <label class="check span-2"><input type="checkbox" name="aktif" ${L.aktif ? 'checked' : ''}> Aktifkan latar belakang foto/video</label>
    <label class="field span-2"><span>URL foto / video *</span><input name="url" value="${esc(L.url)}" placeholder="https://www.youtube.com/watch?v=… atau https://…/latar.jpg"></label>
    <label class="field"><span>Jenis</span><select name="jenis">${[['auto', 'Otomatis (deteksi dari URL)'], ['gambar', 'Foto / gambar'], ['video', 'Video (MP4/WebM)'], ['youtube', 'YouTube']].map(([v, l]) => `<option value="${v}" ${L.jenis === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="field"><span>Tampilkan di</span><select name="cakupan"><option value="semua" ${L.cakupan === 'semua' ? 'selected' : ''}>Semua halaman publik</option><option value="beranda" ${L.cakupan === 'beranda' ? 'selected' : ''}>Beranda saja</option></select></label>
    <label class="field"><span>Kepekatan lapisan warna (agar teks tetap terbaca): <b id="lt-ov-v">${L.overlay}%</b></span><input type="range" name="overlay" min="0" max="95" step="5" value="${esc(L.overlay)}"></label>
    <label class="field"><span>Efek blur: <b id="lt-bl-v">${L.blur}px</b></span><input type="range" name="blur" min="0" max="20" step="1" value="${esc(L.blur)}"></label>
    <label class="field span-2"><span>Gambar cadangan (poster) untuk ponsel / hemat data — opsional</span><input name="poster" value="${esc(L.poster || '')}" placeholder="https://…/poster.jpg"></label>
    <label class="check span-2"><input type="checkbox" name="hemat" ${L.hemat !== false ? 'checked' : ''}> Mode hemat: video diganti gambar diam hanya bila perangkat pengunjung memakai mode Hemat Data; di ponsel kualitas video maksimal 720p (matikan untuk 1080p di semua perangkat)</label>
  </form>
  <h4 class="detail-h">Pratinjau</h4><div class="bg-prev" id="lt-prev"></div>
  <p class="muted small">Catatan: video YouTube sebagai latar memuat pemutar YouTube (±1 MB). Untuk performa terbaik gunakan foto atau video MP4 pendek (≤ 5 MB).</p></div>
  <div class="sticky-actions"><button class="btn btn-ghost" id="lt-off">Matikan latar</button><span class="spacer"></span><button class="btn btn-primary" id="lt-save" data-save>${ic('check')} Simpan latar belakang</button></div>`;
  const f = $('#lt-f');
  const read = () => ({ aktif: f.elements.aktif.checked, url: f.elements.url.value.trim(), jenis: f.elements.jenis.value, cakupan: f.elements.cakupan.value, overlay: Number(f.elements.overlay.value), blur: Number(f.elements.blur.value), poster: f.elements.poster.value.trim(), hemat: f.elements.hemat.checked });
  const prev = () => {
    const d = read(); $('#lt-ov-v').textContent = `${d.overlay}%`; $('#lt-bl-v').textContent = `${d.blur}px`;
    const box = $('#lt-prev');
    if (!/^https:\/\//.test(d.url)) { box.innerHTML = '<div class="bg-card">Tempel URL https:// untuk melihat pratinjau</div>'; return; }
    const kind = d.jenis !== 'auto' ? d.jenis : backgroundKind(d.url);
    const yt = (d.url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/) || [])[1];
    const st = d.blur ? `filter:blur(${d.blur}px);transform:scale(1.06)` : '';
    const media = kind === 'youtube' && yt ? `<img src="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="" style="${st}">` : kind === 'video' ? `<video src="${esc(d.url)}" muted autoplay loop playsinline style="${st}"></video>` : `<img src="${esc(d.url.replace(/https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]{20,}).*/, 'https://lh3.googleusercontent.com/d/$1=w1200'))}" alt="" style="${st}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'bg-card',textContent:'Gambar tidak bisa dimuat — periksa URL / izin berbagi'}))">`;
    box.innerHTML = `${media}<span class="bg-ov" style="opacity:${d.overlay / 100}"></span><div class="bg-card">${esc(state.config.namaDesa ? `${state.config.jenisDesa || 'Gampong'} ${state.config.namaDesa}` : 'Contoh konten')}${kind === 'youtube' ? ' • ▶ YouTube' : ''}</div>`;
  };
  f.addEventListener('input', debounce(prev, 250)); prev();
  const save = async (d) => {
    if (d.aktif && !/^https:\/\//.test(d.url)) return toast('URL harus diawali https://', 'error');
    if (d.poster && !/^https:\/\//.test(d.poster)) return toast('URL poster harus diawali https://', 'error');
    try {
      await cfgUpdate({ latar: { ...d, updatedAt: new Date().toISOString(), updatedBy: state.user.email } });
      state.config.latar = d; guard.dirty = false; applyBackground(null);
      logAudit('latar', d.aktif ? 'ubah' : 'matikan', d.aktif ? `Mengubah latar belakang website (${d.jenis === 'auto' ? backgroundKind(d.url) : d.jenis})` : 'Mematikan latar belakang website', { detail: d.url });
      toast(d.aktif ? 'Latar belakang disimpan — lihat di halaman publik' : 'Latar belakang dimatikan', 'success');
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
  $('#lt-save').onclick = () => save(read());
  $('#lt-off').onclick = async () => { f.elements.aktif.checked = false; await save(read()); };
}
