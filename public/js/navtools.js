// =============================================================
//  Serenity — Alat navigasi dasbor (v2.9.10)
//  1) Pencarian menu & panel di bilah samping (mis. ketik "Tuha Lapan" → langsung ke lembaganya)
//  2) Mode "Lihat Sebagai" (khusus Super Admin): pratinjau dasbor persis seperti yang dilihat admin,
//     pengelola lembaga, atau kepala dusun tertentu. Mode ini HANYA PRATINJAU — semua penyimpanan
//     diblokir di perangkat, sehingga tidak ada data yang berubah atas nama orang lain.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import * as F from './firebase.js';
import { ic, state, can, isSuper, canLembaga, ROLE_LABEL, PERMS, KADUS_PERMS, avatar, emptyBox, loadingBox, logAudit } from './core.js';
import { esc, $, $$, norm, toast, confirmDialog } from './ui.js';
import { badgeRow } from './badges.js';

// ---------------------------------------------------------------- 1) pencarian menu & panel
// Bagian di dalam halaman yang sering dicari → dibuka & digulir langsung ke bagiannya
const SECTIONS = [
  ['warga', 'Scan KK (OCR)', 'ocr scan kartu keluarga foto kamera kk', 'click:#w-kk'],
  ['pengaturan', 'Teks Kartu Beranda', 'deskripsi beranda sambutan hero portal data publik tulisan kartu atas selamat datang'],
  ['pengaturan', 'Profil Gampong', 'nama desa alamat kantor kecamatan logo email whatsapp kantor'],
  ['pengaturan', 'Jadwal Sholat', 'sholat azan imsak koordinat latitude ihtiyat'],
  ['pengaturan', 'Infografis Publik', 'infografis kategori publik privasi'],
  ['pengaturan', 'Running Text', 'teks berjalan pengumuman ticker footer'],
  ['pengaturan', 'Akun Saya', 'foto profil nama password ubah password kata sandi'],
  ['pengaturan', 'Ubah Email Login', 'email login keamanan sesi logout otomatis'],
  ['tampilan', 'Gaya Siap Pakai', 'preset gaya gen z macos'],
  ['tampilan', 'Warna Tema', 'warna brand aksen palet'],
  ['tampilan', 'Efek Visual', 'glass aurora efek'],
  ['tampilan', 'Model Tampilan Baca', 'kartu baca lembar kertas dua kolom postingan'],
  ['tampilan', 'Model Tampilan', 'klasik kartu fokus majalah tata letak'],
  ['tampilan', 'Huruf', 'font tipografi huruf judul'],
  ['tampilan', 'Animasi Kursor', 'kursor animasi ikon cursor'],
  ['tampilan', 'Ikon Aplikasi', 'favicon ikon tab pwa logo aplikasi'],
  ['widget', 'Panel Berita & Kegiatan Lembaga', 'gulir kecepatan berita beranda widget'],
  ['widget', 'Gerak Panel Kegiatan Rutin', 'gulir kegiatan beranda widget'],
  ['widget', 'Widget Analitik Pengunjung', 'pengunjung online analitik'],
  ['audit', 'Riwayat Chat Staf', 'chat pesan percakapan riwayat', 'click:[data-autab="chat"]'],
  ['cadangan', 'Cadangan & Pemulihan', 'backup unduh pulihkan restore'],
  ['latar', 'Latar Belakang', 'video youtube foto latar background'],
];
const navOk = (key, navList) => navList.some((n) => n[0] === key);
export function navIndex({ NAV, navAllowed, KATEGORI, lembagaKat }) {
  const out = []; const seen = new Set();
  const add = (label, href, sub, kw = '', find = '', icon = 'search') => { const k = label + href; if (seen.has(k)) return; seen.add(k); out.push({ label, href, sub, icon, find, key: norm(`${label} ${sub} ${kw}`) }); };
  const navs = NAV.filter(navAllowed);
  navs.forEach(([k, l, i, , g]) => add(l, k === 'dashboard' ? '#/admin' : `#/admin/${k}`, g === 'Utama' ? 'Menu' : `Menu · ${g}`, '', '', i));
  for (const [k, label, kw, find] of SECTIONS) if (navOk(k, navs)) { const n = navs.find((x) => x[0] === k); add(label, `#/admin/${k}`, `Bagian di ${n[1]}`, kw, find || label, n[2]); }
  if (navOk('lembaga', navs)) {
    if (can('lembaga')) {
      KATEGORI.forEach((c) => add(c.short, `#/admin/lembaga/k/${c.key}`, 'Kategori lembaga', `${c.label} ${c.desc}`, '', c.icon || 'shield'));
      add('Berita & Kegiatan Lembaga', '#/admin/lembaga/berita', 'Lembaga Gampong', 'berita kegiatan lembaga', '', 'news');
      add('Kontak Luar (warga luar gampong)', '#/admin/lembaga/luar', 'Lembaga Gampong', 'kontak luar warga luar gampong pengurus anggota dari luar bidan kader instansi', '', 'loc');
    }
    for (const l of state.lembaga) {
      if (!canLembaga(l.id, l.kategori)) continue;
      add(l.nama || l.singkatan, `#/admin/lembaga/e/${l.id}`, `Lembaga · ${lembagaKat(l.kategori)}`, `${l.singkatan || ''} ${l.nama || ''}`, '', 'shield');
    }
  }
  if (navOk('warga', navs)) for (const d of state.dusun) add(`Warga Dusun ${d.nama}`, `#/admin/warga?dusun=${encodeURIComponent(d.nama)}`, 'Data Warga', `dusun ${d.nama} kepala dusun ${d.kepalaNama || ''}`, '', 'map');
  return out;
}
function rank(q, list) {
  const n = norm(q); if (!n) return [];
  const words = n.split(/\s+/).filter(Boolean);
  return list.map((x) => {
    const lab = norm(x.label);
    if (!words.every((w) => x.key.includes(w))) return null;
    const score = (lab === n ? 0 : lab.startsWith(n) ? 1 : lab.includes(n) ? 2 : 3) * 100 + lab.length;
    return { ...x, score };
  }).filter(Boolean).sort((a, b) => a.score - b.score).slice(0, 9);
}
const hl = (label, q) => { const n = norm(q); const i = norm(label).indexOf(n); return i < 0 || !n ? esc(label) : `${esc(label.slice(0, i))}<mark>${esc(label.slice(i, i + q.trim().length))}</mark>${esc(label.slice(i + q.trim().length))}`; };
// Setelah berpindah halaman: gulir ke bagian yang dicari & sorot sebentar
function revealSection(find) {
  if (!find) return;
  let tries = 0;
  const go = () => {
    if (find.startsWith('click:')) { const el = document.querySelector(find.slice(6)); if (el) { el.click(); return; } }
    else {
      const n = norm(find);
      const el = [...document.querySelectorAll('#admin-main :is(h3, h4, summary, .detail-h, .panel b)')].find((e) => norm(e.textContent).includes(n));
      if (el) { const box = el.closest('.panel, details, .callout') || el; box.scrollIntoView({ behavior: 'smooth', block: 'start' }); box.classList.add('ns-flash'); setTimeout(() => box.classList.remove('ns-flash'), 1800); if (el.tagName === 'SUMMARY') el.parentElement.open = true; return; }
    }
    if (++tries < 25) setTimeout(go, 120);
  };
  setTimeout(go, 150);
}
export const navSearchHtml = () => `<div class="nav-search" role="search"><span class="ns-ic">${ic('search')}</span><input id="ns-q" type="search" placeholder="Cari menu atau panel…" aria-label="Cari menu atau panel dasbor" autocomplete="off" spellcheck="false"><kbd title="Tekan / untuk mencari">/</kbd><div class="ns-res" id="ns-res" role="listbox" hidden></div></div>`;
export function bindNavSearch(getIndex) {
  const inp = $('#ns-q'), res = $('#ns-res'); if (!inp || inp._b) return; inp._b = true;
  let items = [], cur = 0;
  const close = () => { res.hidden = true; res.innerHTML = ''; };
  const paint = () => {
    const q = inp.value;
    items = rank(q, getIndex()); cur = 0;
    if (!q.trim()) return close();
    res.hidden = false;
    res.innerHTML = items.length ? items.map((x, i) => `<a href="${esc(x.href)}" class="ns-item${i === cur ? ' on' : ''}" role="option" data-i="${i}">${ic(x.icon)}<span><b>${hl(x.label, q)}</b><small>${esc(x.sub)}</small></span></a>`).join('') : `<p class="ns-empty">Tidak ditemukan “${esc(q)}”.</p>`;
  };
  const choose = (i) => { const x = items[i]; if (!x) return; close(); inp.value = ''; inp.blur(); document.body.classList.remove('nav-open'); if (location.hash === x.href) revealSection(x.find); else { location.hash = x.href; revealSection(x.find); } };
  inp.addEventListener('input', paint);
  inp.addEventListener('focus', () => { if (inp.value) paint(); });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; $$('.ns-item', res).forEach((a, i) => a.classList.toggle('on', i === cur)); $$('.ns-item', res)[cur]?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(cur); }
    else if (e.key === 'Escape') { inp.value = ''; close(); inp.blur(); }
  });
  res.addEventListener('mousedown', (e) => { const a = e.target.closest('.ns-item'); if (a) { e.preventDefault(); choose(Number(a.dataset.i)); } });
  inp.addEventListener('blur', () => setTimeout(close, 150));
  document.addEventListener('keydown', (e) => {
    if (!$('#ns-q')) return;
    if ((e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '') && !document.activeElement?.isContentEditable) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); document.body.classList.add('nav-open'); $('#ns-q').focus(); }
  });
}

// ---------------------------------------------------------------- 2) Lihat Sebagai (khusus Super Admin)
const READ_ONLY_MSG = 'Mode Lihat Sebagai: hanya pratinjau — perubahan tidak disimpan.';
const shortPerms = (u) => {
  if (u.role === 'kadus') return KADUS_PERMS.filter(([k]) => u.perms?.[k]).map((p) => p[1]).join(', ') || 'Belum ada akses';
  const on = PERMS.filter(([k]) => u.perms?.[k]);
  const lg = (u.lembagaIds || []).length;
  return [on.length === PERMS.length ? 'Semua hak akses admin' : on.length ? `${on.length} hak akses` : '', lg ? `pengelola ${lg} lembaga` : ''].filter(Boolean).join(' · ') || 'Belum ada akses';
};
const roleOf = (u) => (u.role === 'kadus' ? `Kepala Dusun${u.dusun ? ' ' + u.dusun : ''}` : (u.lembagaIds || []).length && !Object.values(u.perms || {}).some(Boolean) ? 'Pengelola Lembaga' : ROLE_LABEL[u.role] || u.role);
export function viewViewAs(main, { enter }) {
  state.view = 'viewas';
  if (!isSuper()) { main.innerHTML = `<div class="callout">${ic('lock')}<div><b>Khusus Super Admin</b></div></div>`; return; }
  main.innerHTML = loadingBox();
  Promise.all(['admin', 'kadus'].map((r) => F.getDocs(F.query(F.collection(F.db, 'users'), F.where('role', '==', r))))).then((snaps) => {
    const users = snaps.flatMap((s) => s.docs.map((d) => ({ uid: d.id, ...d.data() }))).filter((u) => u.uid !== state.user.uid)
      .sort((a, b) => (a.role === b.role ? String(a.nama || a.email).localeCompare(String(b.nama || b.email), 'id') : a.role === 'admin' ? -1 : 1));
    let q = '';
    const draw = () => {
      const list = users.filter((u) => !q || norm(`${u.nama} ${u.email} ${roleOf(u)} ${u.jabatan || ''}`).includes(norm(q)));
      $('#va-list').innerHTML = list.length ? list.map((u) => `<div class="va-card${u.active === false ? ' off' : ''}">${avatar(u)}<div class="va-main"><b>${esc(u.nama || u.email)}</b>${badgeRow(u.badges, 4, false)}<small>${esc(roleOf(u))}${u.jabatan ? ` · ${esc(u.jabatan)}` : ''}${u.active === false ? ' · <i>nonaktif</i>' : ''}</small><small class="muted">${esc(shortPerms(u))}</small></div><button class="btn btn-sm btn-primary" data-va="${esc(u.uid)}">${ic('eye')} Lihat sebagai</button></div>`).join('') : emptyBox(users.length ? 'Tidak ada akun yang cocok.' : 'Belum ada akun admin atau kepala dusun.');
      $$('[data-va]', main).forEach((b) => b.onclick = () => enter(users.find((x) => x.uid === b.dataset.va)));
    };
    main.innerHTML = `<div class="callout">${ic('eye')}<div><b>Lihat Sebagai — khusus Super Admin</b><p>Tinjau dasbor persis seperti yang dilihat admin, pengelola lembaga, atau kepala dusun tertentu: menu, data (mis. kepala dusun hanya melihat warga dusunnya), dan tombol yang tersedia sesuai hak aksesnya. Mode ini <b>hanya pratinjau</b> — semua penyimpanan diblokir sehingga tidak ada data yang berubah atas nama orang lain. Mulai & selesainya mode ini tercatat di Audit Log.</p></div></div>
      <div class="toolbar"><div class="search">${ic('search')}<input id="va-q" placeholder="Cari nama, email, atau peran…"></div><span class="muted small">${users.length} akun</span></div>
      <div class="va-list" id="va-list"></div>`;
    $('#va-q').oninput = (e) => { q = e.target.value; draw(); };
    draw();
  }).catch((e) => { main.innerHTML = emptyBox('Gagal memuat daftar akun: ' + (e.message || e)); });
}
export function viewAsBar() {
  const v = state.viewAs; if (!v) return '';
  return `<div class="viewas-bar" id="viewas-bar" role="status">${ic('eye')}<span><b>Melihat sebagai ${esc(v.u.nama || v.u.email)}</b> <small>${esc(roleOf(v.u))} · hanya pratinjau, perubahan tidak disimpan</small></span><button class="btn btn-sm" id="viewas-exit">${ic('x')} Keluar dari mode ini</button></div>`;
}
export const startReadOnly = () => F.setReadOnly(READ_ONLY_MSG);
export const stopReadOnly = () => F.setReadOnly('');
export { confirmDialog, toast, logAudit };
