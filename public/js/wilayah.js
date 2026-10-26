// Data wilayah seluruh Indonesia: Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Gampong
// Sumber publik (CORS terbuka). Jika sumber pertama gagal, otomatis pindah ke sumber cadangan.
import { norm, attachAutocomplete } from './ui.js';

const SOURCES = [
  {
    name: 'emsifa', base: 'https://www.emsifa.com/api-wilayah-indonesia/api', key: 'name',
    paths: ['provinces.json', (id) => `regencies/${id}.json`, (id) => `districts/${id}.json`, (id) => `villages/${id}.json`],
  },
  {
    name: 'ibnux', base: 'https://ibnux.github.io/data-indonesia', key: 'nama',
    paths: ['provinsi.json', (id) => `kabupaten/${id}.json`, (id) => `kecamatan/${id}.json`, (id) => `kelurahan/${id}.json`],
  },
];

let srcIdx = null;
try { const s = localStorage.getItem('wil:src'); if (s !== null) srcIdx = Number(s); } catch { /* abaikan */ }
const mem = new Map();

const KEEP_UPPER = new Set(['DKI', 'DI', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'KM', 'SP', 'UPT', 'PIR']);
export function titleCase(s) {
  return String(s || '').toLowerCase().split(/(\s+|-|\()/).map((w) => {
    const up = w.toUpperCase();
    if (KEEP_UPPER.has(up)) return up;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}

async function fetchJson(url) {
  if (mem.has(url)) return mem.get(url);
  try { const c = localStorage.getItem('wil:' + url); if (c) { const d = JSON.parse(c); mem.set(url, d); return d; } } catch { /* abaikan */ }
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json();
  mem.set(url, d);
  try { localStorage.setItem('wil:' + url, JSON.stringify(d)); } catch { /* kuota penuh */ }
  return d;
}

export async function getWilayah(level, parentId) {
  if (level > 0 && !parentId) return [];
  const order = srcIdx === null || Number.isNaN(srcIdx) ? [0, 1] : [srcIdx, ...[0, 1].filter((i) => i !== srcIdx)];
  for (const i of order) {
    const s = SOURCES[i]; const p = s.paths[level];
    const url = `${s.base}/${typeof p === 'function' ? p(parentId) : p}`;
    try {
      const data = await fetchJson(url);
      if (srcIdx !== i && level === 0) { srcIdx = i; try { localStorage.setItem('wil:src', String(i)); } catch { /* */ } }
      return data.map((d) => ({ id: String(d.id), label: titleCase(d[s.key] || d.name || d.nama) }));
    } catch (e) {
      // ID antar sumber tidak selalu sama, jadi level > 0 hanya mencoba sumber aktif
      if (level > 0) return [];
    }
  }
  return [];
}

// Pastikan input level 0..upto-1 punya data-id (untuk data hasil import yang hanya berisi nama)
async function ensureIds(inputs, upto) {
  let parent = null;
  for (let l = 0; l < upto; l++) {
    const inp = inputs[l];
    if (!inp.dataset.id && inp.value.trim()) {
      const list = await getWilayah(l, parent);
      const v = norm(inp.value).replace(/^(kabupaten|kab\.?|kota|kecamatan|kec\.?|kelurahan|desa|gampong)\s+/, '');
      const m = list.find((x) => norm(x.label) === norm(inp.value))
        || list.find((x) => norm(x.label).replace(/^(kabupaten|kota)\s+/, '') === v)
        || list.find((x) => norm(x.label).includes(v));
      if (m) inp.dataset.id = m.id;
    }
    parent = inp.dataset.id;
    if (!parent) return null;
  }
  return parent;
}

const LABELS = ['Provinsi', 'Kabupaten / Kota', 'Kecamatan', 'Kelurahan / Gampong'];

// inputs: [provinsi, kabupaten, kecamatan, kelurahan]
export function bindWilayahChain(inputs) {
  inputs.forEach((inp, level) => {
    attachAutocomplete(inp, {
      max: 40,
      smallList: 0,
      emptyHint: level > 0 ? `Pilih ${LABELS[level - 1]} terlebih dahulu` : '',
      source: async () => {
        if (level === 0) return getWilayah(0);
        const pid = await ensureIds(inputs, level);
        return pid ? getWilayah(level, pid) : [];
      },
      onSelect: () => {
        for (let j = level + 1; j < inputs.length; j++) { inputs[j].value = ''; inputs[j].dataset.id = ''; }
      },
    });
  });
}
