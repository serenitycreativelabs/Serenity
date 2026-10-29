// Skema data warga, nilai bawaan Data Master, dan pencocokan kolom Excel

export const GROUPS = [
  { id: 'dasar', label: 'I. Data Kependudukan Dasar' },
  { id: 'wilayah', label: 'Wilayah & Domisili' },
  { id: 'sosek', label: 'II. Sosial & Kesejahteraan Ekonomi' },
  { id: 'kesehatan', label: 'III. Kesehatan Warga' },
  { id: 'sektoral', label: 'IV. Sektoral & Mata Pencaharian' },
  { id: 'peristiwa', label: 'V. Peristiwa Kependudukan' },
  { id: 'tambahan', label: 'Data Tambahan (kategori kustom)' },
];

const S = (key, label, group, aliases = [], extra = {}) =>
  ({ key, label, group, type: 'select', master: key, aliases, ...extra });

export const FIELDS = [
  { key: 'idWarga', label: 'ID Warga', group: 'dasar', type: 'text', aliases: ['idwarga', 'id'] },
  { key: 'nik', label: 'NIK', group: 'dasar', type: 'nik', aliases: ['nik', 'nomorindukkependudukan'] },
  { key: 'noKk', label: 'No. KK', group: 'dasar', type: 'nik', aliases: ['nokk', 'nomorkk', 'nomorkartukeluarga', 'kk'] },
  { key: 'nama', label: 'Nama Lengkap', group: 'dasar', type: 'text', required: true, aliases: ['namalengkap', 'nama'] },
  S('jk', 'Jenis Kelamin', 'dasar', ['lp', 'jeniskelamin', 'jk', 'gender', 'kelamin']),
  { key: 'tempatLahir', label: 'Tempat Lahir', group: 'dasar', type: 'text', aliases: ['tempatlahir'] },
  { key: 'tglLahir', label: 'Tanggal Lahir', group: 'dasar', type: 'date', aliases: ['tanggallahir', 'tgllahir'] },
  { key: 'umur', label: 'Umur', group: 'dasar', type: 'number', aliases: ['umur', 'usia'] },
  S('agama', 'Agama', 'dasar', ['agama']),
  S('pendidikan', 'Pendidikan Terakhir', 'dasar', ['pendidikanterakhir', 'pendidikan']),
  S('pekerjaan', 'Pekerjaan', 'dasar', ['pekerjaan']),
  S('shdk', 'Hubungan Keluarga (SHDK)', 'dasar', ['shdk', 'hubungankeluarga', 'statushubungan', 'hubungan']),
  S('statusKawin', 'Status Perkawinan', 'dasar', ['statuskawin', 'statusperkawinan', 'perkawinan']),
  S('golDarah', 'Golongan Darah', 'dasar', ['golongandarah', 'goldarah']),
  { key: 'noHp', label: 'No. HP / WhatsApp', group: 'dasar', type: 'phone', aliases: ['nomortelepon', 'notelepon', 'nohp', 'nomorhp', 'telepon', 'hp', 'whatsapp', 'nowa'] },

  { key: 'provinsi', label: 'Provinsi', group: 'wilayah', type: 'wilayah', level: 0, aliases: ['provinsi'] },
  { key: 'kabupaten', label: 'Kabupaten / Kota', group: 'wilayah', type: 'wilayah', level: 1, aliases: ['kabupatenkota', 'kabupaten', 'kota'] },
  { key: 'kecamatan', label: 'Kecamatan', group: 'wilayah', type: 'wilayah', level: 2, aliases: ['kecamatan'] },
  { key: 'kelurahan', label: 'Kelurahan / Gampong', group: 'wilayah', type: 'wilayah', level: 3, aliases: ['kelurahangampong', 'kelurahan', 'gampong', 'desakelurahan', 'desa'] },
  { key: 'dusun', label: 'Dusun', group: 'wilayah', type: 'dusun', aliases: ['dusun', 'jorong', 'lingkungan'] },
  { key: 'rt', label: 'RT', group: 'wilayah', type: 'text', aliases: ['rt'] },
  { key: 'rw', label: 'RW', group: 'wilayah', type: 'text', aliases: ['rw'] },
  { key: 'alamat', label: 'Alamat Domisili', group: 'wilayah', type: 'text', aliases: ['alamatdomisili', 'alamat'] },

  { key: 'pendapatan', label: 'Pendapatan / Bulan (Rp)', group: 'sosek', type: 'number', aliases: ['pendapatan', 'penghasilan'] },
  S('desil', 'Desil Kesejahteraan', 'sosek', ['desil']),
  S('bansos', 'Penerimaan Bansos', 'sosek', ['penerimaanbansos', 'bansos', 'bantuansosial']),
  S('rumah', 'Status Kepemilikan Rumah', 'sosek', ['statuskepemilikanrumah', 'kepemilikanrumah', 'rumah']),
  S('listrik', 'Daya Listrik (PLN)', 'sosek', ['dayalistrik', 'listrik']),
  S('air', 'Sumber Air Bersih', 'sosek', ['sumberairbersih', 'sumberair']),
  S('sanitasi', 'Fasilitas Sanitasi / Jamban', 'sosek', ['fasilitassanitasi', 'sanitasi', 'jamban']),

  S('bpjs', 'Status Kepesertaan BPJS', 'kesehatan', ['statuskepesertaanbpjs', 'bpjs', 'jkn']),
  S('faskes', 'Fasilitas Kesehatan Tk. I', 'kesehatan', ['fasilitaskesehatan', 'faskes']),
  S('penyakit', 'Riwayat Penyakit Kronis', 'kesehatan', ['riwayatpenyakit', 'penyakit']),
  S('gizi', 'Status Gizi', 'kesehatan', ['statusgizi', 'gizi']),
  S('disabilitas', 'Penyandang Disabilitas', 'kesehatan', ['penyandangdisabilitas', 'disabilitas']),
  S('vaksin', 'Status Vaksinasi', 'kesehatan', ['statusvaksinasi', 'vaksinasi', 'vaksin']),

  S('sektor', 'Sektor Utama', 'sektoral', ['sektorutama', 'sektor']),
  S('profesi', 'Komoditas / Profesi Spesifik', 'sektoral', ['komoditas', 'profesi']),
  { key: 'luasLahan', label: 'Luas Lahan / Usaha', group: 'sektoral', type: 'text', aliases: ['luaslahan', 'luasusaha', 'luas'] },
  S('kelompok', 'Kelompok Usaha / Tani / Nelayan', 'sektoral', ['kelompokusaha', 'kelompoktani', 'kelompok']),
  S('alat', 'Alat Kerja / Sarpras Utama', 'sektoral', ['alatkerja', 'sarpras']),
  S('skala', 'Skala Usaha', 'sektoral', ['skalausaha', 'skala']),

  S('peristiwa', 'Status Peristiwa', 'peristiwa', ['statusperistiwa', 'peristiwa', 'mutasi']),
  { key: 'tglPeristiwa', label: 'Tanggal Mutasi / Kejadian', group: 'peristiwa', type: 'date', aliases: ['tanggalmutasi', 'tanggalkejadian', 'tanggalperistiwa'] },
  { key: 'ketPeristiwa', label: 'Keterangan Dokumen / Peristiwa', group: 'peristiwa', type: 'textarea', aliases: ['keterangan'] },
];

export const DEFAULT_MASTER = {
  jk: ['Laki-laki', 'Perempuan'],
  agama: ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Kepercayaan'],
  pendidikan: ['Tidak / Belum Sekolah', 'Belum Tamat SD', 'SD / Sederajat', 'SLTP / Sederajat', 'SLTA / Sederajat', 'Diploma I / II', 'Akademi / Diploma III', 'Diploma IV / Strata I', 'Strata II', 'Strata III'],
  pekerjaan: ['Belum / Tidak Bekerja', 'Mengurus Rumah Tangga', 'Pelajar / Mahasiswa', 'Petani / Pekebun', 'Nelayan / Perikanan', 'Peternak', 'Pedagang', 'Wiraswasta', 'Karyawan Swasta', 'PNS', 'TNI', 'POLRI', 'Guru', 'Buruh Harian Lepas', 'Pensiunan', 'Lainnya'],
  shdk: ['Kepala Keluarga', 'Suami', 'Istri', 'Anak', 'Menantu', 'Cucu', 'Orang Tua', 'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya'],
  statusKawin: ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'],
  golDarah: ['A', 'B', 'AB', 'O', 'Tidak Tahu'],
  desil: ['Desil 1 (Sangat Miskin)', 'Desil 2 (Miskin)', 'Desil 3 (Hampir Miskin)', 'Desil 4 (Rentan)', 'Desil 5 (Menengah Bawah)', 'Desil 6+ (Mampu)'],
  bansos: ['Tidak Menerima', 'PKH', 'BPNT / Sembako', 'BLT Dana Desa', 'PBI JKN', 'PIP', 'Lainnya'],
  rumah: ['Milik Sendiri', 'Milik Sendiri (Sederhana)', 'Sewa / Kontrak', 'Menumpang / Keluarga', 'Rumah Dinas'],
  listrik: ['Tidak Ada Listrik', 'Non-PLN', '450 VA (Bersubsidi)', '900 VA (Bersubsidi)', '900 VA (Non-Subsidi)', '1300 VA', '2200 VA', '> 2200 VA'],
  air: ['PDAM', 'Sumur Bor Terlindungi', 'Sumur Gali', 'Mata Air Alami Terlindungi', 'Air Hujan', 'Air Kemasan / Isi Ulang', 'Sungai'],
  sanitasi: ['Jamban Sendiri (Septic Tank)', 'Jamban Bersama / Komunal', 'Jamban Umum', 'Tidak Ada'],
  bpjs: ['Aktif (PBI APBN)', 'Aktif (PBI APBD)', 'Aktif (Mandiri)', 'Aktif (PPU / Pekerja)', 'Tidak Aktif / Nunggak', 'Belum Terdaftar'],
  faskes: ['Pustu Desa', 'Puskesmas Kecamatan', 'Klinik Pratama Sehat', 'RSUD Kabupaten', 'Dokter Praktik Mandiri'],
  penyakit: ['Tidak Ada', 'Hipertensi', 'Diabetes Melitus', 'Kolesterol', 'Asam Urat', 'Asma Ringan', 'Jantung', 'TBC', 'Stroke', 'Gagal Ginjal'],
  gizi: ['Gizi Baik', 'Normal', 'Gizi Kurang', 'Gizi Buruk', 'Stunting', 'Obesitas'],
  disabilitas: ['Tidak Ada', 'Fisik / Tuna Daksa', 'Netra', 'Rungu / Wicara', 'Mental / Intelektual', 'Ganda'],
  vaksin: ['Belum Vaksin', 'Dosis 1', 'Lengkap (Dosis 2)', 'Lengkap (Booster)'],
  sektor: ['Pertanian', 'Peternakan', 'Perikanan & Kelautan', 'Perdagangan UMKM', 'Industri Rumah Tangga', 'Jasa / Ketenagakerjaan Lainnya'],
  profesi: ['Petani Padi', 'Petani Sayur', 'Buruh Tani', 'Peternak Ayam', 'Peternak Sapi', 'Nelayan Tangkap', 'Pedagang Kelontong', 'Wiraswasta Kuliner', 'Pengrajin Kayu', 'Montir Bengkel', 'Buruh Bangunan', 'PNS', 'Guru Honorer', 'Karyawan Swasta', 'Ibu Rumah Tangga'],
  kelompok: ['Poktan Subur Makmur 1', 'Poktan Subur Makmur 2', 'Poktan Subur Makmur 3', 'Poktan Subur Makmur 4', 'Kelompok Ternak Lembu Barokah', 'KUB Bahari Sejahtera 1', 'KUB Bahari Sejahtera 2', 'KUB Bahari Sejahtera 3', 'Paguyuban UMKM Mandiri'],
  alat: ['Cangkul', 'Cangkul & Pompa Air', 'Hand Tractor, Cangkul', 'Kandang Semi Permanen', 'Perahu Motor Tempel & Jaring Insang', 'Kulkas Freezer & Kompor Gas', 'Etalase Gerobak, Timbangan Digital'],
  skala: ['Mikro', 'Kecil', 'Menengah', 'Besar'],
  peristiwa: ['Menetap Tetap', 'Kelahiran Baru', 'Pindah Masuk', 'Pindah Keluar', 'Kematian', 'Perubahan KK / Status Kawin'],
  kategoriKegiatan: ['Pengajian', 'Wirid Yasin', 'Majelis Taklim', 'Gotong Royong', 'Posyandu', 'Olahraga', 'Rapat Gampong', 'Kesenian', 'Lainnya'],
  kategoriInfo: ['Pengumuman', 'Berita Kegiatan', 'Acara Desa', 'Gotong Royong', 'Kesehatan', 'Pembangunan', 'Lainnya'],
};

export const MASTER_EXTRA_LABELS = { kategoriInfo: 'Kategori Papan Informasi', kategoriKegiatan: 'Kategori Kegiatan Rutin' };

// Kelompok umur (kategori turunan untuk rekap)
export const AGE_GROUPS = [
  [0, 5, 'Balita (0–5)'], [6, 12, 'Anak (6–12)'], [13, 17, 'Remaja (13–17)'],
  [18, 25, 'Pemuda (18–25)'], [26, 45, 'Dewasa (26–45)'], [46, 59, 'Pra-Lansia (46–59)'], [60, 200, 'Lansia (60+)'],
];
export function ageGroup(umur) {
  const n = Number(umur);
  if (umur === '' || umur == null || Number.isNaN(n)) return '';
  const g = AGE_GROUPS.find(([a, b]) => n >= a && n <= b);
  return g ? g[2] : '';
}

export const normKey = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// Cocokkan baris header Excel → field. Mengembalikan array (index kolom → key | null)
export function mapHeaders(headers, fields = FIELDS) {
  const cands = [];
  headers.forEach((h, col) => {
    const n = normKey(h);
    if (!n) return;
    for (const f of fields) {
      const aliases = [normKey(f.label), ...(f.aliases || []).map(normKey), normKey(f.key)];
      let best = 0;
      for (const a of aliases) {
        if (!a) continue;
        if (n === a) best = Math.max(best, 1000 + a.length);
        else if (n.startsWith(a) && a.length >= 2) best = Math.max(best, 500 + a.length);
        else if (a.length >= 4 && n.includes(a)) best = Math.max(best, a.length);
      }
      if (best) cands.push({ col, key: f.key, score: best });
    }
  });
  cands.sort((a, b) => b.score - a.score);
  const map = new Array(headers.length).fill(null);
  const used = new Set();
  for (const c of cands) {
    if (map[c.col] !== null || used.has(c.key)) continue;
    map[c.col] = c.key; used.add(c.key);
  }
  return map;
}

export function ageFromDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a >= 0 && a < 150 ? a : '';
}

// "Dusun Cempaka, RT 02/RW 01" → { dusun:'Cempaka', rt:'02', rw:'01' }
export function parseAlamat(s) {
  const out = {};
  const str = String(s || '');
  const d = str.match(/dusun\s+([^,;/]+?)(?=\s*(,|;|rt\b|rw\b|$))/i);
  if (d) out.dusun = d[1].trim();
  const rt = str.match(/\brt\.?\s*0*(\d{1,3})/i);
  if (rt) out.rt = rt[1].padStart(2, '0');
  const rw = str.match(/\brw\.?\s*0*(\d{1,3})/i);
  if (rw) out.rw = rw[1].padStart(2, '0');
  return out;
}

const JK_MAP = { l: 'Laki-laki', lk: 'Laki-laki', laki: 'Laki-laki', lakilaki: 'Laki-laki', pria: 'Laki-laki', male: 'Laki-laki', p: 'Perempuan', pr: 'Perempuan', perempuan: 'Perempuan', wanita: 'Perempuan', female: 'Perempuan' };

// Samakan nilai dengan item master (tidak peka huruf besar/kecil)
export function canonical(key, value, items) {
  let v = String(value ?? '').trim();
  if (!v || v === '-') return '';
  if (key === 'jk') { const m = JK_MAP[normKey(v)]; if (m) return m; }
  const n = normKey(v);
  const hit = (items || []).find((x) => normKey(x) === n);
  return hit || v;
}

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'x';
}
