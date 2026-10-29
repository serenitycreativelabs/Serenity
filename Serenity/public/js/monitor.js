// =============================================================
//  Serenity — Monitor & Analitik (khusus Super Admin)
//  Pemakaian Firestore (read, write, delete, download, upload, read dihemat) & analitik kunjungan.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import { APP } from './config.js';
import { F, ic, state, isSuper, emptyBox, loadingBox, logAudit } from './core.js';
import { esc, $, fmtNum, toast, confirmDialog } from './ui.js';
import { usage, onUsage, KIND_LABEL, dayISO, dayKey, keyToISO } from './usage.js';
import { A, listenSummary, onAnalytics, countOnline, lastDays, todayVisits, flushUsage } from './analytics.js';
import { syncStatus, clearDeviceCache } from './sync.js';
import { exportExcel } from './exporter.js';

// Kuota gratis harian Firestore (paket Spark)
const QUOTA = { r: 50000, w: 20000, d: 20000 };
const COL_LABEL = { warga: 'Data warga', dusun: 'Dusun', master: 'Data master', informasi: 'Informasi', lembaga: 'Lembaga', lembagaPrivate: 'Anggota lembaga', dokumen: 'Dokumen', kegiatan: 'Kegiatan', halaman: 'Profil gampong', instagram: 'Instagram', config: 'Pengaturan', users: 'Akun', audit: 'Audit log', meta: 'Versi sinkron', hapus: 'Catatan hapus', presence: 'Kehadiran', analytics: 'Analitik', usage: 'Pemakaian', sistem: 'Sistem', private: 'Privat' };
const fmtDay = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]}`; };

let offs = [];
const cleanup = () => { offs.forEach((f) => f()); offs = []; };

export function viewMonitor(main) {
  cleanup();
  state.view = 'form';
  if (!isSuper()) { main.innerHTML = `<div class="callout">${ic('lock')}<div><b>Khusus Super Admin</b></div></div>`; return; }
  main.innerHTML = loadingBox();
  const days = 30; const from = dayISO(Date.now() - (days - 1) * 864e5);
  flushUsage(true).finally(() => F.getDocs(F.query(F.collection(F.db, 'usage'), F.where('day', '>=', from), F.limit(62))).then((s) => {
    const byDay = Object.fromEntries(s.docs.map((d) => [d.data().day || keyToISO(d.id), d.data()]));
    draw(main, byDay, days);
  }).catch((e) => { draw(main, {}, days); toast('Data pemakaian belum tersedia: ' + (e.code || e.message), 'info'); }));
}

function draw(main, byDay, days) {
  const series = []; for (let i = days - 1; i >= 0; i--) { const iso = dayISO(Date.now() - i * 864e5); series.push({ iso, ...(byDay[iso] || {}) }); }
  const today = series[series.length - 1] || {};
  const sum = (k, arr = series) => arr.reduce((a, d) => a + (Number(d[k]) || 0), 0);
  const saveRate = (today.r || 0) + (today.sv || 0) ? Math.round(((today.sv || 0) / ((today.r || 0) + (today.sv || 0))) * 100) : 0;
  main.innerHTML = `<div id="mon-root">
  <div class="callout small-callout">${ic('activity')}<div><b>Monitor & Analitik — khusus Super Admin</b><p class="small">Angka Firestore adalah <b>estimasi terukur aplikasi</b> dari seluruh perangkat (dikirim bertahap tiap ±5 menit). Angka tagihan resmi ada di <a href="https://console.firebase.google.com/project/${esc(APP.firebaseProjectId)}/firestore/usage" target="_blank" rel="noopener">Firebase Console → Firestore → Usage ${ic('ext')}</a>.</p></div></div>
  <h3 class="mon-h">${ic('users')} Analitik Kunjungan</h3>
  <div class="stat-grid" id="mon-visits"></div>
  <div class="panel"><div class="master-head"><h3>Kunjungan 30 hari terakhir</h3><span class="muted small">1 kunjungan = 1 sesi browser</span></div><div id="mon-vchart"></div></div>
  <h3 class="mon-h">${ic('db')} Pemakaian Firestore — hari ini</h3>
  <div class="stat-grid">
    ${['r', 'w', 'd', 'dl', 'ul', 'sv'].map((k) => {
      const v = Number(today[k]) || 0; const q = QUOTA[k];
      return `<div class="stat mon-stat"><span class="stat-ic">${ic({ r: 'eye', w: 'edit', d: 'trash', dl: 'download', ul: 'upload', sv: 'shield' }[k])}</span><div><span class="stat-label">${KIND_LABEL[k]}</span><b class="stat-val">${fmtNum(v)}</b>
        ${q ? `<span class="quota" title="${fmtNum(v)} dari kuota gratis ${fmtNum(q)}/hari"><i style="width:${Math.min(100, (v / q) * 100)}%" class="${v / q > 0.8 ? 'hot' : ''}"></i></span><small class="muted">${(Math.round((v / q) * 1000) / 10).toString().replace('.', ',')}% kuota gratis ${fmtNum(q)}/hari</small>` : k === 'sv' ? `<small class="muted">${saveRate}% permintaan dilayani dari perangkat</small>` : `<small class="muted">${k === 'dl' ? 'ekspor PDF/Excel, cadangan' : 'import, pulihkan, gambar'}</small>`}</div></div>`;
    }).join('')}
  </div>
  <div class="panel-grid two">
    <div class="panel"><div class="master-head"><h3>Read per hari</h3><span class="muted small">30 hari: ${fmtNum(sum('r'))} • publik ${fmtNum(sum('pr'))} • admin ${fmtNum(sum('ar'))}</span></div>${bars(series, 'r', QUOTA.r)}</div>
    <div class="panel"><div class="master-head"><h3>Read dihemat (sinkron bertahap)</h3><span class="muted small">30 hari: ${fmtNum(sum('sv'))}</span></div>${bars(series, 'sv')}</div>
    <div class="panel"><div class="master-head"><h3>Write per hari</h3><span class="muted small">30 hari: ${fmtNum(sum('w'))}</span></div>${bars(series, 'w', QUOTA.w)}</div>
    <div class="panel"><div class="master-head"><h3>Delete per hari</h3><span class="muted small">30 hari: ${fmtNum(sum('d'))}</span></div>${bars(series, 'd', QUOTA.d)}</div>
    <div class="panel"><div class="master-head"><h3>Download per hari</h3><span class="muted small">30 hari: ${fmtNum(sum('dl'))}</span></div>${bars(series, 'dl')}</div>
    <div class="panel"><div class="master-head"><h3>Upload per hari</h3><span class="muted small">30 hari: ${fmtNum(sum('ul'))}</span></div>${bars(series, 'ul')}</div>
  </div>
  <div class="panel-grid two">
    <div class="panel"><div class="master-head"><h3>${ic('phone')} Perangkat ini (sesi berjalan)</h3><span class="muted small" id="mon-since"></span></div><div id="mon-session"></div></div>
    <div class="panel"><div class="master-head"><h3>${ic('refresh')} Sinkron bertahap</h3><span id="mon-sync-badge"></span></div><div id="mon-sync"></div>
      <div class="row-gap"><button class="btn btn-ghost btn-sm" id="mon-clear">${ic('trash')} Kosongkan salinan data di perangkat ini</button></div></div>
  </div>
  <div class="row-gap"><button class="btn btn-ghost" id="mon-ref">${ic('refresh')} Muat ulang</button><button class="btn btn-ghost" id="mon-xls">${ic('download')} Ekspor Excel</button></div></div>`;

  const paintVisits = () => {
    const d7 = lastDays(7); const d30 = lastDays(30); const avg = Math.round(d7.reduce((a, d) => a + d.n, 0) / 7);
    const v = $('#mon-visits'); if (!v) return;
    v.innerHTML = [
      ['Online sekarang', A.online ?? '…', '5 menit terakhir', 'activity', true], ['Kunjungan hari ini', todayVisits(), dayISO(), 'users'], ['Rata-rata 7 hari', avg, 'kunjungan / hari', 'chart'], ['Total kunjungan', A.summary?.total || 0, 'sejak analitik aktif', 'star'],
    ].map(([l, n, sub, i, live]) => `<div class="stat"><span class="stat-ic">${ic(i)}</span><div><span class="stat-label">${live ? '<span class="vw-live"><i></i></span> ' : ''}${esc(l)}</span><b class="stat-val">${typeof n === 'number' ? fmtNum(n) : esc(n)}</b><small class="muted">${esc(sub)}</small></div></div>`).join('');
    $('#mon-vchart').innerHTML = bars(d30.map((d) => ({ iso: d.iso, n: d.n })), 'n');
  };
  const paintSession = () => {
    const el = $('#mon-session'); if (!el) return;
    $('#mon-since').textContent = `sejak ${new Date(usage.since).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    const rows = Object.entries(usage.cols).sort((a, b) => (b[1].r + b[1].w) - (a[1].r + a[1].w));
    el.innerHTML = `<div class="mon-chips">${['r', 'w', 'd', 'dl', 'ul', 'sv'].map((k) => `<span><small>${KIND_LABEL[k]}</small><b>${fmtNum(usage[k])}</b></span>`).join('')}</div>
      <div class="table-wrap"><table class="table small"><thead><tr><th>Koleksi</th><th style="text-align:right">Read</th><th style="text-align:right">Write</th><th style="text-align:right">Delete</th><th style="text-align:right">Dihemat</th></tr></thead><tbody>${rows.map(([c, v]) => `<tr><td>${esc(COL_LABEL[c] || c)}</td><td style="text-align:right">${fmtNum(v.r)}</td><td style="text-align:right">${fmtNum(v.w)}</td><td style="text-align:right">${fmtNum(v.d)}</td><td style="text-align:right">${fmtNum(v.sv)}</td></tr>`).join('') || `<tr><td colspan="5">${emptyBox('Belum ada transaksi di sesi ini')}</td></tr>`}</tbody></table></div>`;
    const st = syncStatus();
    $('#mon-sync-badge').innerHTML = `<span class="badge ${st.enabled ? 'badge-ok' : 'badge-warn'}">${st.enabled ? 'Aktif' : 'Mode cadangan'}</span> ${st.encrypted ? `<span class="badge">${ic('lock')} Terenkripsi</span>` : '<span class="badge badge-muted">Tanpa salinan admin</span>'}`;
    const MODE = { cache: 'Dari perangkat (0 read)', delta: 'Delta (hanya perubahan)', full: 'Muat penuh', doc: 'Dokumen', legacy: 'Listener penuh (cadangan)', init: 'Menyiapkan…' };
    $('#mon-sync').innerHTML = `<p class="muted small">Cache cocok: <b>${st.stats.hit}</b> • delta: <b>${st.stats.delta}</b> • muat penuh: <b>${st.stats.full}</b>${st.stats.legacy ? ` • cadangan: <b>${st.stats.legacy}</b>` : ''}</p>
      <div class="table-wrap"><table class="table small"><thead><tr><th>Data</th><th>Mode terakhir</th><th style="text-align:right">Dokumen</th><th style="text-align:right">Biaya read</th></tr></thead><tbody>${st.watches.map((w) => `<tr><td>${esc(COL_LABEL[w.id.split(':')[0]] || w.id)}${w.scope === 'adm' ? ' <span class="badge badge-muted">admin</span>' : ''}</td><td>${esc(MODE[w.mode] || w.mode)}</td><td style="text-align:right">${fmtNum(w.docs)}</td><td style="text-align:right">${fmtNum(w.lastCost)}</td></tr>`).join('')}</tbody></table></div>`;
  };
  paintVisits(); paintSession();
  offs.push(listenSummary(), onAnalytics(paintVisits), onUsage(paintSession));
  countOnline(true);
  const stopIfLeft = setInterval(() => { if (!document.getElementById('mon-root')) { clearInterval(stopIfLeft); cleanup(); } }, 2000);
  offs.push(() => clearInterval(stopIfLeft));
  $('#mon-ref').onclick = () => viewMonitor(main);
  $('#mon-clear').onclick = async () => {
    if (!await confirmDialog('Kosongkan salinan data di perangkat ini? Data di Firestore TIDAK terhapus; perangkat ini akan memuat ulang data penuh saat dibuka berikutnya.', { okText: 'Kosongkan' })) return;
    await clearDeviceCache(); logAudit('sistem', 'cache_kosong', 'Mengosongkan salinan data sinkron di perangkat'); toast('Salinan perangkat dikosongkan', 'success');
  };
  $('#mon-xls').onclick = () => {
    logAudit('export', 'monitor_xls', 'Mengekspor monitor pemakaian Firestore (Excel)');
    const h = A.summary?.harian || {};
    exportExcel(`Monitor_Firestore_${dayISO()}`, [{ name: 'Pemakaian', title: 'Pemakaian Firestore 30 hari (estimasi aplikasi)', head: ['Tanggal', 'Read', 'Read publik', 'Read admin', 'Write', 'Delete', 'Download', 'Upload', 'Read dihemat', 'Kunjungan'], body: series.map((d) => [d.iso, d.r || 0, d.pr || 0, d.ar || 0, d.w || 0, d.d || 0, d.dl || 0, d.ul || 0, d.sv || 0, h[dayKey(new Date(d.iso + 'T12:00:00+07:00').getTime())] || 0]) }]).catch((e) => toast(e.message, 'error'));
  };
}

// Diagram batang SVG sederhana (satu seri, satu sumbu, tooltip per batang)
function bars(series, key, quota) {
  const vals = series.map((d) => Number(d[key]) || 0);
  const peak = Math.max(1, ...vals, quota && Math.max(...vals) > quota * 0.6 ? quota : 0);
  if (!vals.some(Boolean)) return '<div class="empty small">Belum ada data</div>';
  const W = 600, H = 150, pad = 18, bw = (W - pad) / series.length;
  const ql = quota && peak >= quota ? H - 16 - ((quota / peak) * (H - 30)) : null;
  return `<div class="mon-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagram ${esc(key)}">
    <line x1="0" x2="${W}" y1="${H - 16}" y2="${H - 16}" class="mc-axis"/>
    ${ql != null ? `<line x1="0" x2="${W}" y1="${ql}" y2="${ql}" class="mc-quota"/><text x="${W - 4}" y="${ql - 4}" text-anchor="end" class="mc-qt">kuota gratis ${fmtNum(quota)}</text>` : ''}
    ${series.map((d, i) => { const v = vals[i]; const h = (v / peak) * (H - 30); return `<g class="mc-bar"><rect x="${i * bw + 1}" y="0" width="${Math.max(2, bw - 2)}" height="${H - 16}" class="mc-hit"/><rect x="${i * bw + 1}" y="${H - 16 - h}" width="${Math.max(2, bw - 2)}" height="${Math.max(v ? 2 : 0, h)}" rx="3" class="mc-fill"/><title>${esc(fmtDay(d.iso))}: ${fmtNum(v)}</title></g>`; }).join('')}
    ${series.map((d, i) => (i % Math.ceil(series.length / 6) === 0 || i === series.length - 1 ? `<text x="${i * bw + bw / 2}" y="${H - 3}" text-anchor="middle" class="mc-lbl">${esc(fmtDay(d.iso))}</text>` : '')).join('')}
  </svg></div>`;
}
