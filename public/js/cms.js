// Halaman publik "Profil Gampong", Infografis, panel Jadwal Sholat & Kegiatan Rutin, serta editornya di panel admin
import { APP } from './config.js';
import { F, ic, state, C, clean, desaName, desaJenis, jenisLabel, emptyBox, confirmDelete, can, logAudit, diff, insightsFromStats, pct } from './core.js';
import { esc, $, $$, norm, debounce, fmtDate, fmtNum, fmtRp, waLink, waNumber, normalizePhone, waFormat, toast, modal, confirmDialog, attachAutocomplete, compressImage, parseNum, fmtThousand, bindThousands } from './ui.js';
import { exportExcel } from './exporter.js';
import { readerPage, readMins } from './reader.js';
import { widgetCfg, registerKegiatanPanel } from './widgets.js';
import { richRender, bindRich, plainText, mediaEmbed, mediaThumb, parseMediaLines, mediaLinesText } from './rich.js';
import { prayerTimes, PRAYER_NAMES, DEFAULT_SHOLAT, fmtMin, nowMinutes, dateInTz, hijriDate } from './praytimes.js';

// ---------------------------------------------------------------- definisi halaman
const KELOMPOK_STRUKTUR = ['Pemerintah Gampong', 'Tuha Peut', 'Imeum Meunasah', 'Kepala Dusun', 'Tuha Lapan', 'Lembaga Adat', 'Lainnya'];
export const PAGES = [
  { key: 'profil', title: 'Profil {J}', icon: 'home', fields: [
    { k: 'ringkasan', label: 'Gambaran umum', type: 'textarea', rows: 6 },
    { k: 'luas', label: 'Luas wilayah (mis. 125 Ha)' }, { k: 'ketinggian', label: 'Ketinggian (mdpl)' },
    { k: 'batasUtara', label: 'Batas utara' }, { k: 'batasSelatan', label: 'Batas selatan' },
    { k: 'batasTimur', label: 'Batas timur' }, { k: 'batasBarat', label: 'Batas barat' },
    { k: 'jarakKecamatan', label: 'Jarak ke kantor camat' }, { k: 'jarakKabupaten', label: 'Jarak ke ibu kota kab/kota' },
    { k: 'gambar', label: 'Foto kantor / gampong', type: 'image' },
  ] },
  { key: 'sejarah', title: 'Sejarah', icon: 'book', fields: [{ k: 'isi', label: 'Sejarah singkat', type: 'textarea', rows: 12 }, { k: 'gambar', label: 'Foto', type: 'image' }] },
  { key: 'visimisi', title: 'Visi & Misi', icon: 'bulb', fields: [{ k: 'visi', label: 'Visi', type: 'textarea', rows: 3 }, { k: 'misi', label: 'Misi (satu per baris)', type: 'lines', rows: 7 }, { k: 'motto', label: 'Motto / semboyan' }] },
  { key: 'struktur', title: 'Struktur Organisasi', icon: 'users', fields: [{ k: 'bagan', label: 'Gambar bagan struktur (opsional)', type: 'image' }],
    list: { label: 'Aparatur / Pengurus', fields: [{ k: 'nama', label: 'Nama' }, { k: 'jabatan', label: 'Jabatan' }, { k: 'kelompok', label: 'Kelompok', suggest: KELOMPOK_STRUKTUR }, { k: 'hp', label: 'No. HP', type: 'phone' }, { k: 'foto', label: 'Foto', type: 'image' }] } },
  { key: 'lembaga', title: 'Lembaga {J}', icon: 'shield', list: { label: 'Lembaga', fields: [{ k: 'nama', label: 'Nama lembaga', suggest: ['Tuha Peut', 'PKK', 'Karang Taruna', 'LPM', 'BUMG / BUMDes', 'Posyandu', 'Majelis Taklim', 'Linmas', 'Kelompok Tani'] }, { k: 'ketua', label: 'Ketua' }, { k: 'hp', label: 'No. HP', type: 'phone' }, { k: 'deskripsi', label: 'Tugas / keterangan', type: 'textarea' }] } },
  { key: 'layanan', title: 'Layanan Administrasi', icon: 'file', fields: [{ k: 'jamLayanan', label: 'Jam layanan kantor (mis. Senin–Jumat 08.00–16.00)' }, { k: 'catatan', label: 'Catatan', type: 'textarea' }],
    list: { label: 'Jenis Layanan / Surat', fields: [{ k: 'nama', label: 'Jenis layanan', suggest: ['Surat Keterangan Domisili', 'Surat Keterangan Usaha', 'Surat Keterangan Tidak Mampu', 'Surat Pengantar KTP/KK', 'Surat Keterangan Kelahiran', 'Surat Keterangan Kematian', 'Surat Pindah', 'Surat Rekomendasi Nikah'] }, { k: 'syarat', label: 'Persyaratan (satu per baris)', type: 'textarea' }, { k: 'waktu', label: 'Lama proses' }, { k: 'biaya', label: 'Biaya' }] } },
  { key: 'apbdes', title: 'Transparansi Anggaran', icon: 'chart', fields: [{ k: 'tahun', label: 'Tahun anggaran' }, { k: 'catatan', label: 'Catatan', type: 'textarea' }],
    list: { label: 'Rincian APBG / APBDes', fields: [{ k: 'jenis', label: 'Jenis', suggest: ['Pendapatan', 'Belanja', 'Pembiayaan'] }, { k: 'uraian', label: 'Uraian' }, { k: 'anggaran', label: 'Anggaran (Rp)', type: 'number' }, { k: 'realisasi', label: 'Realisasi (Rp)', type: 'number' }] } },
  { key: 'potensi', title: 'Potensi & UMKM', icon: 'bulb', list: { label: 'Potensi / UMKM', fields: [{ k: 'nama', label: 'Nama' }, { k: 'kategori', label: 'Kategori', suggest: ['Pertanian', 'Perikanan', 'Peternakan', 'UMKM Kuliner', 'Kerajinan', 'Wisata', 'Jasa'] }, { k: 'deskripsi', label: 'Deskripsi', type: 'textarea' }, { k: 'kontak', label: 'Kontak WA', type: 'phone' }, { k: 'foto', label: 'Foto', type: 'image' }] } },
  { key: 'kontak', title: 'Kontak & Lokasi', icon: 'loc', fields: [{ k: 'alamat', label: 'Alamat kantor' }, { k: 'jam', label: 'Jam pelayanan' }, { k: 'telepon', label: 'No. WhatsApp', type: 'phone' }, { k: 'email', label: 'Email' }, { k: 'lat', label: 'Garis lintang (latitude), mis. 5.5483' }, { k: 'lng', label: 'Garis bujur (longitude), mis. 95.3238' }, { k: 'mapsUrl', label: 'Tautan Google Maps (opsional)' }] },
];
export const pageLabel = (p) => p.title.replace('{J}', jenisLabel());

// ---------------------------------------------------------------- PUBLIK: halaman profil
const empty = (p) => `<div class="empty">Halaman “${esc(pageLabel(p))}” belum diisi oleh admin.</div>`;
const has = (o) => o && Object.values(o).some((v) => (Array.isArray(v) ? v.length : v));
export function renderPubPage(key) {
  const p = PAGES.find((x) => x.key === key) || PAGES[0];
  const d = state.halaman[p.key] || {};
  const items = d.items || [];
  let body = '';
  if (p.key === 'profil') {
    const s = state.stats || {};
    const rows = [['Luas wilayah', d.luas], ['Ketinggian', d.ketinggian], ['Batas utara', d.batasUtara], ['Batas selatan', d.batasSelatan], ['Batas timur', d.batasTimur], ['Batas barat', d.batasBarat], ['Jarak ke kantor camat', d.jarakKecamatan], ['Jarak ke ibu kota', d.jarakKabupaten], ['Jumlah penduduk', s.penduduk ? `${fmtNum(s.penduduk)} jiwa` : ''], ['Jumlah KK', s.kk ? fmtNum(s.kk) : ''], ['Jumlah dusun', s.dusun ? fmtNum(s.dusun) : ''], [state.config.kepalaDesa ? (jenisLabel() === 'Gampong' ? 'Keuchik' : 'Kepala Desa') : '', state.config.kepalaDesa]].filter((r) => r[0] && r[1]);
    body = (d.gambar ? `<img class="article-img" src="${esc(d.gambar)}" alt="">` : '') + (d.ringkasan ? `<div class="article-body rich">${richRender(d.ringkasan)}</div>` : '') + (rows.length ? `<dl class="detail profile-dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '');
    if (!d.ringkasan && !rows.length) body = empty(p);
  } else if (p.key === 'sejarah') {
    body = d.isi ? `${d.gambar ? `<img class="article-img" src="${esc(d.gambar)}" alt="">` : ''}<div class="article-body rich">${richRender(d.isi)}</div>` : empty(p);
  } else if (p.key === 'visimisi') {
    const misi = String(d.misi || '').split('\n').map((x) => x.trim()).filter(Boolean);
    body = d.visi || misi.length ? `${d.visi ? `<div class="visi"><small>VISI</small><p>${esc(d.visi)}</p></div>` : ''}${misi.length ? `<h3>Misi</h3><ol class="misi">${misi.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>` : ''}${d.motto ? `<p class="motto">“${esc(d.motto)}”</p>` : ''}` : empty(p);
  } else if (p.key === 'struktur') {
    const groups = [...new Set(items.map((x) => x.kelompok || 'Pengurus'))];
    body = (d.bagan ? `<img class="article-img" src="${esc(d.bagan)}" alt="Bagan struktur">` : '') + (items.length ? groups.map((g) => `<h3 class="detail-h">${esc(g)}</h3><div class="people">${items.filter((x) => (x.kelompok || 'Pengurus') === g).map((x) => `<div class="person">${x.foto ? `<img src="${esc(x.foto)}" alt="">` : `<span class="avatar lg">${esc((x.nama || '?').slice(0, 1))}</span>`}<b>${esc(x.nama)}</b><small>${esc(x.jabatan || '')}</small>${waNumber(x.hp) ? `<a class="wa-link small" target="_blank" rel="noopener" href="${esc(waLink(x.hp))}">${ic('wa')} Hubungi</a>` : ''}</div>`).join('')}</div>`).join('') : (d.bagan ? '' : empty(p)));
  } else if (p.key === 'lembaga') {
    body = items.length ? `<div class="cards">${items.map((x) => `<div class="info-card"><div class="info-body"><h3>${esc(x.nama)}</h3>${x.ketua ? `<p class="muted small">Ketua: ${esc(x.ketua)}</p>` : ''}<p class="excerpt">${esc(x.deskripsi || '')}</p>${waNumber(x.hp) ? `<a class="btn btn-sm btn-wa" target="_blank" rel="noopener" href="${esc(waLink(x.hp))}">${ic('wa')} Hubungi</a>` : ''}</div></div>`).join('')}</div>` : empty(p);
  } else if (p.key === 'layanan') {
    body = (d.jamLayanan ? `<div class="event-box"><span>${ic('cal')} ${esc(d.jamLayanan)}</span></div>` : '') + (d.catatan ? `<div class="rich">${richRender(d.catatan)}</div>` : '') + (items.length ? `<div class="layanan">${items.map((x) => `<details class="fieldset"><summary>${esc(x.nama)}</summary><div class="pad"><b>Persyaratan:</b><ul>${String(x.syarat || '').split('\n').filter((l) => l.trim()).map((l) => `<li>${esc(l.replace(/^[-•\d.]+\s*/, ''))}</li>`).join('')}</ul>${x.waktu ? `<p class="small">⏱ Lama proses: ${esc(x.waktu)}</p>` : ''}${x.biaya ? `<p class="small">💰 Biaya: ${esc(x.biaya)}</p>` : ''}</div></details>`).join('')}</div>` : empty(p)) + (state.config.telepon ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(waLink(state.config.telepon, 'Assalamu\'alaikum, saya ingin bertanya tentang layanan administrasi.'))}">${ic('wa')} Tanya via WhatsApp</a>` : '');
  } else if (p.key === 'apbdes') {
    const sum = (j, f) => items.filter((x) => norm(x.jenis) === norm(j)).reduce((a, x) => a + (Number(x[f]) || 0), 0);
    const jenis = [...new Set(items.map((x) => x.jenis || 'Lainnya'))];
    body = items.length ? `${d.tahun ? `<p class="eyebrow">Tahun Anggaran ${esc(d.tahun)}</p>` : ''}<div class="stat-grid">${['Pendapatan', 'Belanja', 'Pembiayaan'].map((j) => sum(j, 'anggaran') ? `<div class="stat"><div><span class="stat-label">${j}</span><b class="stat-val">${fmtRp(sum(j, 'anggaran'))}</b><small class="muted">Realisasi ${fmtRp(sum(j, 'realisasi'))} (${pct(sum(j, 'realisasi'), sum(j, 'anggaran'))}%)</small></div></div>` : '').join('')}</div>
      ${jenis.map((j) => `<h3 class="detail-h">${esc(j)}</h3><div class="table-wrap"><table class="table"><thead><tr><th>Uraian</th><th style="text-align:right">Anggaran</th><th style="text-align:right">Realisasi</th><th style="text-align:right">%</th></tr></thead><tbody>${items.filter((x) => (x.jenis || 'Lainnya') === j).map((x) => `<tr><td>${esc(x.uraian)}</td><td style="text-align:right">${fmtRp(x.anggaran)}</td><td style="text-align:right">${fmtRp(x.realisasi)}</td><td style="text-align:right">${pct(Number(x.realisasi) || 0, Number(x.anggaran) || 0)}%</td></tr>`).join('')}</tbody></table></div>`).join('')}${d.catatan ? `<div class="muted rich">${richRender(d.catatan)}</div>` : ''}` : empty(p);
  } else if (p.key === 'potensi') {
    body = items.length ? `<div class="cards">${items.map((x) => `<div class="info-card">${x.foto ? `<div class="info-img"><img src="${esc(x.foto)}" alt=""></div>` : ''}<div class="info-body">${x.kategori ? `<div class="info-meta"><span class="badge">${esc(x.kategori)}</span></div>` : ''}<h3>${esc(x.nama)}</h3><p class="excerpt">${esc(x.deskripsi || '')}</p>${waNumber(x.kontak) ? `<a class="btn btn-sm btn-wa" target="_blank" rel="noopener" href="${esc(waLink(x.kontak, `Halo, saya tertarik dengan ${x.nama}.`))}">${ic('wa')} Hubungi</a>` : ''}</div></div>`).join('')}</div>` : empty(p);
  } else if (p.key === 'kontak') {
    const lat = Number(d.lat), lng = Number(d.lng);
    const map = lat && lng ? `<iframe class="map" loading="lazy" title="Peta lokasi" src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.007}%2C${lng + 0.01}%2C${lat + 0.007}&layer=mapnik&marker=${lat}%2C${lng}"></iframe>` : '';
    const rows = [['Alamat', d.alamat || state.config.alamatKantor], ['Jam pelayanan', d.jam], ['Email', d.email || state.config.emailDesa]].filter((r) => r[1]);
    const tel = d.telepon || state.config.telepon;
    body = rows.length || map || tel ? `<dl class="detail profile-dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl><div class="row-gap">${waNumber(tel) ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(waLink(tel))}">${ic('wa')} ${esc(tel)}</a>` : ''}${d.mapsUrl ? `<a class="btn btn-ghost" target="_blank" rel="noopener" href="${esc(d.mapsUrl)}">${ic('loc')} Buka di Google Maps</a>` : lat && lng ? `<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${lat},${lng}">${ic('loc')} Petunjuk arah</a>` : ''}</div>${map}` : empty(p);
  }
  return `<div class="page-layout">
    <aside class="page-nav">${PAGES.map((x) => `<a href="#/profil/${x.key}" class="${x.key === p.key ? 'active' : ''}">${ic(x.icon)} ${esc(pageLabel(x))}</a>`).join('')}<a href="#/infografis">${ic('chart')} Infografis Penduduk</a></aside>
    <article class="section article page-body"><span class="eyebrow">Profil ${esc(`${desaJenis()} ${desaName()}`.trim())}</span><h1>${esc(pageLabel(p))}</h1>${body}
      ${d.updatedAt ? `<p class="muted small">Diperbarui ${esc(fmtDate(d.updatedAt))}</p>` : ''}</article></div>`;
}

// ---------------------------------------------------------------- PUBLIK: infografis
const CAT_LABEL = { kelompokUmur: 'Kelompok Umur', jk: 'Jenis Kelamin', dusun: 'Penduduk per Dusun', agama: 'Agama', pendidikan: 'Pendidikan', pekerjaan: 'Pekerjaan', statusKawin: 'Status Perkawinan', sektor: 'Sektor Mata Pencaharian', profesi: 'Profesi', shdk: 'Hubungan Keluarga', golDarah: 'Golongan Darah', bansos: 'Penerima Bansos', desil: 'Desil Kesejahteraan', bpjs: 'Kepesertaan BPJS', listrik: 'Daya Listrik', air: 'Sumber Air', sanitasi: 'Sanitasi', rumah: 'Kepemilikan Rumah', vaksin: 'Vaksinasi', gizi: 'Status Gizi', disabilitas: 'Disabilitas', penyakit: 'Penyakit Kronis', skala: 'Skala Usaha', kelompok: 'Kelompok Usaha' };
function barsPub(rows, total) {
  const peak = Math.max(1, ...rows.map((r) => r.n));
  return `<div class="bars">${rows.map((r) => `<div class="bar-row"><span class="bar-label" title="${esc(r.v)}">${esc(r.v)}</span><span class="bar-track"><span class="bar-fill" style="width:${(r.n / peak) * 100}%"></span></span><span class="bar-val">${fmtNum(r.n)}<small>${String(pct(r.n, total)).replace('.', ',')}%</small></span></div>`).join('')}</div>`;
}
export function renderInfografis() {
  const s = state.stats || {};
  if (!s.penduduk) return `<section class="section narrow">${emptyBox('Infografis penduduk belum tersedia.')}</section>`;
  const ins = insightsFromStats(s);
  const pyr = s.piramida || [];
  const peak = Math.max(1, ...pyr.map((x) => Math.max(x.l, x.p)));
  return `<section class="section">
    <span class="eyebrow">Data agregat • diperbarui ${esc(fmtDate(s.updatedAt, true))}</span>
    <h1>Infografis Penduduk ${esc(desaJenis())} ${esc(desaName())}</h1>
    <p class="muted">Ringkasan statistik penduduk aktif. Data pribadi tidak ditampilkan; nilai dengan jumlah sangat kecil digabung demi privasi.</p>
    <div class="stat-grid">${[['Penduduk', s.penduduk, 'jiwa'], ['Kepala Keluarga', s.kk, `${String(s.rataKeluarga || 0).replace('.', ',')} jiwa/KK`], ['Laki-laki', s.laki, `${pct(s.laki, s.penduduk)}%`], ['Perempuan', s.perempuan, `${pct(s.perempuan, s.penduduk)}%`], ['Usia Produktif', s.produktif, `${pct(s.produktif, s.penduduk)}%`], ['Dusun', s.dusun, 'wilayah']].map(([l, v, sub]) => `<div class="stat"><div><span class="stat-label">${l}</span><b class="stat-val">${fmtNum(v)}</b><small class="muted">${esc(sub)}</small></div></div>`).join('')}</div>
    ${ins.length ? `<div class="panel"><h3>${ic('bulb')} Insight</h3><div class="insight-list">${ins.map((x) => `<div class="insight">${ic(x.icon)}<p>${esc(x.text)}</p></div>`).join('')}</div></div>` : ''}
    <div class="panel-grid two">
      ${pyr.length ? `<div class="panel"><h3>Piramida Penduduk</h3><div class="pyramid"><div class="pyr-head"><span>Laki-laki</span><span></span><span>Perempuan</span></div>${[...pyr].reverse().map((x) => `<div class="pyr-row"><span class="pyr-l"><i style="width:${(x.l / peak) * 100}%"></i><b>${x.l}</b></span><span class="pyr-g">${esc(x.g)}</span><span class="pyr-p"><i style="width:${(x.p / peak) * 100}%"></i><b>${x.p}</b></span></div>`).join('')}</div></div>` : ''}
      ${Object.entries(s.breakdown || {}).filter(([, rows]) => rows.length).map(([k, rows]) => `<div class="panel"><h3>${esc(CAT_LABEL[k] || k)}</h3>${barsPub(rows, s.penduduk)}</div>`).join('')}
    </div>
  </section>`;
}

// ---------------------------------------------------------------- PUBLIK: Portal Data (non-sensitif, agregat)
const PALETTE = ['var(--brand)', 'var(--brand-accent)', '#4f46e5', '#db2777', '#0284c7', '#65a30d', '#7c3aed', '#dc2626', '#0d9488', '#ca8a04', '#475569', '#9333ea'];
const CAT_ICON = { kelompokUmur: 'users', jk: 'users', dusun: 'map', agama: 'moon', pendidikan: 'book', pekerjaan: 'file', statusKawin: 'home', sektor: 'chart', profesi: 'file', golDarah: 'shield' };
// Diagram donat SVG
export function donut(rows, { size = 160, center = '', sub = '', legend = true } = {}) {
  const total = rows.reduce((a, r) => a + (r.n || 0), 0);
  if (!total) return '<div class="empty">Belum ada data</div>';
  const R = 15.915; let acc = 0;
  const segs = rows.map((r, i) => { const v = (r.n / total) * 100; const seg = `<circle r="${R}" cx="21" cy="21" fill="none" style="stroke:${PALETTE[i % PALETTE.length]}" stroke-width="6" stroke-dasharray="${v} ${100 - v}" stroke-dashoffset="${25 - acc}"><title>${esc(r.v)}: ${r.n}</title></circle>`; acc += v; return seg; }).join('');
  return `<div class="donut-wrap"><div class="donut" style="width:${size}px;height:${size}px"><svg viewBox="0 0 42 42" role="img" aria-label="Diagram donat"><circle r="${R}" cx="21" cy="21" fill="none" stroke="var(--surface-2)" stroke-width="6"></circle>${segs}</svg>${center ? `<div class="donut-c"><b>${esc(center)}</b><small>${esc(sub)}</small></div>` : ''}</div>
    ${legend ? `<ul class="legend">${rows.slice(0, 8).map((r, i) => `<li><i style="background:${PALETTE[i % PALETTE.length]}"></i><span>${esc(r.v)}</span><b>${fmtNum(r.n)}</b><small>${String(pct(r.n, total)).replace('.', ',')}%</small></li>`).join('')}${rows.length > 8 ? `<li class="muted small">+${rows.length - 8} lainnya</li>` : ''}</ul>` : ''}</div>`;
}
const portalCats = () => Object.entries(state.stats?.breakdown || {}).filter(([, rows]) => rows.length);
export function dataPortalCards() {
  const s = state.stats || {}; const cats = portalCats();
  if (!cats.length) return '<div class="empty">Data publik belum tersedia.</div>';
  return `<div class="portal-grid">${cats.map(([k, rows]) => {
    const top = rows.slice(0, 3); const peak = Math.max(1, ...top.map((r) => r.n));
    return `<a class="portal-card" href="#/data/${k}"><div class="pc-head"><span class="pc-ic">${ic(CAT_ICON[k] || 'chart')}</span><div><b>${esc(CAT_LABEL[k] || k)}</b><small>${rows.length} kategori</small></div>${ic('chev', 'pc-go')}</div>
      <ul class="pc-top">${top.map((r, i) => `<li><span>${esc(r.v)}</span><b>${fmtNum(r.n)}</b><i style="width:${(r.n / peak) * 100}%;background:${PALETTE[i]}"></i></li>`).join('')}</ul>
      <small class="pc-foot">Dari ${fmtNum(s.penduduk)} penduduk aktif</small></a>`;
  }).join('')}<a class="portal-card cta" href="#/infografis"><span class="pc-ic">${ic('chart')}</span><b>Infografis lengkap</b><small class="muted">Piramida penduduk, insight & seluruh kategori</small></a></div>`;
}
export function renderDataPortal(key) {
  const s = state.stats || {}; const cats = portalCats();
  if (!s.penduduk) return '<section class="section"><div class="empty">Data publik belum tersedia.</div></section>';
  const head = `<span class="eyebrow">${ic('db')} Portal Data Publik • diperbarui ${esc(fmtDate(s.updatedAt, true))}</span>`;
  const chips = `<div class="chips">${cats.map(([k]) => `<a class="chip ${k === key ? 'active' : ''}" href="#/data/${k}">${esc(CAT_LABEL[k] || k)}</a>`).join('')}<a class="chip" href="#/infografis">Infografis lengkap</a></div>`;
  if (!key || !s.breakdown?.[key]) {
    return `<section class="section">${head}<h1>Data Publik ${esc(`${desaJenis()} ${desaName()}`.trim())}</h1>
      <p class="muted">Statistik agregat penduduk aktif yang dapat diakses semua warga. Data pribadi (nama, NIK, alamat) tidak pernah ditampilkan.</p>
      <div class="stat-grid">${[['Penduduk', s.penduduk, 'jiwa'], ['Kepala Keluarga', s.kk, 'KK'], ['Laki-laki', s.laki, `${String(pct(s.laki, s.penduduk)).replace('.', ',')}%`], ['Perempuan', s.perempuan, `${String(pct(s.perempuan, s.penduduk)).replace('.', ',')}%`], ['Usia Produktif', s.produktif, '15–64 th'], ['Lansia', s.lansia, '60+ th'], ['Balita', s.balita, '0–5 th'], ['Dusun', s.dusun, 'wilayah']].map(([l, v, sub]) => `<div class="stat"><div><span class="stat-label">${l}</span><b class="stat-val">${fmtNum(v)}</b><small class="muted">${esc(sub)}</small></div></div>`).join('')}</div>
      <h2 style="margin-top:8px">Pilih kategori data</h2>${dataPortalCards()}</section>`;
  }
  const rows = s.breakdown[key]; const total = rows.reduce((a, r) => a + r.n, 0);
  const peak = Math.max(1, ...rows.map((r) => r.n));
  return `<section class="section">${head}
    <a href="#/data" class="link">← Semua data</a>
    <h1>${esc(CAT_LABEL[key] || key)}</h1>${chips}
    <div class="viz-grid">
      <div class="panel viz"><h3>Komposisi</h3>${donut(rows, { size: 200, center: fmtNum(total), sub: 'jiwa' })}</div>
      <div class="panel viz viz-wide"><h3>Rincian</h3>
        <div class="table-wrap"><table class="table"><thead><tr><th>No</th><th>${esc(CAT_LABEL[key] || key)}</th><th style="text-align:right">Jumlah</th><th style="text-align:right">Persentase</th><th style="width:34%"></th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td><i class="dot" style="background:${PALETTE[i % PALETTE.length]}"></i> ${esc(r.v)}</td><td style="text-align:right"><b>${fmtNum(r.n)}</b></td><td style="text-align:right">${String(pct(r.n, total)).replace('.', ',')}%</td><td><span class="bar-track"><span class="bar-fill" style="width:${(r.n / peak) * 100}%;background:${PALETTE[i % PALETTE.length]}"></span></span></td></tr>`).join('')}
        <tr class="total-row"><td></td><td>Total</td><td style="text-align:right">${fmtNum(total)}</td><td style="text-align:right">100%</td><td></td></tr></tbody></table></div>
        <div class="row-gap"><button class="btn btn-ghost btn-sm" data-dl-cat="${esc(key)}">${ic('download')} Unduh tabel (Excel)</button></div>
      </div>
    </div>
    <p class="muted small">Sumber: data kependudukan ${esc(`${desaJenis()} ${desaName()}`.trim())}. Nilai dengan jumlah sangat kecil digabung menjadi “Lainnya” untuk melindungi privasi.</p>
  </section>`;
}
export function bindDataPortal() {
  $$('[data-dl-cat]').forEach((b) => b.onclick = () => {
    const k = b.dataset.dlCat; const rows = state.stats?.breakdown?.[k] || []; const total = rows.reduce((a, r) => a + r.n, 0);
    exportExcel(`Data_${CAT_LABEL[k] || k}_${desaName()}`, [{ name: CAT_LABEL[k] || k, title: `${CAT_LABEL[k] || k} — ${desaJenis()} ${desaName()}`, head: ['No', CAT_LABEL[k] || k, 'Jumlah', 'Persentase'], body: [...rows.map((r, i) => [i + 1, r.v, r.n, `${pct(r.n, total)}%`]), ['', 'Total', total, '100%']] }]).catch((e) => toast(e.message, 'error'));
  });
}

// ---------------------------------------------------------------- PUBLIK: panel jadwal sholat
const sholatCfg = () => ({ ...DEFAULT_SHOLAT, ...(state.config.sholat || {}) });
export function sholatPanel() {
  const cfg = sholatCfg();
  const today = dateInTz(cfg.tz);
  const t = prayerTimes(today, cfg);
  return `<div class="side-panel sholat" id="sholat-panel">
    <div class="sp-head">${ic('moon')}<div><b>Jadwal Sholat</b><small>${esc(cfg.kota || '')}</small></div></div>
    <div class="sp-date"><b>${esc(fmtDate(today))}</b><small>${esc(hijriDate(today))}</small></div>
    <div class="sp-next" id="sp-next"></div>
    <ul class="sp-times">${PRAYER_NAMES.map(([k, l]) => `<li data-pr="${k}"><span>${l}</span><b>${fmtMin(t[k])}</b></li>`).join('')}</ul>
    <p class="muted tiny">Kemenag RI (Subuh 20°, Isya 18°, ihtiyat ${cfg.ihtiyat} mnt). Selisih ±2 menit dapat terjadi.</p>
  </div>`;
}
function tickSholat() {
  const el = $('#sholat-panel'); if (!el) return;
  const cfg = sholatCfg(); const t = prayerTimes(dateInTz(cfg.tz), cfg); const now = nowMinutes(cfg.tz);
  const order = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  let next = order.find((k) => t[k] > now); let mins;
  if (next) mins = t[next] - now; else { next = 'subuh'; const tm = prayerTimes(new Date(dateInTz(cfg.tz).getTime() + 864e5), cfg); mins = tm.subuh + 1440 - now; }
  const label = PRAYER_NAMES.find((x) => x[0] === next)[1];
  const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  $('#sp-next', el).innerHTML = `<small>Menuju ${label}</small><b>${h ? `${h} jam ` : ''}${m} menit</b>`;
  const cur = [...order].reverse().find((k) => t[k] <= now);
  $$('[data-pr]', el).forEach((li) => { li.classList.toggle('next', li.dataset.pr === next); li.classList.toggle('now', li.dataset.pr === cur); });
}

// ---------------------------------------------------------------- PUBLIK: panel kegiatan rutin
export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
function kegiatanToday(k, d) {
  const hari = k.hari || [];
  if (hari.includes('Setiap Hari')) return true;
  if (!hari.includes(HARI[d.getDay()])) return false;
  if (!k.minggu || k.minggu === 'Setiap minggu') return true;
  const nth = Math.ceil(d.getDate() / 7);
  return k.minggu === `Minggu ke-${nth}`;
}
// part: 'hari' = Kegiatan Rutin hari ini, 'lain' = Kegiatan Lainnya, kosong = keduanya (pratinjau pengaturan)
export function kegiatanPanel(part = '') {
  const cfg = sholatCfg();
  const d = dateInTz(cfg.tz);
  const list = state.kegiatan.filter((k) => k.aktif !== false);
  const today = list.filter((k) => kegiatanToday(k, d));
  const others = list.filter((k) => !today.includes(k));
  // baris ringkas: jam · nama · hari/tempat (PJ & WA tetap ada di halaman detail)
  const row = (k, isToday) => `<li class="${isToday ? 'today' : ''}" data-link="#/kegiatan/${esc(k.id)}" tabindex="0" title="${esc(k.nama)} — lihat detail"><span class="kg-time">${esc(k.waktu || '—')}</span><span class="kg-txt"><b>${esc(k.nama)}${k.media?.length ? ` <span class="kg-media" title="Ada foto/video">${ic('image')}</span>` : ''}</b><small>${esc([isToday ? '' : (k.hari || []).join(', ') + (k.minggu && k.minggu !== 'Setiap minggu' ? ` (${k.minggu})` : ''), k.tempat].filter(Boolean).join(' • '))}</small></span></li>`;
  const g = widgetCfg().kegiatan;
  const sp = Math.max(4, Math.min(120, Number(g.kecepatan) || 18)), dir = g.arah === 'bawah' ? 'bawah' : 'atas';
  const scroller = (rows, label) => (g.gerak !== false && rows.length > 1
    ? `<div class="kg-viewport sp-fill" data-speed="${sp}" data-dir="${dir}" tabindex="0" aria-label="${esc(label)} bergulir otomatis. Arahkan kursor untuk menjeda."><div class="kg-track"><ul class="kg-list">${rows.join('')}</ul></div></div>`
    : `<div class="sp-fill sp-static"><ul class="kg-list">${rows.join('')}</ul></div>`);
  const head = (icon, title, sub, href, more) => `<div class="sp-head">${ic(icon)}<div><b>${title}</b><small>${sub}</small></div>${href ? `<a class="sp-more" href="${href}" title="${esc(more)}" aria-label="${esc(more)}">${ic('chev')}</a>` : ''}</div>`;
  const hari = `<div class="side-panel kegiatan sp-card">
    ${head('repeat', `Kegiatan Rutin ${esc(jenisLabel())}`, `Hari ini — ${HARI[d.getDay()]}`, '#/kegiatan', 'Semua kegiatan')}
    ${today.length ? scroller(today.map((k) => row(k, true)), 'Kegiatan rutin hari ini') : `<p class="muted small kg-empty">${list.length ? 'Tidak ada kegiatan rutin hari ini.' : 'Belum ada kegiatan rutin yang dijadwalkan.'}</p>`}
  </div>`;
  const lain = others.length ? `<div class="side-panel kegiatan-lain sp-card">
    ${head('cal', 'Kegiatan Lainnya', `${others.length} kegiatan di hari lain`, '#/kegiatan', 'Semua kegiatan')}
    ${scroller(others.map((k) => row(k, false)), 'Kegiatan lainnya')}
  </div>` : '';
  return part === 'hari' ? hari : part === 'lain' ? lain : hari + lain;
}
registerKegiatanPanel(() => kegiatanPanel());
const kgJadwal = (k) => [(k.hari || []).join(', ') + (k.minggu && k.minggu !== 'Setiap minggu' ? ` (${k.minggu})` : ''), k.waktu].filter(Boolean).join(' • ');
// PUBLIK: daftar & detail kegiatan rutin (tata baca sama dengan Papan Informasi)
export function renderKegiatanPublic(id) {
  const list = state.kegiatan.filter((k) => k.aktif !== false);
  if (!id) {
    const d = dateInTz(sholatCfg().tz);
    return `<section class="section"><span class="eyebrow">${ic('repeat')} Agenda warga</span><h1>Kegiatan Rutin ${esc(jenisLabel())}</h1><p class="muted">Pengajian, wirid yasin, posyandu, gotong royong, dan kegiatan rutin warga lainnya.</p>
      ${list.length ? `<div class="cards">${list.map((k) => { const th = (k.media || []).map((m) => mediaThumb(m.url)).find(Boolean); const today = kegiatanToday(k, d); return `<article class="info-card">${th ? `<a href="#/kegiatan/${esc(k.id)}" class="info-img"><img loading="lazy" src="${esc(th)}" alt=""></a>` : ''}<div class="info-body"><div class="info-meta"><span class="badge">${esc(k.kategori || 'Kegiatan')}</span>${today ? '<span class="badge badge-ok">Hari ini</span>' : ''}</div><h3><a href="#/kegiatan/${esc(k.id)}">${esc(k.nama)}</a></h3><p class="muted small">${ic('cal')} ${esc(kgJadwal(k))}${k.tempat ? ` • ${ic('loc')} ${esc(k.tempat)}` : ''}</p><p class="excerpt">${esc(plainText(k.keterangan || '').slice(0, 140))}</p><div class="info-actions"><a class="btn btn-sm btn-ghost" href="#/kegiatan/${esc(k.id)}">Lihat detail</a></div></div></article>`; }).join('')}</div>` : emptyBox('Belum ada kegiatan rutin.')}</section>`;
  }
  const k = list.find((x) => x.id === id);
  if (!k) return `<section class="section reader">${emptyBox('Kegiatan tidak ditemukan atau sudah tidak aktif.')}</section>`;
  const msg = [`*KEGIATAN RUTIN — ${desaJenis().toUpperCase()} ${desaName().toUpperCase()}*`, '', `*${k.nama}*`, `📅 ${kgJadwal(k)}`, k.tempat ? `📍 ${k.tempat}` : '', k.pj ? `👤 PJ: ${k.pj}${k.hp ? ' (' + k.hp + ')' : ''}` : '', '', plainText(k.keterangan || '')].filter((x, i, a) => x || a[i - 1]).join('\n');
  const share = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  return readerPage({
    back: { href: '#/kegiatan', label: 'Kegiatan Rutin' },
    badges: `<span class="badge">${esc(k.kategori || 'Kegiatan Rutin')}</span>${kegiatanToday(k, dateInTz(sholatCfg().tz)) ? '<span class="badge badge-ok">Hari ini</span>' : ''}`,
    title: k.nama, mins: k.keterangan ? readMins(plainText(k.keterangan)) : 0, author: k.pj ? `PJ: ${k.pj}` : '',
    event: [{ icon: 'cal', text: kgJadwal(k) }, k.tempat && { icon: 'loc', text: k.tempat }, k.pj && { icon: 'users', text: `PJ: ${k.pj}` }],
    body: k.keterangan ? `<div class="article-body rich">${richRender(k.keterangan)}</div>` : '<p class="muted">Belum ada keterangan tambahan untuk kegiatan ini.</p>',
    media: (k.media || []).length ? k.media.map(mediaEmbed).join('') : '',
    actions: `${waNumber(k.hp) ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(waLink(k.hp, `Assalamu'alaikum, saya ingin bertanya tentang kegiatan ${k.nama}.`))}">${ic('wa')} Hubungi PJ</a>` : ''}<a class="btn btn-ghost" target="_blank" rel="noopener" href="${esc(share)}">${ic('send')} Bagikan</a>`,
    share: { href: share, label: 'Bagikan kegiatan' },
    othersTitle: 'Kegiatan lainnya', others: list.filter((x) => x.id !== k.id).slice(0, 4).map((x) => ({ href: `#/kegiatan/${x.id}`, title: x.nama, sub: kgJadwal(x) })),
  });
}

export function startPublicTickers() {
  if ($('#sholat-panel')) { tickSholat(); state.timers.push(setInterval(tickSholat, 30e3)); }
}

// ================================================================ ADMIN: editor Profil Gampong
let profilTab = 'profil';
export function viewProfilAdmin(main) {
  state.view = 'form';
  const p = PAGES.find((x) => x.key === profilTab) || PAGES[0];
  const d = structuredClone(state.halaman[p.key] || {});
  d.items = d.items || [];
  const fieldHtml = (f, val, name) => {
    const v = val ?? '';
    if (f.type === 'textarea' || f.type === 'lines') return `<label class="field span-2"><span>${esc(f.label)}</span><textarea name="${name}" rows="${f.rows || 3}" ${f.type === 'textarea' && !name.startsWith('items.') && f.k !== 'syarat' ? 'data-rich' : ''}>${esc(v)}</textarea></label>`;
    if (f.type === 'image') return `<div class="field span-2"><span>${esc(f.label)}</span><div class="img-pick"><div class="img-prev">${v ? `<img src="${esc(v)}" alt="">` : ''}</div><label class="btn btn-ghost btn-sm">${ic('upload')} Pilih<input type="file" accept="image/*" data-img="${name}" hidden></label><button type="button" class="btn btn-ghost btn-sm" data-noimg="${name}">Hapus</button><input type="hidden" name="${name}" value="${esc(v)}"></div></div>`;
    if (f.type === 'number') return `<label class="field"><span>${esc(f.label)}</span><input name="${name}" value="${esc(fmtThousand(v))}" data-num placeholder="0"></label>`;
    return `<label class="field"><span>${esc(f.label)}</span><input name="${name}" value="${esc(v)}" ${f.type === 'phone' ? 'type="tel"' : ''} ${f.suggest ? `data-suggest="${esc(JSON.stringify(f.suggest))}"` : ''}></label>`;
  };
  main.innerHTML = `
  <div class="tabs">${PAGES.map((x) => `<button class="tab ${x.key === p.key ? 'active' : ''}" data-tab="${x.key}">${ic(x.icon)} ${esc(pageLabel(x))}</button>`).join('')}</div>
  <form class="panel" id="pg-form" data-guard>
    <div class="master-head"><h3>${esc(pageLabel(p))}</h3><a class="btn btn-ghost btn-sm" href="#/profil/${p.key}" target="_blank">${ic('ext')} Lihat halaman publik</a></div>
    ${p.fields ? `<div class="form-grid">${p.fields.map((f) => fieldHtml(f, d[f.k], f.k)).join('')}</div>` : ''}
    ${p.list ? `<h4 class="detail-h">${esc(p.list.label)}</h4><div id="pg-items">${d.items.map((it, i) => `<div class="list-item" data-i="${i}"><div class="li-head"><b>#${i + 1} ${esc(it.nama || it.uraian || '')}</b><span><button type="button" class="icon-btn" data-up="${i}" ${i ? '' : 'disabled'}>↑</button><button type="button" class="icon-btn danger" data-rm="${i}">${ic('trash')}</button></span></div><div class="form-grid">${p.list.fields.map((f) => fieldHtml(f, it[f.k], `items.${i}.${f.k}`)).join('')}</div></div>`).join('')}</div>
      <button type="button" class="btn btn-ghost" id="pg-add">${ic('plus')} Tambah ${esc(p.list.label.toLowerCase())}</button>` : ''}
    <div class="sticky-actions"><span class="muted small">${d.updatedAt ? `Terakhir disimpan ${esc(fmtDate(d.updatedAt, true))}${d.updatedBy ? ' oleh ' + esc(d.updatedBy) : ''}` : 'Belum pernah disimpan'}</span><span class="spacer"></span><button class="btn btn-primary">${ic('check')} Simpan</button></div>
  </form>`;
  $$('[data-tab]', main).forEach((b) => b.onclick = () => { profilTab = b.dataset.tab; viewProfilAdmin(main); });
  const form = $('#pg-form');
  bindThousands(form); bindRich(form);
  $$('[data-suggest]', form).forEach((inp) => attachAutocomplete(inp, { source: JSON.parse(inp.dataset.suggest), smallList: 12 }));
  $$('[data-img]', form).forEach((inp) => inp.onchange = async () => {
    try {
      const url = await compressImage(inp.files[0], inp.dataset.img.startsWith('items.') ? 420 : 1000, 0.75);
      form.elements[inp.dataset.img].value = url;
      inp.closest('.img-pick').querySelector('.img-prev').innerHTML = `<img src="${url}" alt="">`;
    } catch (e) { toast(e.message, 'error'); }
  });
  $$('[data-noimg]', form).forEach((b) => b.onclick = () => { form.elements[b.dataset.noimg].value = ''; b.closest('.img-pick').querySelector('.img-prev').innerHTML = ''; });
  const collect = () => {
    const out = {};
    p.fields?.forEach((f) => { out[f.k] = f.type === 'number' ? parseNum(form.elements[f.k].value) : form.elements[f.k].value.trim(); });
    if (p.list) out.items = d.items.map((_, i) => Object.fromEntries(p.list.fields.map((f) => { let v = form.elements[`items.${i}.${f.k}`].value.trim(); if (f.type === 'number') v = parseNum(v); if (f.type === 'phone') v = normalizePhone(v); return [f.k, v]; })));
    return out;
  };
  const keep = () => { const c = collect(); Object.assign(d, c); state.halaman[p.key] = { ...(state.halaman[p.key] || {}), ...c, items: c.items || d.items }; };
  $('#pg-add', form)?.addEventListener('click', () => { keep(); d.items.push({}); state.halaman[p.key] = { ...state.halaman[p.key], items: d.items }; viewProfilAdmin(main); });
  $$('[data-rm]', form).forEach((b) => b.onclick = async () => { keep(); if (!await confirmDelete('Hapus baris ini? (Klik Simpan untuk menerapkan)')) return; d.items.splice(+b.dataset.rm, 1); state.halaman[p.key] = { ...state.halaman[p.key], items: d.items }; viewProfilAdmin(main); });
  $$('[data-up]', form).forEach((b) => b.onclick = () => { keep(); const i = +b.dataset.up; [d.items[i - 1], d.items[i]] = [d.items[i], d.items[i - 1]]; state.halaman[p.key] = { ...state.halaman[p.key], items: d.items }; viewProfilAdmin(main); });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = collect();
    const size = JSON.stringify(data).length;
    if (size > 950_000) return toast('Data terlalu besar (gambar terlalu banyak). Kurangi jumlah/ukuran foto.', 'error');
    try {
      const before = (await F.getDoc(C(`halaman/${p.key}`))).data() || {};
      await F.setDoc(C(`halaman/${p.key}`), { ...data, updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
      logAudit('profil', 'ubah', `Memperbarui halaman ${pageLabel(p)}`, { target: pageLabel(p), changes: diff(before, data), count: data.items?.length });
      toast('Halaman disimpan', 'success');
    } catch (err) { toast('Gagal menyimpan: ' + err.message, 'error'); }
  };
}

// ================================================================ ADMIN: kegiatan rutin
export function viewKegiatanAdmin(main) {
  state.view = 'kegiatan';
  main.innerHTML = `<div class="toolbar toolbar-actions"><button class="btn btn-primary" id="kg-new">${ic('plus')} Tambah Kegiatan</button><a class="btn btn-ghost" href="#/" target="_blank">${ic('ext')} Lihat di beranda</a></div>
  <p class="muted small">Kegiatan rutin tampil di panel kanan beranda; kegiatan hari ini disorot otomatis.</p>
  <div class="info-admin">${state.kegiatan.map((k) => `<div class="info-row"><div class="info-ph">${ic('repeat')}</div><div class="info-row-main"><div class="info-meta"><span class="badge">${esc(k.kategori || 'Kegiatan')}</span><span class="badge ${k.aktif === false ? 'badge-muted' : 'badge-ok'}">${k.aktif === false ? 'Nonaktif' : 'Aktif'}</span></div><h4>${esc(k.nama)}</h4><p class="muted small">${esc([(k.hari || []).join(', '), k.minggu && k.minggu !== 'Setiap minggu' ? k.minggu : '', k.waktu, k.tempat].filter(Boolean).join(' • '))}</p></div>
    <div class="info-row-actions"><button class="icon-btn" data-ed="${k.id}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-del="${k.id}" title="Hapus">${ic('trash')}</button></div></div>`).join('') || emptyBox('Belum ada kegiatan rutin. Contoh: Pengajian Malam Jumat, Wirid Yasin, Posyandu, Gotong Royong.')}</div>`;
  $('#kg-new').onclick = () => kegiatanForm(null);
  $$('[data-ed]', main).forEach((b) => b.onclick = () => kegiatanForm(state.kegiatan.find((k) => k.id === b.dataset.ed)));
  $$('[data-del]', main).forEach((b) => b.onclick = async () => { const k = state.kegiatan.find((x) => x.id === b.dataset.del); if (await confirmDelete(`Hapus kegiatan “${k.nama}”?`)) { await F.deleteDoc(C(`kegiatan/${k.id}`)); logAudit('kegiatan', 'hapus', `Menghapus kegiatan rutin “${k.nama}”`); toast('Dihapus', 'success'); } });
}
function kegiatanForm(k) {
  const hari = k?.hari || [];
  const m = modal({
    title: k ? 'Ubah Kegiatan Rutin' : 'Tambah Kegiatan Rutin', size: 'lg',
    body: `<form id="kgf" class="form-grid">
      <label class="field span-2"><span>Nama kegiatan *</span><input name="nama" required value="${esc(k?.nama || '')}" placeholder="mis. Pengajian Malam Jumat"></label>
      <label class="field"><span>Kategori</span><input name="kategori" value="${esc(k?.kategori || '')}" placeholder="Ketik kategori…"></label>
      <label class="field"><span>Waktu</span><input name="waktu" value="${esc(k?.waktu || '')}" placeholder="mis. 20.30 WIB / Ba'da Isya"></label>
      <div class="field span-2"><span>Hari</span><div class="chips">${['Setiap Hari', ...HARI.slice(1), 'Minggu'].map((h) => `<label class="chip-check"><input type="checkbox" name="hari" value="${h}" ${hari.includes(h) ? 'checked' : ''}><span>${h}</span></label>`).join('')}</div></div>
      <label class="field"><span>Pekan</span><select name="minggu">${['Setiap minggu', 'Minggu ke-1', 'Minggu ke-2', 'Minggu ke-3', 'Minggu ke-4', 'Minggu ke-5'].map((x) => `<option ${k?.minggu === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="field"><span>Tempat</span><input name="tempat" value="${esc(k?.tempat || '')}" placeholder="mis. Meunasah"></label>
      <label class="field"><span>Penanggung jawab</span><input name="pj" value="${esc(k?.pj || '')}"></label>
      <label class="field"><span>No. HP PJ</span><input name="hp" type="tel" value="${esc(k?.hp || '')}"></label>
      <label class="field"><span>Urutan tampil</span><input name="urutan" type="number" value="${esc(k?.urutan ?? state.kegiatan.length + 1)}"></label>
      <label class="field span-2"><span>Keterangan / isi kegiatan <small class="muted">— tampil di halaman detail kegiatan. Tempel link YouTube/TikTok/Instagram/Facebook di baris tersendiri agar langsung jadi pemutar video</small></span><textarea name="keterangan" rows="5" data-rich placeholder="Tulis penjelasan kegiatan: materi, penceramah, perlengkapan yang perlu dibawa, dll.">${esc(k?.keterangan || '')}</textarea></label>
      <label class="field span-2"><span>Foto & video dari URL <small class="muted">— satu per baris, boleh ditambah “| keterangan”</small></span><textarea name="media" rows="3" placeholder="https://youtu.be/xxxxxxxxxxx | Dokumentasi pengajian&#10;https://www.tiktok.com/@akun/video/123… | Video singkat&#10;https://contoh.com/foto.jpg">${esc(mediaLinesText(k?.media))}</textarea></label>
      <div class="span-2 media-grid sm" id="kg-media-prev"></div>
      <label class="check"><input type="checkbox" name="aktif" ${k?.aktif === false ? '' : 'checked'}> Aktif (tampil di beranda)</label>
    </form>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="kg-ok">Simpan</button>',
  });
  const f = $('#kgf', m.el); bindRich(f);
  const mprev = () => { $('#kg-media-prev', m.el).innerHTML = parseMediaLines(f.elements.media.value).map(mediaEmbed).join(''); };
  f.elements.media.addEventListener('input', debounce(mprev, 400)); mprev();
  attachAutocomplete(f.elements.kategori, { source: () => state.master.kategoriKegiatan?.items || ['Pengajian', 'Wirid Yasin', 'Gotong Royong', 'Posyandu', 'Olahraga', 'Rapat Gampong', 'Majelis Taklim', 'Kesenian'], smallList: 12 });
  $('#kg-ok', m.el).onclick = async () => {
    const data = {
      nama: f.elements.nama.value.trim(), kategori: f.elements.kategori.value.trim(), waktu: f.elements.waktu.value.trim(),
      hari: $$('input[name=hari]:checked', f).map((x) => x.value), minggu: f.elements.minggu.value, tempat: f.elements.tempat.value.trim(),
      pj: f.elements.pj.value.trim(), hp: normalizePhone(f.elements.hp.value), urutan: Number(f.elements.urutan.value) || 0,
      keterangan: f.elements.keterangan.value.trim(), media: parseMediaLines(f.elements.media.value), aktif: f.elements.aktif.checked, updatedAt: F.serverTimestamp(),
    };
    if (!data.nama) return toast('Nama kegiatan wajib diisi', 'error');
    if (!data.hari.length) return toast('Pilih minimal satu hari', 'error');
    try {
      if (k) { await F.updateDoc(C(`kegiatan/${k.id}`), data); logAudit('kegiatan', 'ubah', `Mengubah kegiatan rutin “${data.nama}”`, { changes: diff(k, data) }); }
      else { await F.addDoc(F.collection(F.db, 'kegiatan'), { ...data, createdAt: F.serverTimestamp() }); logAudit('kegiatan', 'tambah', `Menambah kegiatan rutin “${data.nama}”`); }
      m.close(); toast('Kegiatan disimpan', 'success');
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
}

// ================================================================ ADMIN: pengaturan jadwal sholat
export function sholatSettingsForm(el) {
  const c = sholatCfg();
  el.innerHTML = `<div class="form-grid">
    <label class="field"><span>Nama kota/lokasi</span><input id="sh-kota" value="${esc(c.kota)}"></label>
    <label class="field"><span>Zona waktu</span><select id="sh-tz"><option value="7" ${c.tz == 7 ? 'selected' : ''}>WIB (UTC+7)</option><option value="8" ${c.tz == 8 ? 'selected' : ''}>WITA (UTC+8)</option><option value="9" ${c.tz == 9 ? 'selected' : ''}>WIT (UTC+9)</option></select></label>
    <label class="field"><span>Latitude</span><input id="sh-lat" type="number" step="0.0001" value="${esc(c.lat)}"></label>
    <label class="field"><span>Longitude</span><input id="sh-lng" type="number" step="0.0001" value="${esc(c.lng)}"></label>
    <label class="field"><span>Ihtiyat (menit pengaman)</span><input id="sh-ih" type="number" min="0" max="5" value="${esc(c.ihtiyat)}"></label>
  </div>
  <details class="fieldset"><summary>Koreksi manual per waktu (menit, +/-)</summary><div class="form-grid">${PRAYER_NAMES.map(([k, l]) => `<label class="field"><span>${l}</span><input type="number" data-kor="${k}" value="${esc(c.koreksi?.[k] || 0)}"></label>`).join('')}</div></details>
  <div class="row-gap"><button class="btn btn-ghost btn-sm" id="sh-geo">${ic('loc')} Pakai lokasi perangkat ini</button><button class="btn btn-primary" id="sh-save">Simpan</button></div>
  <div id="sh-prev" class="muted small"></div>`;
  const read = () => ({ kota: $('#sh-kota', el).value.trim(), tz: Number($('#sh-tz', el).value), lat: Number($('#sh-lat', el).value), lng: Number($('#sh-lng', el).value), ihtiyat: Number($('#sh-ih', el).value) || 0, koreksi: Object.fromEntries($$('[data-kor]', el).map((i) => [i.dataset.kor, Number(i.value) || 0])) });
  const prev = () => { const cf = read(); const t = prayerTimes(dateInTz(cf.tz), cf); $('#sh-prev', el).textContent = 'Hari ini: ' + PRAYER_NAMES.map(([k, l]) => `${l} ${fmtMin(t[k])}`).join(' • '); };
  el.addEventListener('input', debounce(prev, 200)); prev();
  $('#sh-geo', el).onclick = () => navigator.geolocation?.getCurrentPosition((pos) => { $('#sh-lat', el).value = pos.coords.latitude.toFixed(4); $('#sh-lng', el).value = pos.coords.longitude.toFixed(4); prev(); }, () => toast('Lokasi tidak diizinkan', 'error'));
  $('#sh-save', el).onclick = async () => {
    const cf = read();
    if (!cf.lat || !cf.lng || Math.abs(cf.lat) > 15 || cf.lng < 90 || cf.lng > 145) return toast('Koordinat di luar wilayah Indonesia', 'error');
    await F.setDoc(C('config/app'), { sholat: cf }, { merge: true });
    logAudit('pengaturan', 'jadwal_sholat', `Mengubah pengaturan jadwal sholat (${cf.kota})`, { detail: JSON.stringify(cf) });
    toast('Pengaturan jadwal sholat disimpan', 'success');
  };
}
