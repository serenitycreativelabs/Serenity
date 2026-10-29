// Lembaga Gampong (5 kategori) & Dokumen Publik Gampong — halaman publik + panel admin
// Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
import { F, ic, state, C, clean, emptyBox, loadingBox, can, isSuper, logAudit, diff, confirmDelete, penulisNow, penulisLabel, avatar, canLembaga, LEMBAGA_DELEGASI, requirePassword, superEmail, ROLE_LABEL } from './core.js';
import { esc, $, $$, norm, debounce, fmtDate, fmtNum, todayISO, waLink, waNumber, normalizePhone, toast, modal, attachAutocomplete, compressImage, promptDialog, confirmDialog, authErrorMessage } from './ui.js';
import { badgeRow } from './badges.js';
import { slugify } from './fields.js';
import { guard } from './layout.js';
import { richRender, bindRich, plainText, mediaEmbed, mediaThumb, parseMediaLines, mediaLinesText, safeUrl, downloadUrl, mediaKind } from './rich.js';
import { exportExcel, exportPdf } from './exporter.js';
import { readerPage, readMins } from './reader.js';

// ---------------------------------------------------------------- struktur bawaan
export const KATEGORI = [
  { key: 'pemerintahan', label: 'Lembaga Pemerintahan Gampong', short: 'Pemerintahan', icon: 'home', desc: 'Pemerintah Gampong (eksekutif) dan Tuha Peuet Gampong.' },
  { key: 'adat', label: 'Lembaga Adat & Keagamaan Gampong', short: 'Adat & Keagamaan', icon: 'moon', desc: 'BKM, TPA/TPQ, Imeum Gampong, Tuha Lapan, Remaja Masjid.' },
  { key: 'lkg', label: 'Lembaga Kemasyarakatan Gampong (LKG)', short: 'Kemasyarakatan', icon: 'users', desc: 'PKK, Posyandu, Pemuda / Karang Taruna, LPMG, Linmas.' },
  { key: 'ekonomi', label: 'Lembaga Ekonomi Gampong', short: 'Ekonomi', icon: 'chart', desc: 'BUMG dan Koperasi Gampong.' },
  { key: 'pendidikan', label: 'Lembaga Pendidikan Gampong', short: 'Pendidikan', icon: 'book', desc: 'PAUD dan lembaga pendidikan lainnya.' },
];
const JAB_UMUM = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Koordinator', 'Anggota'];
const SEED = [
  { kategori: 'pemerintahan', nama: 'Pemerintah Gampong (Eksekutif)', singkatan: 'Pemerintah Gampong', jenis: 'umum',
    bagianList: ['Keuchik', 'Sekretariat Gampong', 'Pelaksana Teknis (Kasi)', 'Kepala Dusun (Ulee Jurong)'],
    jabatanList: ['Keuchik', 'Sekretaris Gampong', 'Kaur Umum dan Perencanaan', 'Kaur Keuangan', 'Kasi Pemerintahan', 'Kasi Kesejahteraan', 'Kasi Pelayanan', 'Kepala Dusun', 'Operator Gampong'] },
  { kategori: 'pemerintahan', nama: 'Tuha Peuet Gampong', singkatan: 'TPG', jenis: 'umum', bagianList: ['Pimpinan', 'Anggota'], jabatanList: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Anggota'] },
  { kategori: 'adat', nama: 'Badan Kemakmuran Masjid', singkatan: 'BKM', jenis: 'umum', jabatanList: [...JAB_UMUM, 'Imam', 'Bilal', 'Khatib'] },
  { kategori: 'adat', nama: 'Taman Pendidikan Al-Quran', singkatan: 'TPA/TPQ', jenis: 'keagamaan', jabatanList: ['Kepala TPA/TPQ', 'Ustadz', 'Ustadzah', 'Sekretaris', 'Bendahara'] },
  { kategori: 'adat', nama: 'Imeum Gampong', singkatan: 'Imeum', jenis: 'umum', jabatanList: ['Imeum Gampong', 'Imam Meunasah', 'Bilal', 'Khatib'] },
  { kategori: 'adat', nama: 'Tuha Lapan', singkatan: 'Tuha Lapan', jenis: 'umum', jabatanList: ['Ketua', 'Anggota'] },
  { kategori: 'adat', nama: 'Remaja Masjid', singkatan: 'Remaja Masjid', jenis: 'umum', jabatanList: JAB_UMUM },
  { kategori: 'lkg', nama: 'Pemberdayaan dan Kesejahteraan Keluarga', singkatan: 'PKK', jenis: 'umum', jabatanList: ['Ketua TP-PKK', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Ketua Pokja I', 'Ketua Pokja II', 'Ketua Pokja III', 'Ketua Pokja IV', 'Anggota'] },
  { kategori: 'lkg', nama: 'Pos Pelayanan Terpadu', singkatan: 'Posyandu', jenis: 'umum', jabatanList: ['Ketua', 'Sekretaris', 'Bendahara', 'Kader Posyandu', 'Bidan Desa'] },
  { kategori: 'lkg', nama: 'Pemuda Gampong / Karang Taruna', singkatan: 'Karang Taruna', jenis: 'umum', jabatanList: JAB_UMUM },
  { kategori: 'lkg', nama: 'Lembaga Pemberdayaan Masyarakat Gampong', singkatan: 'LPMG / LPMD', jenis: 'umum', jabatanList: JAB_UMUM },
  { kategori: 'lkg', nama: 'Perlindungan Masyarakat', singkatan: 'Linmas', jenis: 'umum', since: '2.3.0',
    bagianList: ['Pimpinan Satuan', 'Regu I', 'Regu II', 'Regu III', 'Anggota'],
    jabatanList: ['Kepala Satuan Linmas (Kasatlinmas)', 'Wakil Kepala Satuan', 'Komandan Regu (Danru)', 'Wakil Komandan Regu', 'Sekretaris', 'Anggota Linmas'] },
  { kategori: 'ekonomi', nama: 'Badan Usaha Milik Gampong', singkatan: 'BUMG', jenis: 'umum', jabatanList: ['Penasihat', 'Direktur', 'Sekretaris', 'Bendahara', 'Kepala Unit Usaha', 'Pengawas'] },
  { kategori: 'ekonomi', nama: 'Koperasi Gampong', singkatan: 'Koperasi', jenis: 'umum', jabatanList: ['Ketua', 'Sekretaris', 'Bendahara', 'Pengawas', 'Manajer', 'Anggota'] },
  { kategori: 'pendidikan', nama: 'Pendidikan Anak Usia Dini', singkatan: 'PAUD', jenis: 'pendidikan', jabatanList: ['Kepala PAUD', 'Guru', 'Pendidik', 'Tenaga Kependidikan', 'Ketua Komite'] },
];
export const JENIS_LABEL = { umum: 'Lembaga umum', pendidikan: 'Pendidikan umum (murid)', keagamaan: 'Pendidikan keagamaan (santri)' };
const pesertaLabel = (l) => (l.jenis === 'keagamaan' ? 'Santri' : l.jenis === 'pendidikan' ? 'Murid' : '');
const pesertaJk = (l, jk) => (l.jenis === 'keagamaan' ? (jk === 'P' ? 'Santriwati' : 'Santriwan') : jk === 'P' ? 'Perempuan' : 'Laki-laki');
const katOf = (k) => KATEGORI.find((x) => x.key === k) || KATEGORI[0];
export const lembagaOf = (k) => state.lembaga.filter((l) => l.kategori === k).sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.nama).localeCompare(String(b.nama)));

// ---------------------------------------------------------------- PUBLIK
function logoOf(l, cls = '') { return l.logo ? `<span class="lg-logo ${cls}"><img src="${esc(l.logo)}" alt=""></span>` : `<span class="lg-logo ${cls}">${ic(katOf(l.kategori).icon)}</span>`; }
function lembagaCard(l, admin = false) {
  const p = l.pesertaCount || {};
  return `<a class="lg-card" href="${admin ? `#/admin/lembaga/e/${l.id}` : `#/lembaga/${l.id}`}">
    ${logoOf(l)}<div class="lg-body"><b>${esc(l.singkatan || l.nama)}</b><small>${esc(l.singkatan ? l.nama : JENIS_LABEL[l.jenis] || '')}</small>
    <div class="lg-meta">${l.pengurus?.length ? `<span>${ic('users')} ${l.pengurus.length} pengurus</span>` : ''}${l.anggotaCount ? `<span>${fmtNum(l.anggotaCount)} anggota</span>` : ''}${p.total ? `<span>${fmtNum(p.total)} ${pesertaLabel(l).toLowerCase()}</span>` : ''}${l.berita?.length ? `<span>${l.berita.length} berita</span>` : ''}${admin && l.published === false ? '<span class="badge badge-muted">Disembunyikan</span>' : ''}</div></div>${ic('chev', 'lg-go')}</a>`;
}
export function renderLembagaPublic(parts) {
  const list = state.lembaga.filter((l) => l.published !== false);
  if (parts[1] === 'k') {
    const k = katOf(parts[2]); const ls = lembagaOf(k.key).filter((l) => l.published !== false);
    return `<section class="section"><a class="link" href="#/lembaga">← Semua lembaga</a><span class="eyebrow">${ic(k.icon)} Kelembagaan</span><h1>${esc(k.label)}</h1><p class="muted">${esc(k.desc)}</p>
      ${katChips(k.key)}${ls.length ? `<div class="lg-grid">${ls.map((l) => lembagaCard(l)).join('')}</div>` : emptyBox('Belum ada lembaga di kategori ini.')}</section>`;
  }
  if (parts[1] && parts[2] === 'berita' && parts[3]) return beritaDetail(parts[1], parts[3]);
  if (parts[1]) return lembagaDetail(parts[1]);
  return `<section class="section"><span class="eyebrow">${ic('shield')} Kelembagaan Gampong</span><h1>Lembaga Gampong</h1>
    <p class="muted">Struktur kepengurusan, kegiatan, dan dokumen setiap lembaga di gampong.</p>
    ${KATEGORI.map((k) => { const ls = lembagaOf(k.key).filter((l) => l.published !== false); return `<div class="lg-cat"><div class="section-head"><h2>${ic(k.icon)} ${esc(k.label)}</h2><a class="link" href="#/lembaga/k/${k.key}">Lihat →</a></div>${ls.length ? `<div class="lg-grid">${ls.map((l) => lembagaCard(l)).join('')}</div>` : `<p class="muted small">${esc(k.desc)}</p>`}</div>`; }).join('')}
    ${list.length ? '' : emptyBox('Data lembaga belum diisi oleh admin.')}</section>`;
}
const katChips = (cur) => `<div class="chips">${KATEGORI.map((k) => `<a class="chip ${k.key === cur ? 'active' : ''}" href="#/lembaga/k/${k.key}">${esc(k.short)}</a>`).join('')}<a class="chip" href="#/dokumen">Dokumen Publik</a></div>`;
function groupPengurus(l) {
  const order = l.bagianList || [];
  const groups = [...new Set([...order, ...(l.pengurus || []).map((p) => p.bagian || 'Pengurus')])].filter((g) => (l.pengurus || []).some((p) => (p.bagian || 'Pengurus') === g));
  return groups.map((g) => [g, (l.pengurus || []).filter((p) => (p.bagian || 'Pengurus') === g)]);
}
function lembagaDetail(id) {
  const l = state.lembaga.find((x) => x.id === id && x.published !== false);
  if (!l) return `<section class="section">${emptyBox('Lembaga tidak ditemukan.')}</section>`;
  const k = katOf(l.kategori); const pc = l.pesertaCount || {};
  const tabs = [['profil', 'Profil'], ['struktur', 'Struktur'], ...(l.berita?.length ? [['berita', 'Berita']] : []), ...(l.media?.length ? [['galeri', 'Galeri & Video']] : []), ...(l.dokumen?.length ? [['dokumen', 'Dokumen']] : [])];
  const berita = [...(l.berita || [])].sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
  return `<section class="section lg-detail">
    <a class="link" href="#/lembaga/k/${k.key}">← ${esc(k.label)}</a>
    <div class="lg-hero">${logoOf(l, 'xl')}<div><span class="eyebrow">${esc(k.short)}</span><h1>${esc(l.nama)}</h1>${l.singkatan ? `<p class="muted">${esc(l.singkatan)}</p>` : ''}
      <div class="lg-stats">${l.pengurus?.length ? `<span><b>${l.pengurus.length}</b> pengurus</span>` : ''}${l.anggotaCount ? `<span><b>${fmtNum(l.anggotaCount)}</b> anggota</span>` : ''}${pc.total ? `<span><b>${fmtNum(pc.total)}</b> ${pesertaLabel(l).toLowerCase()} (${fmtNum(pc.l || 0)} ${pesertaJk(l, 'L').toLowerCase()}, ${fmtNum(pc.p || 0)} ${pesertaJk(l, 'P').toLowerCase()})</span>` : ''}</div>
      <div class="row-gap">${waNumber(l.kontak) ? `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${esc(waLink(l.kontak))}">${ic('wa')} Hubungi</a>` : ''}${l.alamat ? `<span class="muted small">${ic('loc')} ${esc(l.alamat)}</span>` : ''}</div></div></div>
    <nav class="tabbar">${tabs.map(([t, n]) => `<a href="#lg-${t}" data-scroll="lg-${t}">${n}</a>`).join('')}</nav>
    <div id="lg-profil" class="panel">${l.deskripsi ? `<div class="article-body rich">${richRender(l.deskripsi)}</div>` : '<p class="muted">Profil belum diisi.</p>'}
      ${l.visi ? `<div class="visi"><small>VISI</small><p>${esc(l.visi)}</p></div>` : ''}${l.dasarHukum ? `<p class="small muted">Dasar hukum: ${esc(l.dasarHukum)}</p>` : ''}</div>
    <div id="lg-struktur" class="panel"><h3>${ic('users')} Struktur Kepengurusan${l.periode ? ` <small class="muted">· Periode ${esc(l.periode)}</small>` : ''}</h3>
      ${(l.pengurus || []).length ? groupPengurus(l).map(([g, ps]) => `<h4 class="detail-h">${esc(g)}</h4><div class="people">${ps.map((p) => `<div class="person">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : `<span class="avatar lg">${esc((p.nama || '?').slice(0, 1))}</span>`}<b>${esc(p.nama)}</b><small>${esc(p.jabatan || '')}</small>${waNumber(p.hp) ? `<a class="wa-link small" target="_blank" rel="noopener" href="${esc(waLink(p.hp))}">${ic('wa')} Hubungi</a>` : ''}</div>`).join('')}</div>`).join('') : '<p class="muted">Belum ada data pengurus.</p>'}</div>
    ${berita.length ? `<div id="lg-berita" class="panel"><h3>${ic('mega')} Berita & Kegiatan</h3><div class="cards lg-news-cards">${berita.map((b) => beritaCard(l, b)).join('')}</div></div>` : ''}
    ${l.media?.length ? `<div id="lg-galeri" class="panel"><h3>${ic('ig')} Galeri & Video</h3><div class="media-grid">${l.media.map(mediaEmbed).join('')}</div></div>` : ''}
    ${l.dokumen?.length ? `<div id="lg-dokumen" class="panel"><h3>${ic('file')} Dokumen</h3>${docTable(l.dokumen)}</div>` : ''}
  </section>`;
}
// ---- Berita lembaga: kartu & halaman baca (tata baca sama dengan Papan Informasi)
const beritaId = (b, i) => b.id || `b${i}`;
const beritaThumb = (b) => (b.media || []).map((m) => mediaThumb(m.url)).find(Boolean) || '';
function beritaCard(l, b) {
  const id = beritaId(b, (l.berita || []).indexOf(b)); const th = beritaThumb(b); const txt = plainText(b.isi || '').replace(/\s+/g, ' ').trim();
  return `<article class="info-card">${th ? `<a href="#/lembaga/${esc(l.id)}/berita/${esc(id)}" class="info-img"><img loading="lazy" src="${esc(th)}" alt="" onerror="this.closest('.info-img')?.remove()">${(b.media || []).some((m) => /youtu|tiktok|instagram|facebook|fb\.watch|vimeo|\.mp4/i.test(m.url)) ? '<span class="play">▶</span>' : ''}</a>` : ''}
    <div class="info-body"><div class="info-meta"><span class="badge">${esc(l.singkatan || l.nama)}</span></div><h3><a href="#/lembaga/${esc(l.id)}/berita/${esc(id)}">${esc(b.judul)}</a></h3><p class="muted small">${esc(fmtDate(b.tanggal))}</p><p class="excerpt">${esc(txt.slice(0, 150))}${txt.length > 150 ? '…' : ''}</p>
    <div class="info-actions"><a class="btn btn-sm btn-ghost" href="#/lembaga/${esc(l.id)}/berita/${esc(id)}">Baca</a></div></div></article>`;
}
function beritaDetail(lid, bid) {
  const l = state.lembaga.find((x) => x.id === lid && x.published !== false);
  const list = l?.berita || []; const b = list.find((x, i) => beritaId(x, i) === bid);
  if (!l || !b) return `<section class="section reader">${emptyBox('Berita tidak ditemukan.')}</section>`;
  const url = `${location.origin}${location.pathname}#/lembaga/${l.id}/berita/${bid}`;
  const msg = `*${String(l.singkatan || l.nama).toUpperCase()}*\n\n*${b.judul}*\n${b.tanggal ? '📅 ' + fmtDate(b.tanggal) + '\n' : ''}\n${plainText(b.isi || '').slice(0, 600)}\n\nSelengkapnya: ${url}`;
  const share = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  const others = list.map((x, i) => ({ x, id: beritaId(x, i) })).filter((o) => o.x !== b).sort((a, c) => String(c.x.tanggal || '').localeCompare(String(a.x.tanggal || ''))).slice(0, 4);
  return readerPage({
    back: { href: `#/lembaga/${l.id}`, label: l.singkatan || l.nama },
    badges: `<span class="badge">${esc(katOf(l.kategori).short)}</span><span class="badge badge-muted">${esc(l.singkatan || l.nama)}</span>`,
    title: b.judul, date: fmtDate(b.tanggal), mins: readMins(plainText(b.isi || '')),
    byline: b.penulis ? `<div class="byline">${avatar(b.penulis, 'sm')}<span>Diterbitkan oleh <b>${esc(penulisLabel(b.penulis))}</b>${badgeRow(b.penulis.badges, 6)}</span></div>` : '',
    author: b.penulis ? penulisLabel(b.penulis) : (l.singkatan || l.nama), cover: b.gambar || '',
    body: b.isi ? `<div class="article-body rich">${richRender(b.isi)}</div>` : '',
    media: (b.media || []).length ? b.media.map(mediaEmbed).join('') : '',
    actions: `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(share)}">${ic('wa')} Bagikan ke WhatsApp</a><button class="btn btn-ghost" data-copy-link="${esc(url)}">${ic('copy')} Salin tautan</button><a class="btn btn-ghost" href="#/lembaga/${esc(l.id)}">${ic('shield')} Profil lembaga</a>`,
    share: { href: share, label: 'Bagikan ke WhatsApp' },
    othersTitle: `Berita lain dari ${l.singkatan || l.nama}`, others: others.map((o) => ({ href: `#/lembaga/${l.id}/berita/${o.id}`, title: o.x.judul, sub: fmtDate(o.x.tanggal) })),
  });
}
const docTable = (docs) => `<div class="table-wrap"><table class="table"><thead><tr><th>Dokumen</th><th>Jenis</th><th>Tahun</th><th class="actions-col">Berkas</th></tr></thead><tbody>${docs.map((d) => `<tr><td><b>${esc(d.judul)}</b></td><td>${esc(d.jenis || '-')}</td><td>${esc(d.tahun || '-')}</td><td class="actions-col">${safeUrl(d.url) ? `<a class="btn btn-sm btn-ghost" href="${esc(safeUrl(d.url))}" target="_blank" rel="noopener">${ic('eye')} Lihat</a> <a class="btn btn-sm btn-primary" href="${esc(downloadUrl(d.url))}" target="_blank" rel="noopener">${ic('download')} Unduh</a>` : '-'}</td></tr>`).join('')}</tbody></table></div>`;
export function bindLembagaPublic() {
  $$('[data-scroll]').forEach((a) => a.onclick = (e) => { e.preventDefault(); document.getElementById(a.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}

// ---------------------------------------------------------------- PUBLIK: Dokumen Publik
export const JENIS_DOKUMEN = ['RPJMG', 'RKPG', 'RAPBG', 'APBG', 'Laporan Realisasi APBG', 'LPJ', 'Reusam Gampong', 'Qanun / Aturan Gampong', 'Peraturan Keuchik', 'Keputusan Keuchik', 'Profil Gampong', 'Laporan Kegiatan', 'Formulir Layanan', 'Lainnya'];
const docState = { q: '', jenis: '', tahun: '' };
export function renderDokumenPublic() {
  const docs = state.dokumen.filter((d) => d.published !== false);
  const jenisList = [...new Set(docs.map((d) => d.jenis).filter(Boolean))];
  const tahunList = [...new Set(docs.map((d) => d.tahun).filter(Boolean))].sort().reverse();
  return `<section class="section"><span class="eyebrow">${ic('file')} Keterbukaan Informasi Publik</span><h1>Dokumen Publik Gampong</h1>
    <p class="muted">RPJMG, RAPBG, APBG, Reusam, aturan & peraturan gampong yang dapat dilihat dan diunduh warga.</p>
    <div class="toolbar"><div class="search">${ic('search')}<input id="dp-q" placeholder="Cari judul, nomor, atau isi dokumen…" value="${esc(docState.q)}"></div>
      <select id="dp-jenis"><option value="">Semua jenis</option>${jenisList.map((j) => `<option ${docState.jenis === j ? 'selected' : ''}>${esc(j)}</option>`).join('')}</select>
      <select id="dp-tahun"><option value="">Semua tahun</option>${tahunList.map((t) => `<option ${docState.tahun === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
    <div class="chips" id="dp-chips"><button class="chip ${!docState.jenis ? 'active' : ''}" data-j="">Semua</button>${jenisList.map((j) => `<button class="chip ${docState.jenis === j ? 'active' : ''}" data-j="${esc(j)}">${esc(j)} <small>${docs.filter((d) => d.jenis === j).length}</small></button>`).join('')}</div>
    <div id="dp-list"></div></section>`;
}
function filteredDocs() {
  const q = norm(docState.q);
  return state.dokumen.filter((d) => d.published !== false)
    .filter((d) => (!docState.jenis || d.jenis === docState.jenis) && (!docState.tahun || String(d.tahun) === docState.tahun))
    .filter((d) => !q || norm([d.judul, d.nomor, d.jenis, d.tahun, plainText(d.deskripsi)].join(' ')).includes(q))
    .sort((a, b) => String(b.tahun || '').localeCompare(String(a.tahun || '')) || String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
}
export function bindDokumenPublic() {
  const box = $('#dp-list'); if (!box) return;
  const draw = () => {
    const list = filteredDocs();
    box.innerHTML = list.length ? `<p class="muted small">${list.length} dokumen</p><div class="doc-grid">${list.map((d) => `<article class="doc-card"><div class="doc-ic">${ic('file')}<small>${esc((d.format || guessFormat(d.url)).toUpperCase())}</small></div><div class="doc-body"><div class="info-meta"><span class="badge">${esc(d.jenis || 'Dokumen')}</span>${d.tahun ? `<span class="badge badge-muted">${esc(d.tahun)}</span>` : ''}</div><h4>${esc(d.judul)}</h4>${d.nomor ? `<p class="muted small">Nomor: ${esc(d.nomor)}</p>` : ''}${d.deskripsi ? `<div class="small rich muted">${richRender(d.deskripsi)}</div>` : ''}${d.tanggal ? `<p class="muted small">${esc(fmtDate(d.tanggal))}</p>` : ''}
      <div class="row-gap">${safeUrl(d.url) ? `<a class="btn btn-sm btn-ghost" target="_blank" rel="noopener" href="${esc(safeUrl(d.url))}">${ic('eye')} Lihat</a><a class="btn btn-sm btn-primary" target="_blank" rel="noopener" href="${esc(downloadUrl(d.url))}">${ic('download')} Unduh</a>` : '<span class="muted small">Berkas belum tersedia</span>'}</div></div></article>`).join('')}</div>` : emptyBox('Tidak ada dokumen yang cocok.');
  };
  $('#dp-q').oninput = debounce((e) => { docState.q = e.target.value; draw(); }, 200);
  $('#dp-jenis').onchange = (e) => { docState.jenis = e.target.value; $$('#dp-chips .chip').forEach((c) => c.classList.toggle('active', c.dataset.j === docState.jenis)); draw(); };
  $('#dp-tahun').onchange = (e) => { docState.tahun = e.target.value; draw(); };
  $$('#dp-chips [data-j]').forEach((c) => c.onclick = () => { docState.jenis = c.dataset.j; $('#dp-jenis').value = c.dataset.j; $$('#dp-chips .chip').forEach((x) => x.classList.toggle('active', x === c)); draw(); });
  draw();
}
const guessFormat = (u) => { const m = String(u || '').match(/\.(pdf|docx?|xlsx?|pptx?|zip|jpg|png)(\?|$)/i); return m ? m[1] : /drive\.google/.test(u) ? 'drive' : 'link'; };

// ================================================================ ADMIN: Lembaga
const seedId = (s) => slugify(s.singkatan || s.nama);
const seedDoc = (s, i) => { const { since, ...d } = s; void since; return { ...d, urutan: i + 1, published: true, pengurus: [], media: [], berita: [], dokumen: [], createdAt: F.serverTimestamp(), updatedBy: state.user.email }; };
export async function seedLembaga() {
  const b = F.writeBatch(F.db); SEED.forEach((s, i) => b.set(C(`lembaga/${seedId(s)}`), seedDoc(s, i), { merge: true })); await b.commit();
  logAudit('lembaga', 'struktur_bawaan', `Memasang struktur bawaan ${SEED.length} lembaga gampong`, { count: SEED.length });
}
// Lembaga bawaan baru (mis. Linmas di v2.3.0) yang belum ada pada data lama
const dismissedSeeds = () => { try { return JSON.parse(localStorage.getItem('dd:seedSkip') || '[]'); } catch { return []; } };
export const missingSeeds = () => (state.lembaga.length ? SEED.filter((s) => s.since && !state.lembaga.some((l) => l.id === seedId(s) || norm(l.singkatan) === norm(s.singkatan)) && !dismissedSeeds().includes(seedId(s))) : []);
async function addSeeds(list) {
  const b = F.writeBatch(F.db); list.forEach((s) => b.set(C(`lembaga/${seedId(s)}`), { ...seedDoc(s, SEED.indexOf(s)), urutan: lembagaOf(s.kategori).length + 1 }, { merge: true })); await b.commit();
  logAudit('lembaga', 'tambah_bawaan', `Menambahkan lembaga bawaan baru: ${list.map((s) => s.singkatan).join(', ')}`, { count: list.length });
}
export function viewLembagaAdmin(main, r) {
  state.view = 'lembaga';
  const p2 = r.parts[2];
  if (p2 === 'e') return lembagaEditor(main, r.parts[3], r.query.get('tab'));
  if (p2 === 'berita') { editorState = null; return viewBeritaAdmin(main, r.query.get('k') || ''); }
  editorState = null;
  const kat = p2 === 'k' ? katOf(r.parts[3]) : null;
  if (!state.lembagaReady) { main.innerHTML = loadingBox(); return; }
  if (kat) $('#page-title').textContent = kat.label;
  const full = can('lembaga');
  // Pengelola (admin yang diangkat Super Admin) hanya melihat lembaga yang dikelolanya
  if (!full) {
    const mine = state.lembaga.filter((l) => canLembaga(l.id, l.kategori));
    main.innerHTML = `<div class="callout">${ic('shield')}<div><b>Lembaga yang Anda kelola</b><p>Anda diangkat Super Admin sebagai pengelola lembaga berikut. Anda dapat mengubah profil, pengurus, anggota, berita, galeri, dan dokumen lembaga ini.</p></div></div>
      <div class="lg-grid">${mine.map((l) => lembagaCard(l, true)).join('') || emptyBox('Belum ada lembaga yang ditugaskan kepada Anda.')}</div>
      ${mine.length ? '<div class="panel" id="kat-berita"></div>' : ''}`;
    if (mine.length) beritaPanel($('#kat-berita'), '', { compact: true });
    return;
  }
  const cats = kat ? [kat] : KATEGORI;
  const miss = missingSeeds();
  main.innerHTML = `
  ${!state.lembaga.length ? `<div class="callout">${ic('shield')}<div><b>Mulai dengan struktur bawaan</b><p>Pasang ${SEED.length} lembaga sesuai struktur gampong di Aceh: Pemerintah Gampong, TPG, BKM, TPA/TPQ, Imeum, Tuha Lapan, Remaja Masjid, PKK, Posyandu, Karang Taruna, LPMG, Linmas, BUMG, Koperasi, dan PAUD.</p></div><button class="btn btn-primary" id="lg-seed">${ic('plus')} Pasang struktur bawaan</button></div>` : ''}
  ${miss.length ? `<div class="callout">${ic('plus')}<div><b>Lembaga bawaan baru tersedia</b><p>${miss.map((s) => `<b>${esc(s.singkatan)}</b> (${esc(s.nama)}) — ${esc(katOf(s.kategori).short)}`).join(', ')}.</p></div><button class="btn btn-primary btn-sm" id="lg-miss">${ic('plus')} Tambahkan</button><button class="btn btn-ghost btn-sm" id="lg-miss-skip">Abaikan</button></div>` : ''}
  <div class="toolbar toolbar-actions"><button class="btn btn-primary" id="lg-new">${ic('plus')} Tambah Lembaga</button><a class="btn btn-ghost" href="#/lembaga" target="_blank">${ic('ext')} Lihat halaman publik</a>${kat ? '<a class="btn btn-ghost" href="#/admin/lembaga">Semua kategori</a>' : ''}</div>
  ${cats.map((k) => `<div class="lg-cat"><div class="section-head"><h2>${ic(k.icon)} ${esc(k.label)}</h2>${kat ? '' : `<a class="link" href="#/admin/lembaga/k/${k.key}">Buka →</a>`}</div><div class="lg-grid">${lembagaOf(k.key).map((l) => lembagaCard(l, true)).join('') || `<p class="muted small">${esc(k.desc)} Belum ada lembaga.</p>`}</div></div>`).join('')}
  ${kat ? `<div class="panel" id="kat-berita"></div>` : ''}`;
  if (kat) beritaPanel($('#kat-berita'), kat.key, { compact: true });
  $('#lg-seed')?.addEventListener('click', async (e) => { e.currentTarget.disabled = true; try { await seedLembaga(); toast('Struktur lembaga bawaan terpasang', 'success'); } catch (err) { toast(err.message, 'error'); } });
  $('#lg-miss')?.addEventListener('click', async (e) => { e.currentTarget.disabled = true; try { await addSeeds(miss); toast(`${miss.map((s) => s.singkatan).join(', ')} ditambahkan`, 'success'); } catch (err) { toast(err.message, 'error'); e.currentTarget.disabled = false; } });
  $('#lg-miss-skip')?.addEventListener('click', () => { try { localStorage.setItem('dd:seedSkip', JSON.stringify([...dismissedSeeds(), ...miss.map(seedId)])); } catch { /* */ } viewLembagaAdmin(main, r); });
  $('#lg-new').onclick = () => newLembagaDialog(kat?.key);
}
function newLembagaDialog(kat) {
  const m = modal({ title: 'Tambah Lembaga', body: `<form id="nl-f" class="form-grid">
    <label class="field"><span>Kategori *</span><select name="kategori">${KATEGORI.map((k) => `<option value="${k.key}" ${k.key === kat ? 'selected' : ''}>${esc(k.label)}</option>`).join('')}</select></label>
    <label class="field"><span>Jenis</span><select name="jenis">${Object.entries(JENIS_LABEL).map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></label>
    <label class="field span-2"><span>Nama lembaga *</span><input name="nama" required placeholder="mis. Majelis Taklim Al-Ikhlas"></label>
    <label class="field span-2"><span>Singkatan</span><input name="singkatan" placeholder="mis. MT Al-Ikhlas"></label></form>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="nl-ok">Buat</button>' });
  $('#nl-ok', m.el).onclick = async () => {
    const f = $('#nl-f', m.el); const nama = f.elements.nama.value.trim(); if (!nama) return toast('Nama wajib diisi', 'error');
    const data = { kategori: f.elements.kategori.value, jenis: f.elements.jenis.value, nama, singkatan: f.elements.singkatan.value.trim(), urutan: lembagaOf(f.elements.kategori.value).length + 1, published: true, pengurus: [], media: [], berita: [], dokumen: [], createdAt: F.serverTimestamp(), updatedBy: state.user.email };
    const ref = await F.addDoc(F.collection(F.db, 'lembaga'), data);
    logAudit('lembaga', 'tambah', `Menambah lembaga ${nama}`, { targetId: ref.id });
    m.close(); location.hash = `#/admin/lembaga/e/${ref.id}`;
  };
}

// ================================================================ ADMIN: Berita & Kegiatan semua lembaga
// Kelola berita setiap lembaga dari satu tempat (per kategori atau semua). Pengelola hanya melihat lembaganya.
const beritaAdm = { q: '', lid: '' };
function editableLembaga(katKey = '') { return state.lembaga.filter((l) => (!katKey || l.kategori === katKey) && canLembaga(l.id, l.kategori)).sort((a, b) => String(a.kategori).localeCompare(String(b.kategori)) || (a.urutan || 0) - (b.urutan || 0)); }
function viewBeritaAdmin(main, katKey) {
  state.view = 'lembaga';
  if (!state.lembagaReady) { main.innerHTML = loadingBox(); return; }
  const k = KATEGORI.find((x) => x.key === katKey);
  $('#page-title').textContent = k ? `Berita & Kegiatan — ${k.short}` : 'Berita & Kegiatan Lembaga';
  main.innerHTML = `<div class="callout small-callout">${ic('mega')}<div><p class="small">Kelola berita & kegiatan seluruh lembaga dari satu halaman. Berita tampil di halaman lembaga, di panel <b>Berita & Kegiatan Lembaga</b> pada beranda, dan memiliki halaman baca sendiri yang bisa dibagikan.</p></div></div>
    <div class="chips"><a class="chip ${!katKey ? 'active' : ''}" href="#/admin/lembaga/berita">Semua kategori</a>${KATEGORI.map((x) => `<a class="chip ${x.key === katKey ? 'active' : ''}" href="#/admin/lembaga/berita?k=${x.key}">${esc(x.short)}</a>`).join('')}</div>
    <div class="panel" id="bn-all"></div>`;
  beritaPanel($('#bn-all'), katKey, { compact: false });
}
function beritaPanel(box, katKey, { compact }) {
  if (!box) return;
  const ls = editableLembaga(katKey);
  const draw = () => {
    const q = norm(beritaAdm.q);
    const rows = ls.filter((l) => !beritaAdm.lid || l.id === beritaAdm.lid).flatMap((l) => (l.berita || []).map((b, i) => ({ l, b, i })))
      .filter(({ l, b }) => !q || norm([b.judul, plainText(b.isi || ''), l.nama, l.singkatan].join(' ')).includes(q))
      .sort((a, c) => String(c.b.tanggal || '').localeCompare(String(a.b.tanggal || '')));
    const shown = compact ? rows.slice(0, 6) : rows;
    box.innerHTML = `<div class="master-head"><h3>${ic('mega')} Berita & Kegiatan Lembaga <small class="muted">(${rows.length})</small></h3><div class="row-gap">${compact ? `<a class="btn btn-ghost btn-sm" href="#/admin/lembaga/berita${katKey ? `?k=${katKey}` : ''}">Kelola semua →</a>` : ''}<button class="btn btn-primary btn-sm" data-bn-new ${ls.length ? '' : 'disabled'}>${ic('plus')} Tulis berita</button></div></div>
      ${compact ? '' : `<div class="toolbar"><div class="search">${ic('search')}<input data-noguard id="bn-q" placeholder="Cari judul atau isi berita…" value="${esc(beritaAdm.q)}"></div><select data-noguard id="bn-l" title="Saring per lembaga"><option value="">Semua lembaga (${ls.length})</option>${ls.map((l) => `<option value="${esc(l.id)}" ${beritaAdm.lid === l.id ? 'selected' : ''}>${esc(l.singkatan || l.nama)}</option>`).join('')}</select></div>`}
      <div class="info-admin">${shown.map(({ l, b, i }) => { const th = beritaThumb(b); return `<div class="info-row">${th ? `<img src="${esc(th)}" alt="">` : `<div class="info-ph">${ic('mega')}</div>`}<div class="info-row-main"><div class="info-meta"><span class="badge">${esc(l.singkatan || l.nama)}</span>${b.media?.length ? `<span class="badge badge-muted">${b.media.length} media</span>` : ''}</div><h4>${esc(b.judul)}</h4><p class="muted small">${esc(fmtDate(b.tanggal))}${b.penulis ? ` • oleh ${esc(penulisLabel(b.penulis))}` : ''}</p></div>
        <div class="info-row-actions"><a class="icon-btn" href="#/lembaga/${esc(l.id)}/berita/${esc(beritaId(b, i))}" target="_blank" title="Lihat halaman baca">${ic('eye')}</a><button class="icon-btn" data-bn-ed="${esc(l.id)}|${i}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-bn-rm="${esc(l.id)}|${i}" title="Hapus">${ic('trash')}</button></div></div>`; }).join('') || emptyBox(ls.length ? 'Belum ada berita. Klik “Tulis berita” untuk menambahkan.' : 'Belum ada lembaga yang dapat Anda kelola di kategori ini.')}</div>
      ${compact && rows.length > shown.length ? `<p class="muted small">+${rows.length - shown.length} berita lain — <a href="#/admin/lembaga/berita${katKey ? `?k=${katKey}` : ''}">lihat semua</a></p>` : ''}`;
    $('[data-bn-new]', box)?.addEventListener('click', () => beritaDialog(ls, beritaAdm.lid || ls[0]?.id, null, draw));
    $$('[data-bn-ed]', box).forEach((x) => x.onclick = () => { const [lid, i] = x.dataset.bnEd.split('|'); beritaDialog(ls, lid, +i, draw); });
    $$('[data-bn-rm]', box).forEach((x) => x.onclick = async () => {
      const [lid, i] = x.dataset.bnRm.split('|'); const l = state.lembaga.find((y) => y.id === lid); const b = l?.berita?.[+i]; if (!b) return;
      if (!await confirmDelete(`Hapus berita “${b.judul}” dari ${l.singkatan || l.nama}?`)) return;
      const berita = l.berita.filter((_, j) => j !== +i);
      try { await F.updateDoc(C(`lembaga/${lid}`), { berita, updatedAt: F.serverTimestamp(), updatedBy: state.user.email }); l.berita = berita; logAudit('lembaga', 'hapus_berita', `Menghapus berita “${b.judul}” — ${l.nama}`, { targetId: lid }); toast('Berita dihapus', 'success'); draw(); }
      catch (e) { toast('Gagal menghapus: ' + e.message, 'error'); }
    });
    $('#bn-q', box)?.addEventListener('input', debounce((e) => { beritaAdm.q = e.target.value; draw(); $('#bn-q', box)?.focus(); const el = $('#bn-q', box); el?.setSelectionRange(el.value.length, el.value.length); }, 250));
    $('#bn-l', box)?.addEventListener('change', (e) => { beritaAdm.lid = e.target.value; draw(); });
  };
  draw();
}
// Dialog tulis/ubah berita lembaga (dipakai panel kategori, halaman Berita & Kegiatan, dan editor lembaga)
export function beritaDialog(ls, lid, idx, onSaved) {
  const l0 = state.lembaga.find((x) => x.id === lid) || ls[0]; if (!l0) return;
  const b = idx == null ? { tanggal: todayISO() } : { ...(l0.berita || [])[idx] };
  const m = modal({ title: idx == null ? 'Tulis Berita & Kegiatan Lembaga' : 'Ubah Berita Lembaga', size: 'lg', body: `<form id="bdf" class="form-grid">
    <label class="field span-2"><span>Lembaga *</span><select name="lid" ${idx == null ? '' : 'disabled title="Lembaga tidak dapat diganti saat mengubah berita"'}>${ls.map((l) => `<option value="${esc(l.id)}" ${l.id === l0.id ? 'selected' : ''}>${esc(katOf(l.kategori).short)} — ${esc(l.singkatan || l.nama)}</option>`).join('')}</select></label>
    <label class="field span-2"><span>Judul berita *</span><input name="judul" value="${esc(b.judul || '')}" placeholder="mis. Posyandu Balita Bulan Oktober Diikuti 45 Anak"></label>
    <label class="field"><span>Tanggal kegiatan</span><input type="date" name="tanggal" value="${esc(b.tanggal || '')}" title="Tanggal kegiatan / berita"></label>
    <div class="field"><span>Ditulis oleh</span><input value="${esc(penulisLabel(b.penulis || penulisNow()))}" disabled title="Diisi otomatis dari akun Anda"></div>
    <label class="field span-2"><span>Isi berita <small class="muted">— tempel link YouTube/TikTok/Instagram/Facebook/foto di baris tersendiri agar langsung tampil sebagai pemutar/foto</small></span><textarea name="isi" rows="9" data-rich placeholder="Ceritakan kegiatannya: apa, siapa, kapan, di mana, hasilnya…">${esc(b.isi || '')}</textarea></label>
    <label class="field span-2"><span>Foto & video dari URL <small class="muted">— satu per baris, boleh ditambah “| keterangan”. YouTube, TikTok, Instagram, Facebook, Vimeo, Google Drive, link foto</small></span><textarea name="media" rows="3" placeholder="https://youtu.be/xxxxxxxxxxx | Dokumentasi kegiatan&#10;https://www.instagram.com/p/xxxx/ | Foto bersama&#10;https://contoh.com/foto.jpg">${esc(mediaLinesText(b.media))}</textarea></label>
    <div class="span-2 media-grid sm" id="bd-prev"></div></form>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="bd-ok">Simpan berita</button>' });
  const f = $('#bdf', m.el); bindRich(f);
  const prev = () => { $('#bd-prev', m.el).innerHTML = parseMediaLines(f.elements.media.value).map(mediaEmbed).join(''); };
  f.elements.media.addEventListener('input', debounce(prev, 400)); prev();
  $('#bd-ok', m.el).onclick = async () => {
    const judul = f.elements.judul.value.trim(); if (!judul) return toast('Judul berita wajib diisi', 'error');
    const l = state.lembaga.find((x) => x.id === (idx == null ? f.elements.lid.value : l0.id)); if (!l) return;
    const nb = { ...b, judul, tanggal: f.elements.tanggal.value, isi: f.elements.isi.value, media: parseMediaLines(f.elements.media.value), penulis: b.penulis || penulisNow(), id: b.id || Math.random().toString(36).slice(2, 10) };
    if (idx != null) nb.diubahOleh = penulisNow();
    const berita = [...(l.berita || [])]; if (idx == null) berita.push(nb); else berita[idx] = nb;
    if (JSON.stringify(berita).length > 700_000) return toast('Data berita lembaga ini terlalu besar. Gunakan link foto alih-alih unggahan.', 'error');
    const btn = $('#bd-ok', m.el); btn.disabled = true;
    try {
      await F.updateDoc(C(`lembaga/${l.id}`), { berita, updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
      l.berita = berita; if (editorState?.id === l.id) editorState.l.berita = structuredClone(berita);
      logAudit('lembaga', idx == null ? 'tambah_berita' : 'ubah_berita', `${idx == null ? 'Menambah' : 'Mengubah'} berita “${judul}” — ${l.nama}`, { targetId: l.id });
      m.close(); toast('Berita disimpan', 'success'); onSaved?.();
    } catch (e) { btn.disabled = false; toast('Gagal menyimpan: ' + e.message, 'error'); }
  };
}

// ---- editor baris (pengurus, anggota, murid/santri, dokumen)
function rowsEditor(box, { fields, rows, label, onChange, suggest = {} }) {
  const draw = () => {
    box.innerHTML = `<div class="rows-head"><span class="muted small">${rows.length} ${esc(label)}</span><div class="search mini">${ic('search')}<input data-noguard placeholder="Cari…" class="rows-q"></div></div>
      <div class="table-wrap"><table class="table rows-table"><thead><tr><th>#</th>${fields.map((f) => `<th>${esc(f.label)}</th>`).join('')}<th></th></tr></thead>
      <tbody>${rows.map((r, i) => `<tr data-i="${i}"><td class="muted small">${i + 1}</td>${fields.map((f) => `<td>${cellInput(f, r[f.k], i)}</td>`).join('')}<td class="actions-col"><button type="button" class="icon-btn" data-up="${i}" ${i ? '' : 'disabled'} title="Naik">↑</button><button type="button" class="icon-btn danger" data-rm="${i}" title="Hapus">${ic('trash')}</button></td></tr>`).join('') || `<tr><td colspan="${fields.length + 2}">${emptyBox(`Belum ada ${label}.`)}</td></tr>`}</tbody></table></div>
      <button type="button" class="btn btn-ghost btn-sm" data-add>${ic('plus')} Tambah ${esc(label)}</button>`;
    $$('[data-k]', box).forEach((inp) => {
      const f = fields.find((x) => x.k === inp.dataset.k);
      if (suggest[f.k]) attachAutocomplete(inp, { source: typeof suggest[f.k] === 'function' ? suggest[f.k] : suggest[f.k], smallList: 14, onSelect: (it) => f.onPick?.(it, rows[+inp.dataset.i], draw) });
      inp.addEventListener('input', () => { const r = rows[+inp.dataset.i]; r[f.k] = f.type === 'phone' ? inp.value : inp.value; onChange?.(); });
    });
    $$('[data-foto]', box).forEach((inp) => inp.onchange = async () => { try { rows[+inp.dataset.foto].foto = await compressImage(inp.files[0], 220, 0.78); onChange?.(); draw(); } catch (e) { toast(e.message, 'error'); } });
    $$('[data-fotourl]', box).forEach((b) => b.onclick = async () => { const u = await promptDialog('Foto dari URL', 'Tempel URL foto (https://…)', '', { placeholder: 'https://…/foto.jpg', okText: 'Pakai' }); if (u && safeUrl(u)) { rows[+b.dataset.fotourl].foto = safeUrl(u); onChange?.(); draw(); } else if (u) toast('URL harus diawali https://', 'error'); });
    $$('[data-rm]', box).forEach((b) => b.onclick = async () => { const r = rows[+b.dataset.rm]; if (!await confirmDelete(`Hapus ${label} “${r.nama || r.judul || '#' + (+b.dataset.rm + 1)}”?`)) return; rows.splice(+b.dataset.rm, 1); onChange?.(true); draw(); });
    $$('[data-up]', box).forEach((b) => b.onclick = () => { const i = +b.dataset.up; [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; onChange?.(); draw(); });
    $('[data-add]', box).onclick = () => { rows.push({}); onChange?.(); draw(); box.querySelector(`tr[data-i="${rows.length - 1}"] input`)?.focus(); };
    $('.rows-q', box).oninput = (e) => { const q = norm(e.target.value); $$('tbody tr[data-i]', box).forEach((tr) => { const r = rows[+tr.dataset.i]; tr.hidden = q && !norm(Object.values(r).filter((v) => typeof v === 'string' && !v.startsWith('data:')).join(' ')).includes(q); }); };
  };
  const cellInput = (f, v, i) => {
    const val = esc(v ?? '');
    if (f.type === 'select') return `<select data-k="${f.k}" data-i="${i}">${f.options.map(([o, l]) => `<option value="${esc(o)}" ${String(v ?? '') === o ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    if (f.type === 'foto') return `<div class="foto-cell">${v ? `<img src="${esc(v)}" alt="">` : '<span class="avatar">?</span>'}<label class="icon-btn" title="Unggah foto">${ic('upload')}<input type="file" accept="image/*" data-foto="${i}" hidden></label><button type="button" class="icon-btn" data-fotourl="${i}" title="Pakai URL foto">🔗</button></div>`;
    return `<input data-k="${f.k}" data-i="${i}" value="${val}" ${f.type === 'phone' ? 'type="tel"' : f.type === 'date' ? 'type="date"' : f.type === 'number' ? 'type="number" min="0"' : ''} placeholder="${esc(f.ph || '')}">`;
  };
  draw();
  return { redraw: draw };
}

let editorState = null;
function lembagaEditor(main, id, tabQ) {
  const l0 = state.lembaga.find((x) => x.id === id);
  if (!l0) { main.innerHTML = state.lembagaReady ? emptyBox('Lembaga tidak ditemukan.') : loadingBox(); return; }
  if (!canLembaga(id, l0.kategori)) { state.view = 'denied'; main.innerHTML = `<div class="callout">${ic('lock')}<div><b>Akses ditolak</b><p>Anda tidak ditugaskan mengelola lembaga ini.</p></div></div>`; return; }
  const full = can('lembaga');
  if (!editorState || editorState.id !== id) editorState = { id, l: structuredClone(l0), priv: null, tab: tabQ || 'profil', dirty: false };
  const S = editorState; const l = S.l;
  state.view = 'form';
  $('#page-title').textContent = l.singkatan || l.nama;
  const delegable = LEMBAGA_DELEGASI.includes(l0.kategori);
  const tabs = [['profil', 'Profil', 'home'], ['pengurus', 'Struktur Kepengurusan', 'users'], ['anggota', 'Anggota', 'users'], ...(pesertaLabel(l) ? [['peserta', pesertaLabel(l) === 'Santri' ? 'Santriwan/Santriwati' : 'Murid', 'book']] : []), ['berita', 'Berita & Kegiatan', 'mega'], ['media', 'Galeri & Video', 'ig'], ['dokumen', 'Dokumen', 'file'], ...(isSuper() && delegable ? [['pengelola', 'Pengelola (Admin)', 'lock']] : [])];
  if (!tabs.some(([t]) => t === S.tab)) S.tab = 'profil';
  main.innerHTML = `<div class="lg-ed-head">${logoOf(l, 'lg')}<div><span class="eyebrow">${esc(katOf(l.kategori).label)}</span><h2>${esc(l.nama)}</h2></div><span class="spacer"></span>
      <a class="btn btn-ghost btn-sm" href="#/lembaga/${id}" target="_blank">${ic('ext')} Lihat publik</a><a class="btn btn-ghost btn-sm" href="${full ? `#/admin/lembaga/k/${l.kategori}` : '#/admin/lembaga'}">← Kembali</a></div>
    <div class="tabs">${tabs.map(([t, n, i]) => `<button class="tab ${S.tab === t ? 'active' : ''}" data-tab="${t}">${ic(i)} ${esc(n)}</button>`).join('')}</div>
    <div class="panel" id="lg-pane" ${S.tab === 'pengelola' ? '' : 'data-guard'}></div>
    <div class="sticky-actions" ${S.tab === 'pengelola' ? 'hidden' : ''}><span class="muted small">${l0.updatedAt ? `Terakhir disimpan ${esc(fmtDate(l0.updatedAt, true))}${l0.updatedBy ? ' oleh ' + esc(l0.updatedBy) : ''}` : ''}</span><span class="spacer"></span>${full ? `<button class="btn btn-danger btn-ghost" id="lg-del">${ic('trash')} Hapus lembaga</button>` : ''}<button class="btn btn-primary" id="lg-save" data-save>${ic('check')} Simpan</button></div>`;
  $$('[data-tab]', main).forEach((b) => b.onclick = () => { collect(); S.tab = b.dataset.tab; lembagaEditor(main, id); });
  const pane = $('#lg-pane');
  const touch = () => { S.dirty = true; guard.dirty = true; };
  const ensurePriv = async () => {
    if (S.priv) return S.priv;
    try { const s = await F.getDoc(C(`lembagaPrivate/${id}`)); S.priv = { anggota: [], peserta: [], ...(s.data() || {}) }; } catch { S.priv = { anggota: [], peserta: [] }; }
    return S.priv;
  };
  let collect = () => {};
  if (S.tab === 'profil') {
    pane.innerHTML = `<form id="lgp" class="form-grid">
      <label class="field"><span>Nama lembaga *</span><input name="nama" value="${esc(l.nama || '')}"></label>
      <label class="field"><span>Singkatan</span><input name="singkatan" value="${esc(l.singkatan || '')}"></label>
      <label class="field"><span>Kategori</span><select name="kategori" ${full ? '' : 'disabled title="Hanya admin Kelembagaan / Super Admin"'}>${KATEGORI.map((k) => `<option value="${k.key}" ${k.key === l.kategori ? 'selected' : ''}>${esc(k.label)}</option>`).join('')}</select></label>
      <label class="field"><span>Jenis</span><select name="jenis">${Object.entries(JENIS_LABEL).map(([v, n]) => `<option value="${v}" ${v === (l.jenis || 'umum') ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      <label class="field"><span>Periode kepengurusan</span><input name="periode" value="${esc(l.periode || '')}" placeholder="mis. 2024–2029"></label>
      <label class="field"><span>No. WhatsApp kontak</span><input name="kontak" type="tel" value="${esc(l.kontak || '')}"></label>
      <label class="field span-2"><span>Alamat / sekretariat</span><input name="alamat" value="${esc(l.alamat || '')}"></label>
      <label class="field span-2"><span>Deskripsi / profil lembaga</span><textarea name="deskripsi" rows="7" data-rich>${esc(l.deskripsi || '')}</textarea></label>
      <label class="field span-2"><span>Visi</span><textarea name="visi" rows="2">${esc(l.visi || '')}</textarea></label>
      <label class="field span-2"><span>Dasar hukum / SK pembentukan</span><input name="dasarHukum" value="${esc(l.dasarHukum || '')}"></label>
      <label class="field"><span>Bagian struktur (pisahkan dengan ;)</span><input name="bagianList" value="${esc((l.bagianList || []).join('; '))}" placeholder="mis. Pimpinan; Seksi; Anggota"></label>
      <label class="field"><span>Urutan tampil</span><input name="urutan" type="number" value="${esc(l.urutan ?? '')}"></label>
      <div class="field span-2"><span>Logo</span><div class="img-pick"><div class="img-prev">${l.logo ? `<img src="${esc(l.logo)}" alt="">` : ''}</div><label class="btn btn-ghost btn-sm">${ic('upload')} Unggah<input type="file" accept="image/*" id="lg-logo" hidden></label><input id="lg-logo-url" placeholder="atau tempel URL logo https://…" value="${l.logo && !l.logo.startsWith('data:') ? esc(l.logo) : ''}"><button type="button" class="btn btn-ghost btn-sm" id="lg-logo-rm">Hapus</button></div></div>
      <label class="check"><input type="checkbox" name="published" ${l.published !== false ? 'checked' : ''}> Tampilkan di halaman publik</label></form>`;
    const f = $('#lgp'); bindRich(f);
    $('#lg-logo').onchange = async (e) => { try { l.logo = await compressImage(e.target.files[0], 256, 0.85); $('.img-prev', f).innerHTML = `<img src="${l.logo}" alt="">`; touch(); } catch (err) { toast(err.message, 'error'); } };
    $('#lg-logo-url').oninput = (e) => { const u = safeUrl(e.target.value); if (u) { l.logo = u; $('.img-prev', f).innerHTML = `<img src="${esc(u)}" alt="">`; } touch(); };
    $('#lg-logo-rm').onclick = () => { l.logo = ''; $('.img-prev', f).innerHTML = ''; touch(); };
    f.addEventListener('input', touch);
    collect = () => {
      for (const k of ['nama', 'singkatan', 'jenis', 'periode', 'alamat', 'deskripsi', 'visi', 'dasarHukum']) l[k] = f.elements[k].value.trim();
      if (full) l.kategori = f.elements.kategori.value;
      l.kontak = normalizePhone(f.elements.kontak.value); l.urutan = Number(f.elements.urutan.value) || 0; l.published = f.elements.published.checked;
      l.bagianList = f.elements.bagianList.value.split(';').map((x) => x.trim()).filter(Boolean);
    };
  } else if (S.tab === 'pengurus') {
    l.pengurus = l.pengurus || [];
    pane.innerHTML = `<div class="row-gap"><h3 style="margin:0">${ic('users')} Struktur Kepengurusan</h3><span class="spacer"></span>${/pemerintah gampong/i.test(l.nama) ? `<button class="btn btn-ghost btn-sm" id="lg-kadus">${ic('map')} Ambil Kepala Dusun dari data Dusun</button>` : ''}<button class="btn btn-ghost btn-sm" id="lg-x-peng">${ic('download')} Excel</button><button class="btn btn-ghost btn-sm" id="lg-p-peng">${ic('file')} PDF</button></div><p class="muted small">Ketik nama untuk saran dari data warga. Foto bisa diunggah atau memakai URL.</p><div id="rows"></div>`;
    const ed = rowsEditor($('#rows'), { label: 'pengurus', rows: l.pengurus, onChange: touch,
      fields: [{ k: 'foto', label: 'Foto', type: 'foto' }, { k: 'nama', label: 'Nama', ph: 'Nama lengkap', onPick: (it, row, redraw) => { const w = state.warga.find((x) => x.id === it.id); if (w?.noHp && !row.hp) { row.hp = w.noHp; redraw(); } } }, { k: 'jabatan', label: 'Jabatan' }, { k: 'bagian', label: 'Bagian' }, { k: 'hp', label: 'No. HP', type: 'phone' }],
      suggest: { nama: () => state.warga.map((w) => ({ label: w.nama, sub: [w.dusun && `Dusun ${w.dusun}`, w.noHp].filter(Boolean).join(' • '), id: w.id })), jabatan: l.jabatanList || JAB_UMUM, bagian: l.bagianList?.length ? l.bagianList : ['Pengurus Inti', 'Seksi', 'Anggota'] } });
    $('#lg-kadus')?.addEventListener('click', () => {
      let n = 0;
      for (const d of state.dusun) { if (!d.kepalaNama || l.pengurus.some((p) => norm(p.nama) === norm(d.kepalaNama))) continue; l.pengurus.push({ nama: d.kepalaNama, jabatan: `Kepala Dusun ${d.nama}`, bagian: 'Kepala Dusun (Ulee Jurong)', hp: d.kepalaHp || '' }); n++; }
      touch(); ed.redraw(); toast(n ? `${n} kepala dusun ditambahkan` : 'Semua kepala dusun sudah ada / belum diisi di menu Dusun', n ? 'success' : 'info');
    });
    const head = ['No', 'Nama', 'Jabatan', 'Bagian', 'No. HP']; const body = () => l.pengurus.map((p, i) => [i + 1, p.nama || '', p.jabatan || '', p.bagian || '', p.hp || '']);
    $('#lg-x-peng').onclick = () => { logAudit('export', 'lembaga_pengurus_xls', `Mengekspor pengurus ${l.nama} (Excel)`); exportExcel(`Pengurus_${l.singkatan || l.nama}`, [{ name: 'Pengurus', title: `Struktur Kepengurusan ${l.nama}${l.periode ? ` — Periode ${l.periode}` : ''}`, head, body: body() }]); };
    $('#lg-p-peng').onclick = () => { logAudit('export', 'lembaga_pengurus_pdf', `Mengekspor pengurus ${l.nama} (PDF)`); exportPdf({ filename: `Pengurus_${l.singkatan || l.nama}`, title: `Struktur Kepengurusan ${l.nama}`, subtitle: l.periode ? `Periode ${l.periode}` : '', orientation: 'portrait', sections: groupPengurus(l).map(([g, ps]) => ({ heading: g, head, body: ps.map((p, i) => [i + 1, p.nama || '', p.jabatan || '', p.bagian || '', p.hp || '']) })) }); };
  } else if (S.tab === 'anggota' || S.tab === 'peserta') {
    pane.innerHTML = loadingBox();
    ensurePriv().then((priv) => {
      const isP = S.tab === 'peserta'; const arr = isP ? (priv.peserta ||= []) : (priv.anggota ||= []);
      const lbl = isP ? (pesertaLabel(l) === 'Santri' ? 'santri' : 'murid') : 'anggota';
      const fields = isP
        ? [{ k: 'nama', label: 'Nama' }, { k: 'jk', label: pesertaLabel(l) === 'Santri' ? 'Santriwan/wati' : 'L/P', type: 'select', options: [['L', pesertaJk(l, 'L')], ['P', pesertaJk(l, 'P')]] }, { k: 'tglLahir', label: 'Tgl lahir', type: 'date' }, { k: 'kelas', label: pesertaLabel(l) === 'Santri' ? 'Kelas / Jilid / Iqra' : 'Kelas / Kelompok' }, { k: 'wali', label: 'Orang tua / wali' }, { k: 'hp', label: 'HP wali', type: 'phone' }, { k: 'status', label: 'Status', type: 'select', options: [['aktif', 'Aktif'], ['lulus', 'Lulus / Khatam'], ['keluar', 'Keluar']] }]
        : [{ k: 'nama', label: 'Nama' }, { k: 'jk', label: 'L/P', type: 'select', options: [['', '-'], ['L', 'Laki-laki'], ['P', 'Perempuan']] }, { k: 'peran', label: 'Peran / seksi' }, { k: 'dusun', label: 'Dusun' }, { k: 'hp', label: 'No. HP', type: 'phone' }, { k: 'keterangan', label: 'Keterangan' }];
      pane.innerHTML = `<div class="row-gap"><h3 style="margin:0">${ic(isP ? 'book' : 'users')} Daftar ${esc(lbl[0].toUpperCase() + lbl.slice(1))}</h3><span class="spacer"></span><button class="btn btn-ghost btn-sm" id="lg-x">${ic('download')} Excel</button><button class="btn btn-ghost btn-sm" id="lg-pdf">${ic('file')} PDF</button></div>
        <p class="callout small-callout">${ic('lock')} Data ${esc(lbl)} bersifat pribadi: hanya dapat dilihat admin. Halaman publik hanya menampilkan jumlah (${isP ? `${pesertaJk(l, 'L')}/${pesertaJk(l, 'P')}` : 'total'}).</p><div id="rows"></div>`;
      rowsEditor($('#rows'), { label: lbl, rows: arr, onChange: touch, fields,
        suggest: { nama: () => state.warga.map((w) => ({ label: w.nama, sub: [w.dusun && `Dusun ${w.dusun}`, w.umur !== '' && w.umur != null ? `${w.umur} th` : ''].filter(Boolean).join(' • '), id: w.id })), dusun: () => state.dusun.map((d) => d.nama), peran: l.jabatanList || JAB_UMUM } });
      const head = ['No', ...fields.map((f) => f.label)];
      const body = () => arr.map((r, i) => [i + 1, ...fields.map((f) => (f.type === 'select' ? (f.options.find((o) => o[0] === (r[f.k] || ''))?.[1] || '') : r[f.k] || ''))]);
      const ttl = `Daftar ${lbl[0].toUpperCase() + lbl.slice(1)} ${l.singkatan || l.nama}`;
      $('#lg-x').onclick = () => { logAudit('export', `lembaga_${S.tab}_xls`, `Mengekspor ${ttl} (Excel)`, { count: arr.length }); exportExcel(ttl, [{ name: lbl, title: ttl, head, body: body() }]); };
      $('#lg-pdf').onclick = () => { logAudit('export', `lembaga_${S.tab}_pdf`, `Mengekspor ${ttl} (PDF)`, { count: arr.length }); exportPdf({ filename: ttl, title: ttl, subtitle: `${arr.length} ${lbl}`, sections: [{ head, body: body() }] }); };
    });
  } else if (S.tab === 'berita') {
    l.berita = l.berita || [];
    const draw = () => {
      const list = [...l.berita].map((b, i) => ({ ...b, _i: i })).sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
      pane.innerHTML = `<div class="row-gap"><h3 style="margin:0">${ic('mega')} Berita & Kegiatan Lembaga</h3><span class="spacer"></span><button class="btn btn-primary btn-sm" id="bn-new">${ic('plus')} Tulis berita</button></div>
        <div class="info-admin">${list.map((b) => { const th = (b.media || []).map((m) => mediaThumb(m.url)).find(Boolean); return `<div class="info-row">${th ? `<img src="${esc(th)}" alt="">` : `<div class="info-ph">${ic('mega')}</div>`}<div class="info-row-main"><h4>${esc(b.judul)}</h4><p class="muted small">${esc(fmtDate(b.tanggal))}${b.penulis ? ` • oleh ${esc(penulisLabel(b.penulis))}` : ''}${b.media?.length ? ` • ${b.media.length} media` : ''}</p></div><div class="info-row-actions"><button class="icon-btn" data-ed="${b._i}">${ic('edit')}</button><button class="icon-btn danger" data-rm="${b._i}">${ic('trash')}</button></div></div>`; }).join('') || emptyBox('Belum ada berita lembaga.')}</div>`;
      $('#bn-new').onclick = () => beritaForm(null);
      $$('[data-ed]', pane).forEach((x) => x.onclick = () => beritaForm(+x.dataset.ed));
      $$('[data-rm]', pane).forEach((x) => x.onclick = async () => { const b = l.berita[+x.dataset.rm]; if (!await confirmDelete(`Hapus berita “${b.judul}”?`)) return; l.berita.splice(+x.dataset.rm, 1); touch(); await save(`Menghapus berita “${b.judul}”`); draw(); });
    };
    const beritaForm = (idx) => {
      const b = idx == null ? { tanggal: todayISO() } : l.berita[idx];
      const m = modal({ title: idx == null ? 'Tulis Berita Lembaga' : 'Ubah Berita', size: 'lg', body: `<form id="bnf" class="form-grid">
        <label class="field span-2"><span>Judul *</span><input name="judul" value="${esc(b.judul || '')}"></label>
        <label class="field"><span>Tanggal</span><input type="date" name="tanggal" value="${esc(b.tanggal || '')}"></label>
        <label class="field span-2"><span>Isi berita</span><textarea name="isi" rows="8" data-rich>${esc(b.isi || '')}</textarea></label>
        <label class="field span-2"><span>Foto & video (satu URL per baris, boleh ditambah “| keterangan”) — YouTube, Google Drive, atau link gambar</span><textarea name="media" rows="3" placeholder="https://youtu.be/xxxx | Dokumentasi kegiatan&#10;https://drive.google.com/file/d/…/view">${esc(mediaLinesText(b.media))}</textarea></label>
        <div class="span-2" id="bn-prev"></div></form>`,
        footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="bn-ok">Simpan berita</button>' });
      const f = $('#bnf', m.el); bindRich(f);
      const prev = () => { $('#bn-prev', m.el).innerHTML = `<div class="media-grid sm">${parseMediaLines(f.elements.media.value).map(mediaEmbed).join('')}</div>`; };
      f.elements.media.addEventListener('input', debounce(prev, 400)); prev();
      $('#bn-ok', m.el).onclick = async () => {
        const judul = f.elements.judul.value.trim(); if (!judul) return toast('Judul wajib diisi', 'error');
        const nb = { ...b, judul, tanggal: f.elements.tanggal.value, isi: f.elements.isi.value, media: parseMediaLines(f.elements.media.value), penulis: b.penulis || penulisNow(), id: b.id || Math.random().toString(36).slice(2, 10) };
        if (idx == null) l.berita.push(nb); else { nb.diubahOleh = penulisNow(); l.berita[idx] = nb; }
        touch(); m.close(); await save(`${idx == null ? 'Menambah' : 'Mengubah'} berita “${judul}”`); draw();
      };
    };
    draw();
  } else if (S.tab === 'media') {
    l.media = l.media || [];
    pane.innerHTML = `<h3>${ic('ig')} Galeri Foto & Video</h3><p class="muted small">Tempel URL — satu per baris, boleh ditambah “| keterangan”. Mendukung YouTube (video/shorts/live), Google Drive (file dibagikan publik), dan link gambar (.jpg/.png/.webp).</p>
      <textarea id="md-in" rows="6" placeholder="https://www.youtube.com/watch?v=xxxx | Peresmian Meunasah&#10;https://drive.google.com/file/d/xxxx/view | Foto gotong royong">${esc(mediaLinesText(l.media))}</textarea><div id="md-prev" class="media-grid"></div>`;
    const prev = () => { const arr = parseMediaLines($('#md-in').value); $('#md-prev').innerHTML = arr.map(mediaEmbed).join('') || emptyBox('Belum ada media.'); };
    $('#md-in').addEventListener('input', debounce(() => { touch(); prev(); }, 400)); prev();
    collect = () => { l.media = parseMediaLines($('#md-in').value); };
  } else if (S.tab === 'dokumen') {
    l.dokumen = l.dokumen || [];
    pane.innerHTML = `<h3>${ic('file')} Dokumen Lembaga</h3><p class="muted small">Unggah berkas ke Google Drive / penyimpanan lain (atur “siapa saja yang memiliki link dapat melihat”), lalu tempel link-nya. Tombol unduh dibuat otomatis.</p><div id="rows"></div>`;
    rowsEditor($('#rows'), { label: 'dokumen', rows: l.dokumen, onChange: touch, fields: [{ k: 'judul', label: 'Judul dokumen' }, { k: 'jenis', label: 'Jenis' }, { k: 'tahun', label: 'Tahun', ph: '2026' }, { k: 'url', label: 'Link berkas (https://…)' }], suggest: { jenis: ['SK Pembentukan', 'AD/ART', 'Program Kerja', 'Laporan Kegiatan', 'Laporan Keuangan', 'Notulen Rapat', 'Proposal', 'Lainnya'] } });
  } else if (S.tab === 'pengelola') {
    pengelolaTab(pane, l0);
  }
  async function save(label) {
    collect();
    if (!l.nama) return toast('Nama lembaga wajib diisi', 'error');
    const priv = S.priv;
    const pc = priv?.peserta ? { total: priv.peserta.filter((p) => (p.status || 'aktif') === 'aktif').length, l: priv.peserta.filter((p) => (p.status || 'aktif') === 'aktif' && p.jk !== 'P').length, p: priv.peserta.filter((p) => (p.status || 'aktif') === 'aktif' && p.jk === 'P').length } : l.pesertaCount;
    const data = clean({ ...l, id: undefined, pengurus: (l.pengurus || []).filter((p) => p.nama).map((p) => ({ ...p, hp: normalizePhone(p.hp || '') })), dokumen: (l.dokumen || []).filter((d) => d.judul && safeUrl(d.url)), anggotaCount: priv?.anggota ? priv.anggota.filter((a) => a.nama).length : l.anggotaCount, pesertaCount: pc, updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
    if (JSON.stringify(data).length > 950_000) return toast('Data terlalu besar (foto terlalu banyak). Gunakan URL foto alih-alih unggahan.', 'error');
    try {
      const ops = F.writeBatch(F.db);
      ops.set(C(`lembaga/${id}`), data);
      if (priv) ops.set(C(`lembagaPrivate/${id}`), { anggota: (priv.anggota || []).filter((a) => a.nama).map((a) => ({ ...a, hp: normalizePhone(a.hp || '') })), peserta: (priv.peserta || []).filter((p) => p.nama).map((p) => ({ ...p, hp: normalizePhone(p.hp || '') })), updatedAt: F.serverTimestamp() });
      await ops.commit();
      logAudit('lembaga', 'ubah', label || `Memperbarui lembaga ${l.nama}`, { target: l.nama, targetId: id, changes: diff(l0, data, (k) => ({ nama: 'Nama', singkatan: 'Singkatan', deskripsi: 'Deskripsi', periode: 'Periode', kontak: 'Kontak', published: 'Tampil publik' }[k] || k)) });
      S.dirty = false; guard.dirty = false; toast('Lembaga disimpan', 'success');
    } catch (e) { toast('Gagal menyimpan: ' + e.message, 'error'); }
  }
  $('#lg-save').onclick = () => save();
  if (full) $('#lg-del').onclick = async () => {
    if (!await confirmDelete(`Hapus lembaga “${l.nama}” beserta pengurus, anggota, berita, dan dokumennya?`)) return;
    const b = F.writeBatch(F.db); b.delete(C(`lembaga/${id}`)); b.delete(C(`lembagaPrivate/${id}`)); await b.commit();
    logAudit('lembaga', 'hapus', `Menghapus lembaga ${l.nama}`, { targetId: id }); editorState = null; guard.dirty = false;
    toast('Lembaga dihapus', 'success'); location.hash = `#/admin/lembaga/k/${l.kategori}`;
  };
}
// ---- Pengelola lembaga (khusus Super Admin): angkat admin / buat akun pengelola dari pengurus & anggota
function pengelolaTab(pane, l) {
  pane.innerHTML = loadingBox();
  F.getDocs(F.query(F.collection(F.db, 'users'), F.where('role', '==', 'admin'))).then((snap) => {
    const admins = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    const draw = () => {
      const mgr = admins.filter((a) => (a.lembagaIds || []).includes(l.id));
      const others = admins.filter((a) => !(a.lembagaIds || []).includes(l.id) && a.active !== false);
      pane.innerHTML = `<h3>${ic('lock')} Pengelola ${esc(l.singkatan || l.nama)}</h3>
        <p class="muted small">Super Admin dapat mengangkat pengurus/anggota lembaga menjadi <b>admin pengelola</b>. Pengelola hanya dapat mengubah lembaga yang ditugaskan (profil, pengurus, anggota, ${pesertaLabel(l) ? 'murid/santri, ' : ''}berita, galeri, dokumen) — tidak dapat menghapus lembaga, tidak dapat membuka data warga, dan dikunci oleh Firestore Rules.</p>
        <div class="table-wrap"><table class="table"><thead><tr><th>Pengelola</th><th>Jabatan</th><th>Login terakhir</th><th class="actions-col"></th></tr></thead><tbody>
        ${mgr.map((a) => `<tr><td><div class="user-cell">${avatar(a)}<div><b>${esc(a.nama || '-')}</b>${badgeRow(a.badges, 4)}<br><small class="muted">${esc(a.email)}</small></div></div></td><td class="small">${esc(a.jabatan || '-')}${a.active === false ? ' <span class="badge badge-muted">Nonaktif</span>' : ''}</td><td class="small">${esc(fmtDate(a.lastLogin, true) || '-')}</td><td class="actions-col"><button class="btn btn-sm btn-ghost danger" data-cabut="${a.uid}">Cabut</button></td></tr>`).join('') || `<tr><td colspan="4">${emptyBox('Belum ada pengelola untuk lembaga ini.')}</td></tr>`}</tbody></table></div>
        <div class="form-grid" style="margin-top:12px">
          <div class="field"><span>Angkat admin yang sudah ada</span><div class="input-group"><select id="pg-pick" style="min-width:260px;flex:1"><option value="">— pilih admin —</option>${others.map((a) => `<option value="${a.uid}">${esc(a.nama || a.email)} (${esc(a.email)})</option>`).join('')}</select><button class="btn btn-ghost" id="pg-angkat">${ic('check')} Angkat</button></div></div>
          <div class="field"><span>Atau buat akun baru</span><button class="btn btn-primary" id="pg-new">${ic('plus')} Buat akun pengelola</button></div>
        </div>`;
      $('#pg-angkat').onclick = async () => {
        const uid = $('#pg-pick').value; if (!uid) return toast('Pilih admin terlebih dahulu', 'error');
        const a = admins.find((x) => x.uid === uid);
        try {
          await F.updateDoc(C(`users/${uid}`), { lembagaIds: F.arrayUnion(l.id), updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
          a.lembagaIds = [...(a.lembagaIds || []), l.id];
          logAudit('admin', 'angkat_pengelola', `Mengangkat ${a.email} sebagai pengelola ${l.nama}`, { target: a.email, targetId: uid });
          toast(`${a.nama || a.email} kini mengelola ${l.singkatan || l.nama}`, 'success'); draw();
        } catch (e) { toast('Gagal: ' + e.message, 'error'); }
      };
      $$('[data-cabut]', pane).forEach((b) => b.onclick = async () => {
        const a = admins.find((x) => x.uid === b.dataset.cabut);
        if (!await confirmDialog(`Cabut ${a.nama || a.email} dari pengelola ${l.singkatan || l.nama}? Akun tetap ada, hanya tugas lembaga ini yang dicabut.`, { danger: true, okText: 'Cabut' })) return;
        try {
          await F.updateDoc(C(`users/${a.uid}`), { lembagaIds: F.arrayRemove(l.id), updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
          a.lembagaIds = (a.lembagaIds || []).filter((x) => x !== l.id);
          logAudit('admin', 'cabut_pengelola', `Mencabut ${a.email} dari pengelola ${l.nama}`, { target: a.email, targetId: a.uid });
          toast('Pengelola dicabut', 'success'); draw();
        } catch (e) { toast('Gagal: ' + e.message, 'error'); }
      });
      $('#pg-new').onclick = () => newPengelolaDialog(l, (u) => { admins.push(u); draw(); });
    };
    draw();
  }).catch((e) => { pane.innerHTML = emptyBox('Gagal memuat daftar admin: ' + e.message); });
}
async function newPengelolaDialog(l, onDone) {
  let priv = editorState?.priv;
  if (!priv) { try { priv = (await F.getDoc(C(`lembagaPrivate/${l.id}`))).data() || {}; } catch { priv = {}; } }
  const people = [...(l.pengurus || []).map((p) => ({ label: p.nama, sub: p.jabatan || 'Pengurus', hp: p.hp, jabatan: p.jabatan })), ...(priv.anggota || []).map((a) => ({ label: a.nama, sub: a.peran || 'Anggota', hp: a.hp, jabatan: a.peran }))].filter((p) => p.label);
  const m = modal({ title: `Buat Akun Pengelola — ${l.singkatan || l.nama}`, size: 'lg', body: `<form id="pgf" class="form-grid">
    <p class="muted small span-2">Ketik nama untuk memilih dari <b>pengurus/anggota</b> lembaga ini. Akun dibuat sebagai Admin tanpa hak akses lain selain mengelola lembaga ini.</p>
    <label class="field"><span>Nama lengkap *</span><input name="nama" required autocomplete="off"></label>
    <label class="field"><span>Jabatan</span><input name="jabatan" value="Pengelola ${esc(l.singkatan || l.nama)}"></label>
    <label class="field"><span>No. HP / WhatsApp</span><input name="hp" type="tel"></label>
    <label class="field"><span>Email login *</span><input name="email" type="email" required></label>
    <label class="field span-2"><span>Password awal * (min. 8, huruf & angka)</span><div class="input-group"><input name="pw" type="text" required minlength="8"><button type="button" class="btn btn-ghost" id="pg-gen">Acak</button></div></label></form>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="pg-ok">Buat akun</button>' });
  const f = $('#pgf', m.el);
  attachAutocomplete(f.elements.nama, { source: people, smallList: 12, onSelect: (it) => { if (it.hp && !f.elements.hp.value) f.elements.hp.value = it.hp; if (it.jabatan) f.elements.jabatan.value = `${it.jabatan} — Pengelola ${l.singkatan || l.nama}`; } });
  const gen = () => { const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const arr = crypto.getRandomValues(new Uint32Array(11)); f.elements.pw.value = Array.from(arr, (n) => a[n % a.length]).join('') + '7'; };
  $('#pg-gen', m.el).onclick = gen; gen();
  $('#pg-ok', m.el).onclick = async () => {
    const nama = f.elements.nama.value.trim(), email = f.elements.email.value.trim().toLowerCase(), pw = f.elements.pw.value;
    if (!nama) return toast('Nama wajib diisi', 'error');
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Email tidak valid', 'error');
    if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return toast('Password minimal 8 karakter, berisi huruf & angka', 'error');
    if (norm(email) === norm(superEmail())) return toast('Email ini milik Super Admin', 'error');
    if (!await requirePassword(`Membuat akun pengelola ${l.nama} untuk ${email}.`)) return;
    const btn = $('#pg-ok', m.el); btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Membuat…';
    try {
      const uid = await F.createAuthUser(email, pw);
      const doc = { email, nama, jabatan: f.elements.jabatan.value.trim(), hp: normalizePhone(f.elements.hp.value), role: 'admin', active: true, perms: {}, lembagaIds: [l.id], createdAt: F.serverTimestamp(), createdBy: state.user.email };
      await F.setDoc(C(`users/${uid}`), doc);
      logAudit('admin', 'daftar', `Mendaftarkan pengelola ${l.nama}: ${email}`, { target: email, targetId: uid });
      m.close(); onDone?.({ uid, ...doc });
      modal({ title: 'Akun pengelola dibuat', size: 'sm', body: `<p>Sampaikan data login ini kepada <b>${esc(nama)}</b> secara pribadi:</p><dl class="detail"><dt>Alamat</dt><dd>${esc(location.origin + location.pathname)}#/login</dd><dt>Email</dt><dd>${esc(email)}</dd><dt>Password</dt><dd><code>${esc(pw)}</code></dd><dt>Mengelola</dt><dd>${esc(l.nama)}</dd></dl><p class="muted small">Minta pengguna segera mengganti password di Pengaturan → Akun Saya.</p>`, footer: '<button class="btn btn-primary" data-close>Selesai</button>', guard: false });
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Buat akun';
      toast(e.code === 'auth/email-already-in-use' ? 'Email sudah terdaftar. Bila akun itu sudah admin, gunakan “Angkat admin yang sudah ada”.' : 'Gagal: ' + (authErrorMessage(e) || e.message), 'error', { duration: 9000 });
    }
  };
}
void ROLE_LABEL;
export const lembagaEditorDirty = () => !!editorState?.dirty;
export const resetLembagaEditor = () => { editorState = null; };

// ================================================================ ADMIN: Dokumen Publik
const docAdm = { q: '', jenis: '' };
export function viewDokumenAdmin(main) {
  state.view = 'dokumen';
  const jenisAll = state.master.jenisDokumen?.items || JENIS_DOKUMEN;
  const q = norm(docAdm.q);
  const list = state.dokumen.filter((d) => (!docAdm.jenis || d.jenis === docAdm.jenis) && (!q || norm([d.judul, d.nomor, d.jenis, d.tahun].join(' ')).includes(q)))
    .sort((a, b) => String(b.tahun || '').localeCompare(String(a.tahun || '')) || String(a.judul).localeCompare(String(b.judul)));
  main.innerHTML = `<div class="toolbar"><div class="search">${ic('search')}<input id="da-q" placeholder="Cari dokumen…" value="${esc(docAdm.q)}" data-noguard></div><select id="da-j" data-noguard><option value="">Semua jenis</option>${jenisAll.map((j) => `<option ${docAdm.jenis === j ? 'selected' : ''}>${esc(j)}</option>`).join('')}</select></div>
    <div class="toolbar toolbar-actions"><button class="btn btn-primary" id="da-new">${ic('plus')} Tambah Dokumen</button><button class="btn btn-ghost" id="da-x">${ic('download')} Ekspor daftar (Excel)</button><a class="btn btn-ghost" href="#/dokumen" target="_blank">${ic('ext')} Halaman publik</a><span class="muted small">${list.length} dari ${state.dokumen.length} dokumen</span></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Dokumen</th><th>Jenis</th><th>Tahun</th><th>Status</th><th class="actions-col">Aksi</th></tr></thead><tbody>
    ${list.map((d) => `<tr><td><b>${esc(d.judul)}</b>${d.nomor ? `<br><small class="muted">No. ${esc(d.nomor)}</small>` : ''}</td><td>${esc(d.jenis || '-')}</td><td>${esc(d.tahun || '-')}</td><td><span class="badge ${d.published === false ? 'badge-muted' : 'badge-ok'}">${d.published === false ? 'Draf' : 'Publik'}</span></td>
      <td class="actions-col">${safeUrl(d.url) ? `<a class="icon-btn" href="${esc(safeUrl(d.url))}" target="_blank" rel="noopener" title="Lihat">${ic('eye')}</a><a class="icon-btn" href="${esc(downloadUrl(d.url))}" target="_blank" rel="noopener" title="Unduh">${ic('download')}</a>` : ''}<button class="icon-btn" data-ed="${d.id}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-rm="${d.id}" title="Hapus">${ic('trash')}</button></td></tr>`).join('') || `<tr><td colspan="5">${emptyBox('Belum ada dokumen publik. Tambahkan RPJMG, APBG, Reusam, dan lainnya.')}</td></tr>`}</tbody></table></div>`;
  $('#da-q').oninput = debounce((e) => { docAdm.q = e.target.value; viewDokumenAdmin(main); $('#da-q').focus(); $('#da-q').setSelectionRange(99, 99); }, 300);
  $('#da-j').onchange = (e) => { docAdm.jenis = e.target.value; viewDokumenAdmin(main); };
  $('#da-new').onclick = () => dokumenForm(null);
  $$('[data-ed]', main).forEach((b) => b.onclick = () => dokumenForm(state.dokumen.find((d) => d.id === b.dataset.ed)));
  $$('[data-rm]', main).forEach((b) => b.onclick = async () => {
    const d = state.dokumen.find((x) => x.id === b.dataset.rm);
    if (!await confirmDelete(`Hapus dokumen “${d.judul}”?`)) return;
    await F.deleteDoc(C(`dokumen/${d.id}`)); logAudit('dokumen', 'hapus', `Menghapus dokumen publik “${d.judul}”`, { targetId: d.id }); toast('Dokumen dihapus', 'success');
  });
  $('#da-x').onclick = () => { logAudit('export', 'dokumen_xls', 'Mengekspor daftar dokumen publik (Excel)'); exportExcel('Daftar_Dokumen_Publik', [{ name: 'Dokumen', title: 'Daftar Dokumen Publik Gampong', head: ['No', 'Judul', 'Jenis', 'Nomor', 'Tahun', 'Tanggal', 'Status', 'Link'], body: list.map((d, i) => [i + 1, d.judul, d.jenis || '', d.nomor || '', d.tahun || '', d.tanggal || '', d.published === false ? 'Draf' : 'Publik', d.url || '']) }]); };
}
function dokumenForm(d) {
  const jenisAll = state.master.jenisDokumen?.items || JENIS_DOKUMEN;
  const m = modal({ title: d ? 'Ubah Dokumen Publik' : 'Tambah Dokumen Publik', size: 'lg', body: `<form id="dkf" class="form-grid">
    <label class="field span-2"><span>Judul dokumen *</span><input name="judul" value="${esc(d?.judul || '')}" placeholder="mis. APBG Gampong Lampineung Tahun 2026"></label>
    <label class="field"><span>Jenis *</span><input name="jenis" value="${esc(d?.jenis || '')}" placeholder="Ketik: RPJMG, APBG, Reusam…"></label>
    <label class="field"><span>Nomor</span><input name="nomor" value="${esc(d?.nomor || '')}" placeholder="mis. 03/2026"></label>
    <label class="field"><span>Tahun</span><input name="tahun" value="${esc(d?.tahun || String(new Date().getFullYear()))}" inputmode="numeric" maxlength="9"></label>
    <label class="field"><span>Tanggal penetapan</span><input type="date" name="tanggal" value="${esc(d?.tanggal || '')}"></label>
    <label class="field span-2"><span>Link berkas * (Google Drive / penyimpanan lain, akses “siapa saja yang memiliki link”)</span><input name="url" value="${esc(d?.url || '')}" placeholder="https://drive.google.com/file/d/…/view"></label>
    <label class="field span-2"><span>Ringkasan / keterangan</span><textarea name="deskripsi" rows="4" data-rich>${esc(d?.deskripsi || '')}</textarea></label>
    <label class="check"><input type="checkbox" name="published" ${d?.published === false ? '' : 'checked'}> Tampilkan di halaman Dokumen Publik</label></form>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="dk-ok">Simpan</button>' });
  const f = $('#dkf', m.el); bindRich(f);
  attachAutocomplete(f.elements.jenis, { source: jenisAll, smallList: 20 });
  $('#dk-ok', m.el).onclick = async () => {
    const data = { judul: f.elements.judul.value.trim(), jenis: f.elements.jenis.value.trim(), nomor: f.elements.nomor.value.trim(), tahun: f.elements.tahun.value.trim(), tanggal: f.elements.tanggal.value, url: safeUrl(f.elements.url.value), deskripsi: f.elements.deskripsi.value, published: f.elements.published.checked, format: guessFormat(f.elements.url.value), updatedAt: F.serverTimestamp(), updatedBy: state.user.email };
    if (!data.judul || !data.jenis) return toast('Judul dan jenis wajib diisi', 'error');
    if (!data.url) return toast('Link berkas harus diawali https://', 'error');
    try {
      if (data.jenis && !jenisAll.some((x) => norm(x) === norm(data.jenis))) await F.setDoc(C('master/jenisDokumen'), { items: F.arrayUnion(data.jenis), label: 'Jenis Dokumen Publik' }, { merge: true });
      if (d) { await F.updateDoc(C(`dokumen/${d.id}`), data); logAudit('dokumen', 'ubah', `Mengubah dokumen publik “${data.judul}”`, { targetId: d.id, changes: diff(d, data) }); }
      else { const ref = await F.addDoc(F.collection(F.db, 'dokumen'), { ...data, penulis: penulisNow(), createdAt: F.serverTimestamp() }); logAudit('dokumen', 'tambah', `Menambah dokumen publik “${data.judul}” (${data.jenis})`, { targetId: ref.id }); }
      m.close(); toast('Dokumen disimpan', 'success');
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
}
export { mediaKind };
