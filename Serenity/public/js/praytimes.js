// Perhitungan jadwal sholat lokal (tanpa API) — parameter Kemenag RI:
// Subuh: matahari -20°, Isya: -18°, Ashar: bayangan 1× (Syafi'i), Imsak: Subuh − 10 menit,
// Dhuha: matahari +4,5°, ihtiyat (pengaman) default +2 menit.
const d2r = (d) => (d * Math.PI) / 180;
const r2d = (r) => (r * 180) / Math.PI;
const sin = (d) => Math.sin(d2r(d)), cos = (d) => Math.cos(d2r(d)), tan = (d) => Math.tan(d2r(d));
const asin = (x) => r2d(Math.asin(x)), acos = (x) => r2d(Math.acos(Math.max(-1, Math.min(1, x)))), atan2 = (y, x) => r2d(Math.atan2(y, x));
const acot = (x) => r2d(Math.atan(1 / x));
const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function sunPos(jd) {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
  return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fix(RA, 24) };
}

export const DEFAULT_SHOLAT = { kota: 'Banda Aceh', lat: 5.5483, lng: 95.3238, tz: 7, ihtiyat: 2, koreksi: {} };
export const PRAYER_NAMES = [
  ['imsak', 'Imsak'], ['subuh', 'Subuh'], ['terbit', 'Terbit'], ['dhuha', 'Dhuha'],
  ['dzuhur', 'Dzuhur'], ['ashar', 'Ashar'], ['maghrib', 'Maghrib'], ['isya', 'Isya'],
];

// Mengembalikan menit sejak tengah malam (waktu lokal sesuai tz) untuk tiap waktu
export function prayerTimes(date, cfg = DEFAULT_SHOLAT) {
  const lat = Number(cfg.lat), lng = Number(cfg.lng), tz = Number(cfg.tz ?? 7);
  const jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
  const midDay = (t) => fix(12 - sunPos(jd + t).eqt, 24);
  const angleTime = (angle, t, ccw) => {
    const decl = sunPos(jd + t).decl;
    const T = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
    return midDay(t) + (ccw ? -T : T);
  };
  const asrTime = (factor, t) => {
    const decl = sunPos(jd + t).decl;
    return angleTime(-acot(factor + tan(Math.abs(lat - decl))), t);
  };
  let t = { subuh: 5, terbit: 6, dhuha: 7, dzuhur: 12, ashar: 13, maghrib: 18, isya: 18 };
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / 24]));
    t = {
      subuh: angleTime(20, p.subuh, true),
      terbit: angleTime(0.833, p.terbit, true),
      dhuha: angleTime(-4.5, p.dhuha, true),
      dzuhur: midDay(p.dzuhur),
      ashar: asrTime(1, p.ashar),
      maghrib: angleTime(0.833, p.maghrib),
      isya: angleTime(18, p.isya),
    };
  }
  const ih = Number(cfg.ihtiyat ?? 2);
  const k = cfg.koreksi || {};
  const out = {};
  for (const [key, h] of Object.entries(t)) {
    let m = (h + tz - lng / 15) * 60;
    if (key === 'terbit') m -= ih; else if (key !== 'dhuha') m += ih; else m += ih;
    m += Number(k[key] || 0);
    out[key] = Math.round(m);
  }
  out.imsak = out.subuh - 10 + Number(k.imsak || 0);
  return out;
}

export const fmtMin = (m) => `${String(Math.floor(fix(m, 1440) / 60)).padStart(2, '0')}:${String(Math.round(fix(m, 1440) % 60)).padStart(2, '0')}`;

// Waktu sekarang dalam menit, di zona waktu desa (tz)
export function nowMinutes(tz = 7) {
  const d = new Date();
  const utc = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
  return fix(utc + tz * 60, 1440);
}
export function dateInTz(tz = 7) {
  const d = new Date(Date.now() + tz * 3600e3);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
export function hijriDate(d) {
  try { return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); }
  catch { return ''; }
}
