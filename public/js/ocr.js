// =============================================================
//  Serenity — OCR di perangkat (v2.9.14)
//  Membaca tulisan dari foto/scan langsung di browser petugas (Tesseract, bahasa Indonesia).
//  Foto KTP/KK TIDAK dikirim ke server mana pun — diproses di perangkat lalu dibuang (aman untuk UU PDP).
//  Mesin OCR (±3–4 MB) hanya diunduh saat fitur dipakai pertama kali, lalu tersimpan di cache perangkat.
//  Dipakai oleh: form Tambah/Ubah Warga (Scan KTP), Data Warga (Scan KK), editor teks (Teks dari foto).
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import { ic } from './core.js';
import { esc, modal, toast } from './ui.js';

const TESS_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let tessP = null, workerP = null, curPsm = '';

function loadScript(src) {
  return new Promise((res, rej) => {
    if (window.Tesseract) return res();
    const s = document.createElement('script'); s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => res(); s.onerror = () => rej(new Error('Mesin OCR gagal dimuat. Periksa koneksi internet lalu coba lagi.'));
    document.head.appendChild(s);
  });
}
let onProg = null;
async function getWorker() {
  tessP ||= loadScript(TESS_URL);
  await tessP;
  workerP ||= window.Tesseract.createWorker('ind', 1, {
    logger: (m) => onProg?.(m),
    errorHandler: (e) => console.warn('ocr', e),
  }).catch((e) => { workerP = null; throw e; });
  return workerP;
}
// Menghapus worker saat dialog ditutup agar memori HP lega (bahasa tetap tersimpan di cache)
export async function releaseOcr() { const w = await workerP?.catch(() => null); workerP = null; curPsm = ''; try { await w?.terminate(); } catch { /* */ } }

// ---------------------------------------------------------------- persiapan gambar
// Orientasi EXIF, skala ke ±2000 px, abu-abu + kontras, dan (untuk tabel) hapus garis kisi.
// ---------------------------------------------------------------- pengolahan gambar (v2.9.15: lebih tangguh untuk foto HP)
// 1) analisis cepat di gambar kecil: arah miring + kotak area tulisan (dokumen dipotong dari latar meja/lantai)
// 2) render ulang dari resolusi asli: luruskan, potong, perbesar sampai huruf ±30 px
// 3) binarisasi adaptif (tahan bayangan, pantulan cahaya, pola latar KTP/KK) + hapus garis tabel
const toGray = (d, n) => { const g = new Float32Array(n); for (let i = 0, p = 0; p < n; i += 4, p++) g[p] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000; return g; };
// tepi goresan huruf: beda terang dengan tetangga (gradien) cukup besar
function edgeMask(g, W, H, thr = 38) { const m = new Uint8Array(W * H); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const p = y * W + x; const gx = Math.abs(g[p + 1] - g[p - 1]), gy = Math.abs(g[p + W] - g[p - W]); if (gx + gy > thr) m[p] = 1; } return m; }
// sudut kemiringan teks (derajat) dengan profil proyeksi tepi huruf
function estimateSkew(mask, W, H) {
  const pts = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) pts.push(x, y);
  if (pts.length < 300) return 0;
  const score = (deg) => { const t = Math.tan((deg * Math.PI) / 180); const off = W + 2; const bins = new Float64Array(H + 2 * W + 4); for (let i = 0; i < pts.length; i += 2) { const b = Math.round(pts[i + 1] - pts[i] * t) + off; if (b >= 0 && b < bins.length) bins[b]++; } let sum = 0, sq = 0; for (const v of bins) { sum += v; sq += v * v; } return sq - (sum * sum) / bins.length; };
  let best = 0, bs = -1;
  for (let a = -8; a <= 8.001; a += 0.5) { const v = score(a); if (v > bs) { bs = v; best = a; } }
  for (let a = best - 0.45; a <= best + 0.451; a += 0.05) { const v = score(a); if (v > bs) { bs = v; best = a; } }
  return Math.abs(best) < 0.12 ? 0 : best;
}
// kotak area tulisan: baris/kolom yang padat tepi huruf (latar polos/bertekstur halus diabaikan)
function contentBox(mask, W, H) {
  const rows = new Float64Array(H), cols = new Float64Array(W); let tot = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { rows[y]++; cols[x]++; tot++; }
  if (tot < 200) return null;
  const span = (arr, n, lim) => { const thr = Math.max(2, lim); let a = 0, b = n - 1; while (a < n && arr[a] < thr) a++; while (b > a && arr[b] < thr) b--; return [a, b]; };
  const [y0, y1] = span(rows, H, W * 0.012), [x0, x1] = span(cols, W, H * 0.012);
  if (x1 - x0 < W * 0.15 || y1 - y0 < H * 0.1) return null;
  return { x0, y0, x1, y1 };
}
// binarisasi adaptif Sauvola (integral image) → hitam = tulisan
function sauvola(g, W, H, win, k = 0.28) {
  const n = W * H, S = new Float64Array((W + 1) * (H + 1)), Q = new Float64Array((W + 1) * (H + 1));
  for (let y = 1; y <= H; y++) { let rs = 0, rq = 0; for (let x = 1; x <= W; x++) { const v = g[(y - 1) * W + (x - 1)]; rs += v; rq += v * v; const i = y * (W + 1) + x; S[i] = S[i - W - 1] + rs; Q[i] = Q[i - W - 1] + rq; } }
  const out = new Uint8ClampedArray(n); const r = Math.max(8, win >> 1);
  for (let y = 0; y < H; y++) { const ya = Math.max(0, y - r), yb = Math.min(H, y + r + 1); for (let x = 0; x < W; x++) { const xa = Math.max(0, x - r), xb = Math.min(W, x + r + 1); const cnt = (yb - ya) * (xb - xa); const a = yb * (W + 1) + xb, b = ya * (W + 1) + xb, c = yb * (W + 1) + xa, d = ya * (W + 1) + xa; const sum = S[a] - S[b] - S[c] + S[d], sq = Q[a] - Q[b] - Q[c] + Q[d]; const m = sum / cnt, sd = Math.sqrt(Math.max(0, sq / cnt - m * m)); const t = m * (1 + k * (sd / 128 - 1)); out[y * W + x] = g[y * W + x] > t ? 255 : 0; } }
  return out;
}
function removeGrid(bin, W, H) {
  // garis tabel: deretan piksel hitam sangat panjang (boleh terputus ≤ 3 px)
  const n = W * H, kill = new Uint8Array(n), GAP = 3, minH = Math.round(W / 10), minV = Math.round(H / 22);
  const scan = (len, count, idx, min) => { for (let a = 0; a < count; a++) { let s = -1, last = -10; const flush = () => { if (s >= 0 && last - s + 1 >= min) for (let q = s; q <= last; q++) kill[idx(a, q)] = 1; }; for (let b = 0; b < len; b++) { if (bin[idx(a, b)] === 0) { if (s < 0 || b - last > GAP + 1) { flush(); s = b; } last = b; } } flush(); } };
  scan(W, H, (y, x) => y * W + x, minH); scan(H, W, (x, y) => y * W + x, minV);
  for (let p = 0; p < n; p++) if (kill[p]) { bin[p] = 255; if (p % W && kill[p - 1] === 0 && bin[p - 1] === 0 && (p + 1) % W && kill[p + 1]) bin[p - 1] = 255; }
  // sisa tepi garis setebal 1–2 px di sebelah garis yang dihapus
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const p = y * W + x; if (bin[p] === 0 && ((kill[p - W] && kill[p + W]) || (kill[p - 1] && kill[p + 1]))) bin[p] = 255; }
  for (let p = 0; p < n; p++) if (kill[p]) { if (p >= W && bin[p - W] === 0 && !(p >= 2 * W && bin[p - 2 * W] === 0)) bin[p - W] = 255; if (p + W < n && bin[p + W] === 0 && !(p + 2 * W < n && bin[p + 2 * W] === 0)) bin[p + W] = 255; }
}
const TARGET_W = { ktp: 2300, kk: 3600, doc: 2600 };
/**
 * Siapkan foto untuk OCR. Hasil: { bin, gray, info } — dua kanvas (hitam-putih adaptif & abu-abu) dari area dokumen yang sudah
 * diluruskan dan diperbesar. kind: 'ktp' | 'kk' | 'doc'.
 */
export async function prepareImage(file, { kind = 'ktp', rotate = 0, crop = true } = {}) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  const src = bmp || await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Berkas bukan gambar yang valid')); im.src = URL.createObjectURL(file); });
  const w0 = src.width, h0 = src.height, rot = ((rotate % 360) + 360) % 360, swap = rot === 90 || rot === 270;
  const RW = swap ? h0 : w0, RH = swap ? w0 : h0;
  const draw = (cw, ch, k, deg, ox = 0, oy = 0) => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); g.imageSmoothingQuality = 'high'; g.translate(cw / 2 - ox, ch / 2 - oy); g.rotate(((rot + deg) * Math.PI) / 180); g.drawImage(src, (-w0 * k) / 2, (-h0 * k) / 2, w0 * k, h0 * k); return c; };
  // 1) analisis di ukuran kecil
  const ka = Math.min(1, 1000 / Math.max(RW, RH)); const aw = Math.round(RW * ka), ah = Math.round(RH * ka);
  let a = draw(aw, ah, ka, 0); let ag = toGray(a.getContext('2d').getImageData(0, 0, aw, ah).data, aw * ah);
  let mask = edgeMask(ag, aw, ah); const skew = estimateSkew(mask, aw, ah);
  if (skew) { a = draw(aw, ah, ka, -skew); ag = toGray(a.getContext('2d').getImageData(0, 0, aw, ah).data, aw * ah); mask = edgeMask(ag, aw, ah); }
  let box = crop ? contentBox(mask, aw, ah) : null;
  if (!box) box = { x0: 0, y0: 0, x1: aw - 1, y1: ah - 1 };
  const padX = (box.x1 - box.x0) * 0.04 + 6, padY = (box.y1 - box.y0) * 0.05 + 6;
  box = { x0: Math.max(0, box.x0 - padX), y0: Math.max(0, box.y0 - padY), x1: Math.min(aw - 1, box.x1 + padX), y1: Math.min(ah - 1, box.y1 + padY) };
  // 2) render akhir: area tulisan diperbesar ke lebar target (huruf cukup besar untuk mesin OCR), maks. ±12 MP
  const bw = (box.x1 - box.x0) / ka, bh = (box.y1 - box.y0) / ka;
  let s = (TARGET_W[kind] || 2400) / bw; if (bw * s * bh * s > 12e6) s = Math.sqrt(12e6 / (bw * bh));
  const W = Math.round(bw * s), H = Math.round(bh * s), kf = s;
  const cx = ((box.x0 + box.x1) / 2 / ka - RW / 2) * kf, cy = ((box.y0 + box.y1) / 2 / ka - RH / 2) * kf;
  const out = draw(W, H, kf, -skew, cx, cy);
  const ctx = out.getContext('2d', { willReadFrequently: true }); const img = ctx.getImageData(0, 0, W, H); const d = img.data, n = W * H;
  const g = toGray(d, n);
  // abu-abu dengan kontras diregangkan (cadangan bila hitam-putih kurang cocok)
  const hist = new Uint32Array(256); for (let p = 0; p < n; p++) hist[g[p] | 0]++;
  let lo = 0, hi = 255, acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.01) { lo = v; break; } } acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.01) { hi = v; break; } }
  const span = Math.max(1, hi - lo); const gs = new Uint8ClampedArray(n); for (let p = 0; p < n; p++) gs[p] = ((g[p] - lo) * 255) / span;
  // 3) hitam-putih adaptif (jendela ±1/28 lebar) + hapus garis tabel untuk KK
  const bin = sauvola(gs, W, H, Math.round(Math.max(W, H) / 28), kind === 'ktp' ? 0.3 : 0.25);
  if (kind === 'kk') removeGrid(bin, W, H);
  const mk = (arr) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const im = x.createImageData(W, H); for (let i = 0, p = 0; p < n; i += 4, p++) { im.data[i] = im.data[i + 1] = im.data[i + 2] = arr[p]; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; };
  if (kind === 'kk') { for (let p = 0; p < n; p++) if (bin[p] === 255) gs[p] = Math.max(gs[p], 235); } // garis yang dihapus juga dihilangkan di versi abu-abu
  bmp?.close?.();
  return { bin: mk(bin), gray: mk(kind === 'kk' ? gs.map((v, p) => (bin[p] === 255 ? 255 : v)) : gs), info: { skew, crop: box, size: [W, H] } };
}

// susun ulang baris dari posisi kata (kolom label & nilai di KTP sering dipisah mesin OCR menjadi blok berbeda)
export function linesFromWords(words) {
  const ws = (words || []).filter((w) => w.text && w.text.trim() && w.confidence > 5).map((w) => ({ t: w.text.trim(), x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0, y1: w.bbox.y1, cy: (w.bbox.y0 + w.bbox.y1) / 2, h: w.bbox.y1 - w.bbox.y0 }));
  if (!ws.length) return '';
  const hs = ws.map((w) => w.h).sort((a, b) => a - b); const mh = hs[Math.floor(hs.length / 2)] || 20;
  ws.sort((a, b) => a.cy - b.cy);
  const lines = [];
  for (const w of ws) { const L = lines.find((l) => Math.abs(l.cy - w.cy) < mh * 0.55); if (L) { L.ws.push(w); L.cy = (L.cy * (L.ws.length - 1) + w.cy) / L.ws.length; } else lines.push({ cy: w.cy, ws: [w] }); }
  lines.sort((a, b) => a.cy - b.cy);
  return lines.map((l) => { l.ws.sort((a, b) => a.x0 - b.x0); let out = '', px = null; for (const w of l.ws) { if (px != null) { const gap = w.x0 - px; out += gap > mh * 1.6 ? '   ' : ' '; } out += w.t; px = w.x1; } return out; }).join('\n');
}

export async function recognize(canvas, { psm = '3', progress } = {}) {
  onProg = progress || null;
  const w = await getWorker();
  if (curPsm !== psm) { await w.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: '1', user_defined_dpi: '300' }); curPsm = psm; }
  const { data } = await w.recognize(canvas);
  onProg = null;
  return { text: data.text || '', lines: linesFromWords(data.words), confidence: Math.round(data.confidence || 0) };
}

// ---------------------------------------------------------------- pembaca KTP & KK (fungsi murni, bisa diuji)
const nk = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const DIGIT_FIX = { O: '0', o: '0', D: '0', Q: '0', U: '0', I: '1', l: '1', '|': '1', i: '1', '!': '1', L: '1', J: '1', S: '5', s: '5', B: '8', Z: '2', z: '2', G: '6', b: '6', T: '7', A: '4', g: '9', q: '9' };
export function fixDigits(s) { return String(s || '').replace(/[OoDQUIl|i!LJSsBZzGbTAgq]/g, (c) => DIGIT_FIX[c] || c).replace(/[^0-9]/g, ''); }
// cari 16 digit (NIK/No. KK) — toleran terhadap huruf yang mirip angka & spasi di tengah
export function find16(s) {
  const strict = String(s || '').match(/(?<!\d)\d{16}(?!\d)/); if (strict) return strict[0]; // angka bersih lebih dulu
  const tokens = String(s || '').match(/[0-9OoDQIlSBZG][0-9OoDQIl|!SBZG]{14,22}[0-9OoDQIl!SBZG]/g) || []; // tanpa spasi di tengah & tidak diawali garis tabel "|"
  for (const t of tokens) { const d = fixDigits(t.replace(/\s/g, '')); if (d.length === 16) return d; if (d.length > 16) { const m = d.match(/\d{16}/); if (m) return m[0]; } }
  return '';
}
// NIK menyimpan tanggal lahir (DDMMYY, perempuan DD+40) → dipakai untuk memeriksa & memperbaiki angka yang salah baca
export function nikMatch(nik, iso, jk) {
  if (!nik || nik.length !== 16 || !iso) return false;
  let d = +nik.slice(6, 8); const m = +nik.slice(8, 10), y = nik.slice(10, 12);
  if (jk === 'Perempuan' && d > 40) d -= 40; else if (!jk && d > 40) d -= 40;
  const [Y, M, D] = iso.split('-');
  return d === +D && m === +M && y === Y.slice(2);
}
export function nikRepair(line, nik, iso, jk) {
  if (!iso || nikMatch(nik, iso, jk)) return nik;
  const runs = String(line || '').match(/[0-9OoDQIl|!SBZG]{15,20}/g) || [];
  for (const t of runs) { const d = fixDigits(t.replace(/[|!]/g, '1')).replace(/\D/g, ''); for (let i = 0; i + 16 <= d.length; i++) { const c = d.slice(i, i + 16); if (nikMatch(c, iso, jk)) return c; } }
  return nik;
}
export function toIsoDate(s) {
  const m = String(s || '').replace(/[Oo]/g, '0').match(/(\d{1,2})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{4})/);
  if (!m) return '';
  const [, dd, mm, yy] = m; const d = +dd, mo = +mm, y = +yy;
  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 1900 || y > 2100) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function lev(a, b) {
  if (a === b) return 0; const m = a.length, n = b.length; if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
// pilihan master yang paling cocok dengan awal teks (mis. "KAWIN BANDA ACEH" → "Kawin")
export function bestOption(raw, options, { min = 0.72 } = {}) {
  const v = nk(raw); if (!v || !options?.length) return '';
  let best = '', score = 0;
  for (const o of options) {
    const ok = nk(o); if (!ok) continue;
    let s = 0;
    if (v === ok) s = 1;
    else if (v.startsWith(ok)) s = 0.95 + Math.min(0.04, ok.length / 1000);
    else { const head = v.slice(0, ok.length); s = 1 - lev(head, ok) / Math.max(ok.length, head.length); }
    if (s > score || (s === score && ok.length > nk(best).length)) { score = s; best = o; }
  }
  return score >= min ? best : '';
}
// nilai sesudah label: pakai ":" bila ada; bila tidak, buang teks label di awal baris
const valueOf = (line, label) => { const i = line.indexOf(':'); let v = i >= 0 ? line.slice(i + 1) : label ? line.replace(new RegExp('^\\s*(?:' + label.source + ')[A-Za-z/ .!]*?(?=\\s)', label.flags), '') : line; return v.replace(/^[\s:;.,=“"']+/, '').trim(); };
const cleanTail = (v) => String(v || '').replace(/\s+\d{1,2}-\d{1,2}-\d{4}\s*$/, '').replace(/\s{3,}.*$/, '').replace(/\s+(FOTO)\s*$/i, '').trim();
const titleish = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// label KTP & variasinya (huruf hasil OCR sering sedikit keliru: "Tgl" → "Tg!", "Kel/Desa" → "KelDesa")
const KTP_LABELS = [
  ['nik', ['nik']], ['nama', ['nama']], ['ttl', ['tempattgllahir', 'tempattanggallahir', 'tempatlahir', 'tgllahir']], ['jk', ['jeniskelamin', 'jeniskel', 'kelamin']],
  ['alamat', ['alamat']], ['rtrw', ['rtrw']], ['kel', ['keldesa', 'kelurahandesa', 'kelurahan', 'desa']], ['kec', ['kecamatan']], ['agama', ['agama']],
  ['kawin', ['statusperkawinan', 'perkawinan', 'statusperk']], ['kerja', ['pekerjaan']], ['wn', ['kewarganegaraan']], ['berlaku', ['berlakuhingga']], ['gol', ['goldarah', 'golongandarah']],
];
const looseRe = (alias) => new RegExp('^[\\s\\W]*' + alias.split('').map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s./\\\\|\'’`-]*'), 'i');
// kenali label di awal baris → [kunci, sisa teks sebagai nilai]
function splitLabel(line) {
  const raw = line.replace(/^[\s|]+/, '');
  for (const [key, aliases] of KTP_LABELS) for (const al of aliases) { const m = raw.match(looseRe(al)); if (m) return [key, raw.slice(m[0].length)]; }
  // fuzzy: bagian sebelum ":" atau 1–3 kata pertama
  const ci = raw.search(/[:;=]/); const cands = [];
  if (ci > 0 && ci < 28) cands.push([raw.slice(0, ci), raw.slice(ci)]);
  const ws = raw.split(/\s+/); for (let k = 1; k <= Math.min(3, ws.length - 1); k++) cands.push([ws.slice(0, k).join(' '), ws.slice(k).join(' ')]);
  let best = null, bs = 0;
  for (const [lab, rest] of cands) { const L = nk(lab); if (L.length < 3) continue; for (const [key, aliases] of KTP_LABELS) for (const al of aliases) { const sc = 1 - lev(L, al) / Math.max(L.length, al.length); if (sc > bs) { bs = sc; best = [key, rest]; } } }
  return bs >= 0.72 ? best : null;
}
const valueClean = (v) => String(v || '').replace(/^[\s:;.,=“"'’|_-]+/, '').replace(/\s{3,}.*$/, '').replace(/\s+\d{1,2}-\d{1,2}-\d{4}\s*$/, '').replace(/\s+(FOTO)\s*$/i, '').replace(/[|_]+$/, '').trim();

/**
 * Baca teks KTP → { nik, nama, tempatLahir, tglLahir, jk, golDarah, alamat, rt, rw, kelurahan, kecamatan, kabupaten, provinsi, agama, statusKawin, pekerjaan }
 * opts.master(key) → daftar pilihan master (agama, statusKawin, pekerjaan, golDarah)
 */
export function parseKTP(text, { master = () => [] } = {}) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
  const out = {}; const got = {};
  for (const l of lines) {
    if (!out.provinsi && /PROV[I1l]NS[I1l]/i.test(l)) { out.provinsi = titleish(valueClean(l.replace(/.*PROV[I1l]NS[I1l]\s*/i, ''))); continue; }
    if (!out.kabupaten && /^\s*(KABUPATEN|KOTA)\s+[A-Z]/i.test(l) && !/:/.test(l)) { out.kabupaten = titleish(valueClean(l.trim())); continue; }
    const sp = splitLabel(l); if (!sp) continue;
    const [key, rest] = sp; if (got[key]) continue; got[key] = rest;
  }
  out.nik = find16(got.nik || '') || find16(text);
  if (got.nama) out.nama = valueClean(got.nama).replace(/[^A-Za-z.,'\s-]/g, '').replace(/\s+/g, ' ').trim();
  if (got.ttl) { const v = got.ttl.replace(/^[\s:;.,=“"'’|_-]+/, '').replace(/\s{3,}.*$/, ''); const iso = toIsoDate(v); if (iso) out.tglLahir = iso; const tp = v.split(/[,.]?\s*\d/)[0].replace(/[^A-Za-z\s.-]/g, ' ').replace(/\s+/g, ' ').trim(); if (tp) out.tempatLahir = fixPlace(tp); }
  else { const dl = lines.find((l) => toIsoDate(l) && !/Berlaku/i.test(l)); if (dl) out.tglLahir = toIsoDate(dl); }
  const jkTxt = (got.jk || '').toUpperCase(); out.jk = /PEREM|PRMP|WANITA/.test(jkTxt) ? 'Perempuan' : /LAK|LAKI|PRIA/.test(jkTxt) ? 'Laki-laki' : '';
  const gdl = lines.find((l) => /Darah/i.test(l)); const gd = (gdl || '').match(/Darah\s*[:;.]?\s*(AB|A|B|O|0)\b/i) || (got.gol || '').match(/\b(AB|A|B|O|0)\b/i); if (gd) out.golDarah = gd[1].toUpperCase().replace('0', 'O');
  if (got.alamat) out.alamat = valueClean(got.alamat);
  if (got.rtrw) { const m = valueClean(got.rtrw).replace(/[Oo]/g, '0').match(/(\d{1,3})\s*[/\\|.,l1I]?\s*(\d{3}|\d{1,3})/); if (m) { out.rt = m[1].padStart(3, '0'); out.rw = m[2].padStart(3, '0'); } }
  if (got.kel) out.kelurahan = fixPlace(valueClean(got.kel));
  if (got.kec) out.kecamatan = valueClean(got.kec);
  if (got.agama) { const v = valueClean(got.agama); out.agama = bestOption(v, master('agama'), { min: 0.6 }) || v; }
  if (got.kawin) { const v = valueClean(got.kawin).replace(/TERCATAT|BELUM\s+TERCATAT/gi, '').trim(); out.statusKawin = bestOption(v, master('statusKawin'), { min: 0.6 }) || v; }
  if (got.kerja) { const v = valueClean(got.kerja); out.pekerjaan = bestOption(v, master('pekerjaan'), { min: 0.62 }) || (nk(v).length >= 5 ? v : ''); if (!out.pekerjaan) delete out.pekerjaan; }
  if (out.golDarah && master('golDarah').length) out.golDarah = bestOption(out.golDarah, master('golDarah'), { min: 1 }) || out.golDarah;
  Object.keys(out).forEach((k) => { if (!out[k]) delete out[k]; });
  if (out.nik && out.tglLahir) out.nik = nikRepair(lines.find((l) => /NIK/i.test(l)) || '', out.nik, out.tglLahir, out.jk);
  return out;
}
export const scoreKTP = (v) => ['nik', 'nama', 'tempatLahir', 'tglLahir', 'jk', 'alamat', 'rt', 'kelurahan', 'kecamatan', 'agama', 'statusKawin', 'pekerjaan', 'golDarah', 'provinsi', 'kabupaten'].filter((k) => v[k]).length + (v.nik?.length === 16 ? 2 : 0) + (nikMatch(v.nik, v.tglLahir, v.jk) ? 2 : 0);

const SK_RE = /((?:B\s*)?[EF]\s*L\s*[UV]\s*[MN]\s*KAWIN|KAWIN\s+BELUM\s+TERCATAT|KAWIN\s+TERCATAT|CERAI\s+HIDUP|CERAI\s+MATI|KAWIN)/i;
// nama tempat yang sering tergabung hasil OCR ("BANDAACEH") → dipisah lagi
const PLACES = ['BANDA ACEH', 'ACEH BESAR', 'ACEH JAYA', 'ACEH BARAT', 'ACEH BARAT DAYA', 'ACEH SELATAN', 'ACEH TENGAH', 'ACEH TENGGARA', 'ACEH TIMUR', 'ACEH TAMIANG', 'ACEH UTARA', 'ACEH SINGKIL', 'BENER MERIAH', 'BIREUEN', 'GAYO LUES', 'LANGSA', 'LHOKSEUMAWE', 'NAGAN RAYA', 'PIDIE', 'PIDIE JAYA', 'SABANG', 'SIMEULUE', 'SUBULUSSALAM', 'MEDAN', 'JAKARTA', 'BANDUNG', 'SURABAYA', 'YOGYAKARTA', 'DEAH GLUMPANG'];
const fixPlace = (v) => { const n = nk(v); const hit = PLACES.find((p) => nk(p) === n) || PLACES.find((p) => nk(p).length > 5 && n.endsWith(nk(p)) && n.length - nk(p).length <= 3); return hit || v; };
const KK_SHDK = ['KEPALA KELUARGA', 'SUAMI', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 'ORANG TUA', 'MERTUA', 'FAMILI LAIN', 'PEMBANTU', 'LAINNYA'];
// cari pilihan master yang paling cocok dengan salah satu potongan teks (urutan kolom boleh bergeser)
function pickFrom(parts, options, min, used) {
  let best = null;
  parts.forEach((t, idx) => { if (used.has(idx)) return; for (let len = 1; len <= Math.min(3, parts.length - idx); len++) { const seg = parts.slice(idx, idx + len).join(' '); const o = bestOption(seg.replace(/\|/g, 'I'), options, { min }); if (!o) continue; const sc = 1 - lev(nk(seg), nk(o)) / Math.max(nk(seg).length, nk(o).length); if (!best || sc > best.sc) best = { o, sc, idx, len }; } });
  if (best) for (let q = best.idx; q < best.idx + best.len; q++) used.add(q);
  return best?.o || '';
}
/**
 * Baca teks Kartu Keluarga → { noKk, kepala, alamat, rt, rw, kelurahan, kecamatan, kabupaten, provinsi, anggota: [{ nama, nik, jk, tempatLahir, tglLahir, agama, pendidikan, pekerjaan, statusKawin, shdk }] }
 */
export function parseKK(text, { master = () => [] } = {}) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
  const out = { anggota: [] };
  const kkL = lines.find((l) => /\bN[oO0]\b|Nomor/i.test(l) && find16(l)) || lines.slice(0, 10).find((l) => find16(l) && !/NIK/i.test(l)); out.noKk = find16(kkL || '');
  // bagian kepala (dua kolom: "Label : nilai      Label : nilai")
  const segs = lines.flatMap((l) => l.split(/\s{3,}(?=[A-Za-z][A-Za-z /.]{2,30}\s*:)/));
  const get = (re) => { const s = segs.find((x) => re.test(x) && x.includes(':')); return s ? valueClean(s.slice(s.indexOf(':') + 1)) : ''; };
  out.kepala = get(/Kepala\s*Keluarga/i); out.alamat = get(/^\s*Alamat/i);
  const rr = get(/RT\s*[/\\]?\s*RW/i).replace(/[Oo]/g, '0').match(/(\d{1,3})\s*[/\\|]\s*(\d{1,3})/); if (rr) { out.rt = rr[1].padStart(3, '0'); out.rw = rr[2].padStart(3, '0'); }
  out.kelurahan = fixPlace(get(/Desa|Kelurahan/i)); out.kecamatan = get(/Kecamatan/i); out.kabupaten = fixPlace(get(/Kabupaten|Kota/i)); out.provinsi = get(/Provinsi/i);
  // tabel 1: baris yang mengandung NIK
  const pend = master('pendidikan'), pek = master('pekerjaan'), ag = master('agama'), gdl = master('golDarah');
  for (const l of lines) {
    const nik = find16(l); if (!nik || nik === out.noKk) continue;
    const at = l.indexOf(nik) >= 0 ? l.indexOf(nik) : l.search(/[0-9OIlSB|]{8}/);
    // nama: teks sebelum NIK, tanpa nomor urut & sisa garis/kotak (token pendek di depan)
    let nameTk = l.slice(0, Math.max(0, at)).replace(/[|()\[\]“”"'_]/g, ' ').trim().split(/\s+/).filter(Boolean);
    while (nameTk.length && (nameTk[0].length <= 2 || /\d/.test(nameTk[0]) || !/^[A-Z][A-Z.'-]*$/.test(nameTk[0]))) nameTk.shift();
    const r = { nama: nameTk.join(' ').replace(/[^A-Za-z.'\s-]/g, '').replace(/\s+/g, ' ').trim().replace(/^CONTOH(?=[A-Z]{3})/, 'CONTOH '), nik };
    let rest = l.slice(at >= 0 ? at : 0).replace(/^[0-9OIlSB|!]{14,20}/, '');
    const jk = rest.match(/(L[A-Z]{2,3}\s*-?\s*L[A-Z]{2,4}(?=\s|$)|LAKI\s*-?\s*LAKI|L\s*A\s*K\s*I|PEREMPUAN|PEREMPUA|EREMPUAN|P[EF]R[EF]MPU)/); if (jk) { r.jk = /PER|EREM/i.test(jk[1]) ? 'Perempuan' : 'Laki-laki'; rest = rest.slice(jk.index + jk[0].length); }
    const dt = rest.match(/\d{1,2}\s*[-./]\s*\d{1,2}\s*[-./]\s*\d{4}/);
    if (dt) { r.tglLahir = toIsoDate(dt[0]); const tp = rest.slice(0, dt.index).replace(/[^A-Za-z\s.-]/g, ' ').replace(/\s+/g, ' ').trim(); if (tp) r.tempatLahir = fixPlace(tp); rest = rest.slice(dt.index + dt[0].length); }
    const parts = rest.replace(/[|“”"_]/g, ' ').split(/\s{2,}|\s(?=(?:ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|BUDHA|KONGHUCU|KHONGHUCU)\b)/i).map((t) => t.trim()).filter((t) => t && /[A-Za-z]/.test(t));
    if (r.tglLahir) r.nik = nikRepair(l, r.nik, r.tglLahir, r.jk);
    const used = new Set();
    r.agama = pickFrom(parts, ag, 0.7, used);
    r.pendidikan = pickFrom(parts, pend, 0.6, used);
    r.pekerjaan = pickFrom(parts, pek, 0.62, used);
    const gd = parts.find((t, i) => !used.has(i) && /^(AB|A|B|O|TIDAK\s*TAHU)$/i.test(t)); if (gd && gdl.length) r.golDarah = bestOption(gd, gdl, { min: 0.8 }) || '';
    Object.keys(r).forEach((k) => { if (!r[k]) delete r[k]; });
    out.anggota.push(r);
  }
  // tabel 2: status perkawinan & hubungan keluarga — urut sesuai kemunculan
  const shdkList = master('shdk').length ? master('shdk') : KK_SHDK;
  const rows2 = lines.filter((l) => !find16(l) && SK_RE.test(l) && !/Status\s*Perkawinan/i.test(l));
  rows2.slice(0, out.anggota.length).forEach((l, i) => {
    const no = Number((l.match(/^\D{0,4}(\d{1,2})\b/) || [])[1]) - 1; const r = out.anggota[Number.isFinite(no) && no >= 0 && out.anggota[no] && !out.anggota[no].statusKawin ? no : i]; if (!r) return;
    const m = l.match(SK_RE); r.statusKawin = bestOption(m[1].replace(/BELUM\s+TERCATAT|TERCATAT/i, '').trim(), master('statusKawin')) || titleish(m[1]);
    const after = l.slice(m.index + m[0].length).replace(/\d{1,2}\s*[-./]\s*\d{1,2}\s*[-./]\s*\d{4}/g, ' ');
    const parts = after.replace(/[|“”"_]/g, ' ').split(/\s{2,}/).map((t) => t.trim()).filter((t) => t && /[A-Za-z]{2}/.test(t));
    const sh = pickFrom(parts.slice(0, 3), shdkList, 0.6, new Set()); if (sh) r.shdk = sh;
  });
  Object.keys(out).forEach((k) => { if (k !== 'anggota' && !out[k]) delete out[k]; });
  return out;
}
// skor hasil KK: jumlah anggota (×100) + rata-rata kelengkapan kolom per anggota (0–90)
export const scoreKK = (v) => { const a = v.anggota || []; if (!a.length) return v.noKk ? 5 : 0; const f = ['nama', 'nik', 'jk', 'tempatLahir', 'tglLahir', 'agama', 'pendidikan', 'pekerjaan', 'statusKawin', 'shdk']; const avg = a.reduce((s, r) => s + f.filter((k) => r[k]).length + (nikMatch(r.nik, r.tglLahir, r.jk) ? 1 : 0), 0) / a.length; return a.length * 100 + Math.round(avg * 8) + (v.noKk ? 1 : 0); };
// teks dokumen → paragraf rapi (baris yang terpotong disambung)
export function tidyText(text) {
  // Tesseract sering memberi baris kosong di antara setiap baris → paragraf ditentukan ulang dari panjang baris
  const lines = String(text || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  const lens = lines.map((l) => l.length).sort((x, y) => x - y); const med = lens[Math.floor(lens.length * 0.6)] || 60;
  const out = [];
  lines.forEach((l, i) => {
    if (!i) { out.push(l); return; }
    const prev = out[out.length - 1], prevRaw = lines[i - 1];
    const short = prevRaw.length < med * 0.6;                                   // judul, nomor surat, tanda tangan
    const endPara = /[.:!?]$/.test(prevRaw) && prevRaw.length < med * 0.85;      // baris terakhir paragraf (pendek & berakhir titik)
    if (/^([-•*]|\d+[.)])\s/.test(l)) { out.push('\n' + l); return; }
    if (short || endPara) { out.push((short && l.length < med * 0.6 ? '' : '\n') + l); return; }
    if (prev.endsWith('-')) { const w1 = (prev.match(/(\w+)-$/) || [])[1] || '', w2 = (l.match(/^\w+/) || [''])[0]; out[out.length - 1] = (w1 && w1.toLowerCase() === w2.toLowerCase() ? prev : prev.slice(0, -1)) + l; return; } // kata ulang (masing-masing) tetap bertanda hubung
    out[out.length - 1] = prev + ' ' + l;
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

// ---------------------------------------------------------------- antarmuka
const PRIV = `<p class="ocr-priv">${ic('lock')} Foto diproses <b>di perangkat ini</b> dan tidak dikirim ke server mana pun. Foto tidak disimpan.</p>`;
// kind: 'ktp' | 'kk' | 'doc' → bentuk bingkai panduan kamera (KTP 85,6×54 mm · KK A4 mendatar · dokumen A4 tegak)
const GUIDE = { ktp: { ar: 1.586, text: 'Posisikan KTP tepat di dalam bingkai' }, kk: { ar: 1.414, text: 'Posisikan seluruh lembar KK di dalam bingkai' }, doc: { ar: 0.707, text: 'Posisikan halaman dokumen di dalam bingkai' } };
const pickHtml = (label, kind = 'ktp') => `<div class="ocr-pick" data-kind="${kind}">
  <div class="ocr-choose">
    <button type="button" class="ocr-opt" data-ocr-cam>${ic('image')}<b>Ambil foto dengan kamera</b><small>Kamera belakang HP/tablet atau webcam laptop</small></button>
    <label class="ocr-opt" tabindex="0">${ic('upload')}<b>Unggah foto</b><small>Dari galeri atau berkas (JPG/PNG/HEIC)</small><input type="file" accept="image/*" hidden data-ocr-file></label>
  </div>
  <p class="ocr-for muted small">${esc(label)}</p>
  <div class="ocr-cam" hidden>
    <div class="ocr-view"><video playsinline muted autoplay></video><div class="ocr-guide" style="--ar:${GUIDE[kind].ar}"><i></i><span>${esc(GUIDE[kind].text)}</span></div><div class="ocr-flash"></div></div>
    <div class="ocr-cam-bar"><button type="button" class="btn btn-ghost btn-sm" data-cam-cancel>Batal</button><button type="button" class="ocr-shutter" data-cam-shot aria-label="Ambil foto" title="Ambil foto (Spasi)"></button><span class="ocr-cam-side"><button type="button" class="icon-btn" data-cam-flip title="Ganti kamera depan/belakang" aria-label="Ganti kamera">${ic('refresh')}</button><button type="button" class="icon-btn" data-cam-torch title="Senter" aria-label="Senter" hidden>${ic('bulb')}</button></span></div>
  </div>
  <div class="ocr-stage" hidden><canvas class="ocr-prev"></canvas><div class="ocr-tools"><button type="button" class="btn btn-ghost btn-sm" data-ocr-rot>${ic('refresh')} Putar 90°</button><button type="button" class="btn btn-ghost btn-sm" data-ocr-recam>${ic('image')} Foto ulang</button><button type="button" class="btn btn-ghost btn-sm" data-ocr-again>${ic('upload')} Unggah lain</button></div></div>
  <div class="ocr-prog" hidden><div class="ocr-bar"><i></i></div><small>Menyiapkan…</small></div></div>`;
const TIPS = '<ul class="ocr-tips"><li>Letakkan kartu di permukaan datar dengan cahaya terang, tanpa pantulan lampu/kilat.</li><li>Foto tegak lurus, seluruh kartu terlihat dan memenuhi layar.</li><li>Hasil tetap diperiksa — huruf yang kurang jelas bisa terbaca keliru.</li></ul>';

const camErr = (e) => ({ NotAllowedError: 'Izin kamera ditolak. Izinkan akses kamera untuk situs ini di pengaturan browser, atau gunakan "Unggah foto".', NotFoundError: 'Kamera tidak ditemukan di perangkat ini. Gunakan "Unggah foto".', NotReadableError: 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.', OverconstrainedError: 'Kamera tidak mendukung pengaturan ini. Coba "Ganti kamera".' }[e?.name] || (window.isSecureContext ? 'Kamera tidak dapat dibuka. Gunakan "Unggah foto".' : 'Kamera hanya bisa dipakai di alamat https://. Gunakan "Unggah foto".'));

function bindPicker(root, { evaluate, enough, onText }) {
  const $q = (s) => root.querySelector(s); const kind = root.querySelector('.ocr-pick')?.dataset.kind || 'ktp';
  const fileIn = $q('[data-ocr-file]'), choose = $q('.ocr-choose'), forTxt = $q('.ocr-for'), stage = $q('.ocr-stage'), prev = $q('.ocr-prev'), prog = $q('.ocr-prog');
  const cam = $q('.ocr-cam'), video = cam.querySelector('video'), guide = cam.querySelector('.ocr-guide'), torchBtn = $q('[data-cam-torch]');
  let file = null, rot = 0, busy = false, stream = null, facing = 'environment', torchOn = false;
  const setProg = (p, msg) => { prog.hidden = false; prog.querySelector('i').style.width = `${Math.round(p * 100)}%`; prog.querySelector('small').textContent = msg; };
  const label = (m) => ({ 'loading tesseract core': 'Mengunduh mesin OCR (sekali saja)…', 'initializing tesseract': 'Menyiapkan mesin OCR…', 'loading language traineddata': 'Mengunduh data bahasa Indonesia (sekali saja)…', 'initializing api': 'Menyiapkan…', 'recognizing text': 'Membaca tulisan…' }[m.status] || 'Memproses…');
  const show = (view) => { choose.hidden = forTxt.hidden = view !== 'choose'; cam.hidden = view !== 'cam'; stage.hidden = view !== 'stage'; };
  // beberapa cara baca (hitam-putih/abu-abu × tata letak), pilih hasil terbaik; berhenti lebih awal bila sudah lengkap
  const PASSES = { ktp: [['bin', '6'], ['gray', '6'], ['bin', '4'], ['gray', '3'], ['bin', '11']], kk: [['bin', '6'], ['gray', '6'], ['bin', '4'], ['gray', '4']], doc: [['gray', '3'], ['bin', '3']] }[kind] || [['gray', '3']];
  const run = async () => {
    if (!file || busy) return; busy = true;
    try {
      setProg(0.02, 'Menyiapkan & meluruskan foto…');
      const prep = await prepareImage(file, { kind, rotate: rot });
      const pc = prep.bin; const k = Math.min(1, 560 / pc.width); prev.width = pc.width * k; prev.height = pc.height * k; prev.getContext('2d').drawImage(pc, 0, 0, prev.width, prev.height);
      show('stage');
      const t0 = performance.now(); let best = null;
      for (let i = 0; i < PASSES.length; i++) {
        const [img, psm] = PASSES[i]; const base = i / PASSES.length, part = 1 / PASSES.length;
        const r = await recognize(prep[img], { psm, progress: (m) => setProg(m.status === 'recognizing text' ? 0.3 + 0.7 * (base + part * m.progress) : Math.min(0.29, 0.05 + (m.progress || 0) * 0.24), m.status === 'recognizing text' ? `Membaca tulisan${PASSES.length > 1 ? ` (cara ${i + 1} dari ${PASSES.length})` : ''}…` : label(m)) });
        for (const text of [r.lines, r.text]) { if (!text) continue; const sc = evaluate ? evaluate(text) : r.confidence; if (!best || sc > best.score || (sc === best.score && r.confidence > best.confidence)) best = { text, confidence: r.confidence, score: sc, pass: i + 1 }; }
        if (enough && best && enough(best.score)) break;
      }
      setProg(1, `Selesai dalam ${((performance.now() - t0) / 1000).toFixed(1)} detik · keyakinan ${best.confidence}%`);
      onText(best);
    } catch (e) { setProg(0, e.message || 'Gagal membaca foto'); toast(e.message || 'Gagal membaca foto', 'error'); }
    busy = false;
  };
  // ---- kamera langsung (getUserMedia)
  // bingkai panduan sebesar mungkin di dalam gambar video, dengan rasio dokumen (KTP/KK/A4)
  const ar = Number(getComputedStyle(guide).getPropertyValue('--ar')) || 1.586; let ro = null;
  const fitGuide = () => { const w = video.clientWidth, h = video.clientHeight; if (!w || !h) return; let gw = w * 0.9, gh = gw / ar; if (gh > h * 0.86) { gh = h * 0.86; gw = gh * ar; } const i = guide.querySelector('i'); i.style.width = `${gw}px`; i.style.height = `${gh}px`; guide.style.inset = `${video.offsetTop}px auto auto ${video.offsetLeft}px`; guide.style.width = `${w}px`; guide.style.height = `${h}px`; };
  const stopCam = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; video.srcObject = null; torchOn = false; };
  const startCam = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { toast(camErr({}), 'error'); return; }
    stopCam(); show('cam'); prog.hidden = true;
    try {
      const big = kind !== 'ktp'; // KK & dokumen berisi tulisan kecil → minta resolusi setinggi mungkin
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, width: { ideal: big ? 3840 : 1920 }, height: { ideal: big ? 2160 : 1080 } } });
      video.srcObject = stream; await video.play().catch(() => {});
      fitGuide(); ro ||= new ResizeObserver(fitGuide); ro.observe(video);
      const track = stream.getVideoTracks()[0]; const caps = track.getCapabilities?.() || {};
      torchBtn.hidden = !caps.torch;
      try { if (caps.focusMode?.includes('continuous')) await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch { /* */ }
      video.classList.toggle('mirror', (track.getSettings?.().facingMode || facing) === 'user');
      $q('[data-cam-shot]').focus();
    } catch (e) { stopCam(); show(file ? 'stage' : 'choose'); toast(camErr(e), 'error'); }
  };
  const shoot = async () => {
    if (!stream || !video.videoWidth) return;
    // potong sesuai bingkai panduan (+ sedikit tepi) dari resolusi asli video
    const vr = video.getBoundingClientRect(), gr = guide.querySelector('i').getBoundingClientRect();
    const sx = video.videoWidth / vr.width, sy = video.videoHeight / vr.height, pad = kind === 'ktp' ? 0.05 : 0.1; // KK/dokumen: tepi lebih longgar agar kolom tidak terpotong
    let x = (gr.left - vr.left - gr.width * pad) * sx, y = (gr.top - vr.top - gr.height * pad) * sy, w = gr.width * (1 + 2 * pad) * sx, h = gr.height * (1 + 2 * pad) * sy;
    x = Math.max(0, x); y = Math.max(0, y); w = Math.min(video.videoWidth - x, w); h = Math.min(video.videoHeight - y, h);
    // foto resolusi penuh sensor (Chrome Android/desktop) bila tersedia; bila tidak, ambil dari bingkai video
    let srcImg = video, fx = 1, fy = 1;
    try {
      const track = stream.getVideoTracks()[0];
      if (kind !== 'ktp' && 'ImageCapture' in window) { const photo = await new window.ImageCapture(track).takePhoto(); const bmp = await createImageBitmap(photo); if (bmp.width > video.videoWidth) { srcImg = bmp; fx = bmp.width / video.videoWidth; fy = bmp.height / video.videoHeight; } }
    } catch { /* takePhoto tidak didukung → pakai bingkai video */ }
    const c = document.createElement('canvas'); c.width = Math.round(w * fx); c.height = Math.round(h * fy);
    const g = c.getContext('2d'); if (video.classList.contains('mirror')) { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(srcImg, x * fx, y * fy, w * fx, h * fy, 0, 0, c.width, c.height);
    cam.querySelector('.ocr-flash').classList.remove('go'); void cam.offsetWidth; cam.querySelector('.ocr-flash').classList.add('go');
    navigator.vibrate?.(30); stopCam(); // gambar sudah tersalin → kamera langsung dimatikan
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92));
    file = new File([blob], 'kamera.jpg', { type: 'image/jpeg' }); rot = 0; run();
  };
  $q('[data-ocr-cam]').onclick = startCam;
  $q('[data-ocr-recam]').onclick = startCam;
  $q('[data-cam-shot]').onclick = shoot;
  $q('[data-cam-cancel]').onclick = () => { stopCam(); show(file ? 'stage' : 'choose'); };
  $q('[data-cam-flip]').onclick = () => { facing = facing === 'environment' ? 'user' : 'environment'; startCam(); };
  torchBtn.onclick = async () => { const t = stream?.getVideoTracks()[0]; if (!t) return; torchOn = !torchOn; try { await t.applyConstraints({ advanced: [{ torch: torchOn }] }); torchBtn.classList.toggle('on', torchOn); } catch { torchBtn.hidden = true; } };
  cam.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('[data-cam-shot], .ocr-view')) { e.preventDefault(); shoot(); } if (e.key === 'Escape') { e.stopPropagation(); stopCam(); show(file ? 'stage' : 'choose'); } });
  // ---- unggah berkas
  fileIn.onchange = () => { if (!fileIn.files[0]) return; stopCam(); file = fileIn.files[0]; rot = 0; run(); };
  fileIn.closest('label').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } });
  $q('[data-ocr-rot]').onclick = () => { rot = (rot + 90) % 360; run(); };
  $q('[data-ocr-again]').onclick = () => { fileIn.value = ''; fileIn.click(); };
  root._ocrStop = stopCam;
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) { stopCam(); show(file ? 'stage' : 'choose'); } });
}

const KTP_FIELDS = [['nik', 'NIK'], ['nama', 'Nama Lengkap'], ['tempatLahir', 'Tempat Lahir'], ['tglLahir', 'Tanggal Lahir'], ['jk', 'Jenis Kelamin'], ['golDarah', 'Golongan Darah'], ['alamat', 'Alamat'], ['rt', 'RT'], ['rw', 'RW'], ['kelurahan', 'Kelurahan / Gampong'], ['kecamatan', 'Kecamatan'], ['kabupaten', 'Kabupaten / Kota'], ['provinsi', 'Provinsi'], ['agama', 'Agama'], ['statusKawin', 'Status Perkawinan'], ['pekerjaan', 'Pekerjaan']];
const fmtTgl = (iso) => (iso ? iso.split('-').reverse().join('-') : '');

const DUP_MSG = 'Data sudah tersedia, Silahkan cek kembali untuk penyesuaian.';
const same = (k, a, b) => (k === 'tglLahir' ? String(a || '') === String(b || '') : nk(a) === nk(b));
const showVal = (k, v) => (k === 'tglLahir' ? fmtTgl(v) : v || '');
const readVal = (k, v) => { v = String(v || '').trim(); if (k === 'tglLahir') v = toIsoDate(v) || v; if (k === 'nik' || k === 'noKk') v = fixDigits(v); return v; };

/**
 * Scan KTP → isi form warga.
 * current = nilai form saat ini; existing(nik) → warga lain yang sudah memakai NIK tsb (atau null);
 * onApply(values) mengisi form; onExisting(rec, patch) membuka data tersimpan (patch = kolom yang diperbarui, boleh kosong)
 */
export function ocrKtpDialog({ master, current = {}, existing = () => null, onApply, onExisting }) {
  const m = modal({ title: 'Isi otomatis dari foto KTP', size: 'lg', body: `<div class="ocr-wrap">${pickHtml('Foto bagian depan KTP — kamera atau unggah berkas.', 'ktp')}${PRIV}${TIPS}<div class="ocr-result" hidden></div></div>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-ghost" id="ocr-open" hidden>${ic('eye')} Buka data tersimpan</button><button class="btn btn-primary" id="ocr-apply" disabled>${ic('check')} Isi ke formulir</button>`, onClose: () => { m.el._ocrStop?.(); releaseOcr(); } });
  const box = m.el.querySelector('.ocr-result'), applyBtn = m.el.querySelector('#ocr-apply'), openBtn = m.el.querySelector('#ocr-open');
  let dup = null;
  const countUpd = () => { const n = box.querySelectorAll('[data-k]:checked').length; applyBtn.innerHTML = `${ic('refresh')} Perbarui data terpilih (${n})`; applyBtn.disabled = !n; };
  bindPicker(m.el, { evaluate: (t) => scoreKTP(parseKTP(t, { master })), enough: (sc) => sc >= 18, onText: ({ text, confidence }) => {
    const v = parseKTP(text, { master });
    const found = KTP_FIELDS.filter(([k]) => v[k]).length;
    dup = v.nik ? existing(v.nik) : null;
    box.hidden = false;
    const sum = `<div class="ocr-sum ${found >= 8 ? 'ok' : 'warn'}">${ic(found >= 8 ? 'check' : 'bulb')}<span><b>${found} dari ${KTP_FIELDS.length} kolom terbaca</b> · keyakinan ${confidence}%. ${dup ? '' : 'Periksa dan perbaiki sebelum diisi ke formulir.'}</span></div>`;
    if (dup) {
      // NIK sudah terdaftar → data awal dipakai; hanya kolom yang dicentang yang diperbarui
      const diffs = KTP_FIELDS.filter(([k]) => v[k] && !same(k, dup[k], v[k])).length;
      box.innerHTML = `${sum}<div class="ocr-dup">${ic('bell')}<div><b>${DUP_MSG}</b><p>NIK <b>${esc(v.nik)}</b> sudah terdaftar atas nama <b>${esc(dup.nama || '-')}</b>${dup.dusun ? ` · Dusun ${esc(dup.dusun)}` : ''}${dup.noKk ? ` · KK ${esc(dup.noKk)}` : ''}. Data awal tetap dipakai. ${diffs ? `Ada <b>${diffs} kolom berbeda</b> dengan hasil scan — centang yang ingin diperbarui.` : 'Semua kolom hasil scan sama dengan data tersimpan.'}</p></div></div>
        <div class="table-wrap ocr-cmp"><table><thead><tr><th>Kolom</th><th>Data tersimpan</th><th>Hasil scan KTP</th><th>Perbarui</th></tr></thead><tbody>${KTP_FIELDS.map(([k, l]) => { const a = dup[k] || '', b = v[k] || ''; const eq = !b || same(k, a, b); return `<tr class="${eq ? 'eq' : 'diff'}"><td class="c-l">${esc(l)}</td><td data-l="Tersimpan">${esc(showVal(k, a)) || '<span class="muted">—</span>'}</td><td data-l="Hasil scan"><input class="ocr-v" data-v="${k}" value="${esc(showVal(k, b))}" placeholder="tidak terbaca" ${k === 'nik' ? 'readonly' : ''}></td><td class="c-act">${k === 'nik' ? '<span class="muted small">kunci</span>' : eq ? `<span class="ocr-same">${b ? 'sama' : '—'}</span><input type="checkbox" data-k="${k}" hidden>` : `<label class="check"><input type="checkbox" data-k="${k}"> ubah</label>`}</td></tr>`; }).join('')}</tbody></table></div>
        <details class="ocr-raw"><summary>Lihat teks hasil OCR</summary><pre>${esc(text)}</pre></details>`;
      box.querySelectorAll('.ocr-v').forEach((inp) => inp.addEventListener('input', () => { const k = inp.dataset.v; const cb = box.querySelector(`[data-k="${k}"]`); if (!cb || k === 'nik') return; const differ = inp.value.trim() && !same(k, dup[k], readVal(k, inp.value)); cb.hidden = !differ; const tr = inp.closest('tr'); tr.className = differ ? 'diff' : 'eq'; if (cb.closest('label') == null && differ) { const td = cb.parentElement; td.innerHTML = `<label class="check"><input type="checkbox" data-k="${k}" checked> ubah</label>`; td.querySelector('input').onchange = countUpd; } countUpd(); }));
      box.querySelectorAll('[data-k]').forEach((cb) => { cb.onchange = countUpd; });
      openBtn.hidden = false; countUpd();
      return;
    }
    openBtn.hidden = true; applyBtn.innerHTML = `${ic('check')} Isi ke formulir`;
    box.innerHTML = `${sum}<div class="ocr-grid">${KTP_FIELDS.map(([k, l]) => { const val = showVal(k, v[k]); const cur = current[k] || ''; const eq = cur && same(k, cur, v[k]); return `<label class="ocr-row ${val ? '' : 'empty'}"><input type="checkbox" data-k="${k}" ${val && (!cur || k === 'nik' || k === 'nama' || !eq) && !(cur && ['provinsi', 'kabupaten', 'kecamatan', 'kelurahan'].includes(k)) ? 'checked' : ''} ${val ? '' : 'disabled'}><span class="ocr-l">${esc(l)}</span><input class="ocr-v" data-v="${k}" value="${esc(val)}" placeholder="tidak terbaca" ${k === 'nik' ? 'inputmode="numeric" maxlength="16"' : ''}>${cur && !eq ? `<small class="ocr-cur" title="Isian saat ini">sekarang: ${esc(showVal(k, cur))}</small>` : ''}</label>`; }).join('')}</div>
      <details class="ocr-raw"><summary>Lihat teks hasil OCR</summary><pre>${esc(text)}</pre></details>`;
    box.querySelectorAll('.ocr-v').forEach((inp) => inp.addEventListener('input', () => { const cb = box.querySelector(`[data-k="${inp.dataset.v}"]`); cb.disabled = !inp.value.trim(); cb.checked = !!inp.value.trim(); }));
    applyBtn.disabled = false;
  } });
  const collect = () => { const vals = {}; box.querySelectorAll('[data-k]:checked').forEach((cb) => { const k = cb.dataset.k; const val = readVal(k, box.querySelector(`[data-v="${k}"]`).value); if (val) vals[k] = val; }); return vals; };
  openBtn.onclick = () => { m.close(); onExisting?.(dup, {}); };
  applyBtn.onclick = () => {
    const vals = collect();
    if (dup) { if (!Object.keys(vals).length) return; m.close(); onExisting?.(dup, vals); return; }
    if (vals.nik && vals.nik.length !== 16) return toast('NIK harus 16 digit — periksa kembali', 'error');
    onApply(vals); m.close(); toast(`${Object.keys(vals).length} kolom diisi dari KTP — periksa lalu klik Simpan`, 'success');
  };
  return m;
}

const KK_COLS = [['nama', 'Nama'], ['nik', 'NIK'], ['jk', 'L/P'], ['tempatLahir', 'Tempat lahir'], ['tglLahir', 'Tgl lahir'], ['agama', 'Agama'], ['pendidikan', 'Pendidikan'], ['pekerjaan', 'Pekerjaan'], ['statusKawin', 'Status kawin'], ['shdk', 'Hubungan']];
const KK_LBL = Object.fromEntries([...KK_COLS, ['noKk', 'No. KK'], ['alamat', 'Alamat'], ['rt', 'RT'], ['rw', 'RW'], ['dusun', 'Dusun']]);
/**
 * Scan KK → daftar anggota keluarga. existingNik(nik) → warga yang sudah ada.
 * onSave({ header, rows, updates }) → Promise; updates = [{ id, nama, changes }] untuk data tersedia yang dipilih "Perbarui data"
 */
export function ocrKkDialog({ master, existingNik, dusunHtml = '', onSave }) {
  const m = modal({ title: 'Tambah keluarga dari foto Kartu Keluarga', size: 'xl', body: `<div class="ocr-wrap">${pickHtml('Foto seluruh lembar Kartu Keluarga, tegak dan terang.', 'kk')}${PRIV}<div class="ocr-result" hidden></div></div>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="ocr-save" disabled>' + ic('check') + ' Simpan</button>', onClose: () => { m.el._ocrStop?.(); releaseOcr(); } });
  const box = m.el.querySelector('.ocr-result'), saveBtn = m.el.querySelector('#ocr-save'); let parsed = null, exs = [];
  const header = () => ({ noKk: fixDigits(box.querySelector('#kk-no')?.value), alamat: box.querySelector('#kk-al')?.value.trim(), rt: box.querySelector('#kk-rt')?.value.trim(), rw: box.querySelector('#kk-rw')?.value.trim(), dusun: box.querySelector('[data-kk-dusun]')?.value.trim() || '' });
  const rowVals = (tr) => { const o = {}; tr.querySelectorAll('[data-c]').forEach((inp) => { const v = readVal(inp.dataset.c, inp.value); if (v) o[inp.dataset.c] = v; }); return o; };
  // daftar perbedaan data tersimpan vs hasil scan (anggota + kolom kepala KK)
  const diffList = (i) => { const ex = exs[i]; if (!ex) return []; const tr = box.querySelector(`tr[data-i="${i}"]`); const r = { ...header(), ...rowVals(tr) }; if (!r.dusun) delete r.dusun; return Object.entries(r).filter(([k, v]) => k !== 'nik' && v && !same(k, ex[k], v)).map(([k, v]) => [k, ex[k] || '', v]); };
  const paintDiff = (i) => { const det = box.querySelector(`tr[data-d="${i}"]`); if (!det) return; const act = box.querySelector(`[data-act="${i}"]`).value; const d = diffList(i); det.hidden = act !== 'update'; const prevOff = new Set([...det.querySelectorAll('[data-dk]:not(:checked)')].map((x) => x.dataset.dk)); det.querySelector('td').innerHTML = d.length ? `<b>Perubahan yang akan diterapkan ke data tersimpan:</b><div class="ocr-diffs">${d.map(([k, a, b]) => `<label class="check"><input type="checkbox" data-dk="${k}" ${prevOff.has(k) ? '' : 'checked'}> <span>${esc(KK_LBL[k] || k)}: <s>${esc(showVal(k, a)) || '—'}</s> → <b>${esc(showVal(k, b))}</b></span></label>`).join('')}</div>` : '<span class="muted">Tidak ada perbedaan — data tersimpan sudah sama dengan hasil scan.</span>'; det.querySelectorAll('[data-dk]').forEach((c) => { c.onchange = count; }); count(); };
  const count = () => { const nNew = [...box.querySelectorAll('tbody tr[data-i]')].filter((tr) => !exs[+tr.dataset.i] && tr.querySelector('[data-row]')?.checked).length; const nUpd = exs.map((ex, i) => ex && box.querySelector(`[data-act="${i}"]`)?.value === 'update' && box.querySelectorAll(`tr[data-d="${i}"] [data-dk]:checked`).length ? 1 : 0).reduce((a, b) => a + b, 0); saveBtn.innerHTML = `${ic('check')} Simpan (${nNew} baru${nUpd ? `, ${nUpd} diperbarui` : ''})`; saveBtn.disabled = !nNew && !nUpd; };
  bindPicker(m.el, { evaluate: (t) => scoreKK(parseKK(t, { master })), enough: (sc) => sc >= 100 && sc % 100 >= 80, onText: ({ text, confidence }) => {
    parsed = parseKK(text, { master });
    const rows = parsed.anggota;
    exs = rows.map((r) => (r.nik && existingNik(r.nik)) || null);
    const nDup = exs.filter(Boolean).length;
    // No. KK & NIK satu keluarga biasanya berawalan kode wilayah yang sama (4–6 digit) → beri tanda bila berbeda
    const pre = rows.map((r) => r.nik?.slice(0, 4)).filter(Boolean);
    const kkWarn = !parsed.noKk ? 'No. KK tidak terbaca — isi manual' : pre.length && !pre.includes(parsed.noKk.slice(0, 4)) ? '4 digit awal No. KK biasanya sama dengan NIK anggota keluarga' : '';
    box.hidden = false;
    box.innerHTML = `<div class="ocr-sum ${rows.length ? 'ok' : 'warn'}">${ic(rows.length ? 'check' : 'bulb')}<span><b>${rows.length} anggota keluarga terbaca</b> · keyakinan ${confidence}%. ${rows.length ? 'Periksa setiap baris; sel bisa langsung diubah.' : 'Coba foto ulang lebih dekat dan terang.'}</span></div>
      ${nDup ? `<div class="ocr-dup">${ic('bell')}<div><b>${DUP_MSG}</b><p>${nDup} anggota (NIK) sudah terdaftar. Data awal tetap dipakai — pilih <b>Perbarui data</b> pada baris tersebut bila ada perubahan.</p></div></div>` : ''}
      <div class="form-grid ocr-head">
        <label class="field ${kkWarn ? 'ocr-check' : ''}"><span>No. KK${kkWarn ? ' <small>— periksa kembali</small>' : ''}</span><input id="kk-no" value="${esc(parsed.noKk || '')}" inputmode="numeric" maxlength="16" ${kkWarn ? `title="${esc(kkWarn)}"` : ''}></label>
        <label class="field"><span>Alamat</span><input id="kk-al" value="${esc(parsed.alamat || '')}"></label>
        <label class="field"><span>RT</span><input id="kk-rt" value="${esc(parsed.rt || '')}"></label>
        <label class="field"><span>RW</span><input id="kk-rw" value="${esc(parsed.rw || '')}"></label>
        ${dusunHtml ? `<label class="field"><span>Dusun *</span>${dusunHtml}</label>` : ''}
      </div>
      <div class="table-wrap ocr-table"><table><thead><tr><th></th><th>Status</th>${KK_COLS.map(([, l]) => `<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => { const ex = exs[i]; return `<tr data-i="${i}" class="${ex ? 'dup' : ''}"><td class="c-chk">${ex ? `<span class="ocr-dupdot" title="${esc(DUP_MSG)}">!</span>` : `<input type="checkbox" checked data-row="${i}" aria-label="Pilih baris ${i + 1}">`}</td><td class="c-st">${ex ? `<div class="ocr-st"><span class="badge badge-warn" title="${esc(`Tersimpan: ${ex.nama || ''}${ex.dusun ? ' · ' + ex.dusun : ''}`)}">Data sudah tersedia</span><select data-act="${i}" aria-label="Tindakan untuk data tersedia"><option value="skip">Pakai data awal</option><option value="update">Perbarui data</option></select></div>` : '<span class="badge badge-ok">baru</span>'}</td>${KK_COLS.map(([k, l]) => `<td data-l="${esc(l)}" class="c-${k}"><input data-c="${k}" value="${esc(showVal(k, r[k]))}" ${k === 'nik' ? 'inputmode="numeric" maxlength="16"' : ''} aria-label="${esc(l)}"></td>`).join('')}</tr>${ex ? `<tr class="ocr-detail" data-d="${i}" hidden><td colspan="${KK_COLS.length + 2}"></td></tr>` : ''}`; }).join('')}</tbody></table></div>
      <details class="ocr-raw"><summary>Lihat teks hasil OCR</summary><pre>${esc(text)}</pre></details>`;
    box.querySelectorAll('[data-act]').forEach((sel) => { sel.onchange = () => paintDiff(+sel.dataset.act); });
    box.querySelectorAll('[data-row]').forEach((c) => { c.onchange = count; });
    box.querySelectorAll('tr[data-i] [data-c], .ocr-head input, .ocr-head select').forEach((inp) => inp.addEventListener('input', () => exs.forEach((ex, i) => ex && paintDiff(i))));
    count();
  } });
  saveBtn.onclick = async () => {
    const h = header();
    if (h.noKk && h.noKk.length !== 16) return toast('No. KK harus 16 digit', 'error');
    const rows = [...box.querySelectorAll('tbody tr[data-i]')].filter((tr) => !exs[+tr.dataset.i] && tr.querySelector('[data-row]').checked).map(rowVals);
    const bad = rows.find((r) => !r.nama || (r.nik && r.nik.length !== 16)); if (bad) return toast(`Periksa baris "${bad.nama || '(tanpa nama)'}": nama wajib & NIK 16 digit`, 'error');
    const updates = exs.map((ex, i) => { if (!ex || box.querySelector(`[data-act="${i}"]`).value !== 'update') return null; const on = new Set([...box.querySelectorAll(`tr[data-d="${i}"] [data-dk]:checked`)].map((c) => c.dataset.dk)); const changes = Object.fromEntries(diffList(i).filter(([k]) => on.has(k)).map(([k, , b]) => [k, b])); return Object.keys(changes).length ? { id: ex.id, nama: ex.nama, changes } : null; }).filter(Boolean);
    if (!rows.length && !updates.length) return toast('Tidak ada data baru atau perubahan untuk disimpan', 'error');
    saveBtn.disabled = true;
    try { await onSave({ header: h, rows, updates }); m.close(); } catch (err) { saveBtn.disabled = false; toast('Gagal menyimpan: ' + err.message, 'error'); }
  };
  return m;
}

/** Foto dokumen → teks untuk editor. onInsert(text) */
export function ocrTextDialog({ onInsert }) {
  const m = modal({ title: 'Teks dari foto dokumen', size: 'lg', body: `<div class="ocr-wrap">${pickHtml('Foto surat, pengumuman, atau satu halaman dokumen.', 'doc')}${PRIV}<div class="ocr-result" hidden><label class="field"><span>Hasil teks (bisa diubah sebelum disisipkan)</span><textarea id="ocr-text" rows="10"></textarea></label><label class="check"><input type="checkbox" id="ocr-tidy" checked> Rapikan baris yang terpotong menjadi paragraf</label></div></div>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-ghost" id="ocr-copy" disabled>' + ic('copy') + ' Salin</button><button class="btn btn-primary" id="ocr-ins" disabled>' + ic('plus') + ' Sisipkan ke tulisan</button>', onClose: () => { m.el._ocrStop?.(); releaseOcr(); } });
  let raw = ''; const ta = m.el.querySelector('#ocr-text'), tidy = m.el.querySelector('#ocr-tidy');
  const show = () => { ta.value = tidy.checked ? tidyText(raw) : raw.trim(); };
  tidy.onchange = show;
  bindPicker(m.el, { evaluate: null, enough: (sc) => sc >= 80, onText: ({ text }) => { raw = text; m.el.querySelector('.ocr-result').hidden = false; show(); m.el.querySelector('#ocr-ins').disabled = m.el.querySelector('#ocr-copy').disabled = !text.trim(); } });
  m.el.querySelector('#ocr-copy').onclick = async () => { try { await navigator.clipboard.writeText(ta.value); toast('Teks disalin', 'success'); } catch { ta.select(); } };
  m.el.querySelector('#ocr-ins').onclick = () => { if (!ta.value.trim()) return; onInsert(ta.value); m.close(); };
  return m;
}
