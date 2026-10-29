# Serenity — Sistem Informasi Gampong Digital

![versi](https://img.shields.io/badge/versi-2.9.6-0f766e) ![PWA](https://img.shields.io/badge/PWA-siap-c98a16) ![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-orange)

Aplikasi web (PWA) untuk pengelolaan data desa / gampong: data warga, dusun & kepala dusun, data master dropdown, laporan PDF/Excel, papan informasi yang bisa disebarkan ke WhatsApp warga, serta highlight Instagram desa.

**© Serenity Creativa 2026**

---


## Baru di v2.9.0 “Kirana”
- 📰 **3 model tampilan baca** — A Kartu Baca, B Lembar Kertas, C Dua Kolom — dipilih Super Admin, rapi di desktop, tablet, ponsel & PWA.
- 🖼️ Logo & ikon PNG transparan **tanpa latar putih**; layar pembuka PWA & pemuatan halaman mengikuti warna tema.
- 🏷️ Judul tab resmi yang bergerak perlahan: “Portal Resmi Gampong Deah Glumpang Powered by © 2026 Serenity Creativa Labs.”
- 💬 **Riwayat Chat Staf** di Audit Log: Super Admin membaca seluruh percakapan utuh + ekspor PDF/Excel.

## Baru di v2.8.0 “Nadi”
- 💬 **Chat Staf privat** 1-lawan-1 untuk Kepala Dusun, Pengelola Lembaga, Admin & Super Admin — notifikasi pesan masuk di kanan bawah, lencana belum dibaca, tanda “Dibaca”, notifikasi perangkat.
- 🔒 Isi percakapan dikunci oleh aturan keamanan basis data hanya untuk kedua anggotanya; setiap pesan tercatat utuh di Audit Log (khusus Super Admin); pesan permanen.

## Baru di v2.7.0 “Lumen”
- 📖 Tata baca nyaman tanpa kotak putih, halaman baca untuk berita lembaga & kegiatan rutin.
- ▶️ Link YouTube, TikTok, Instagram, Facebook, Vimeo, X, Spotify, Drive & foto otomatis jadi pemutar/foto.
- 🗞️ Admin › Lembaga › **Berita & Kegiatan** untuk mengelola berita semua lembaga.
- 💬 Petunjuk di setiap kolom isian; istilah teknis hanya terlihat Super Admin; perbaikan kursor animasi.

## Baru di v2.6.0 “Orbit”
- 🖱️ **Kursor animasi** (Dot + Ring, Glow, Jejak Neon, Blob) + efek klik, dan **ikon animasi** 3 tingkat — Super Admin › Tampilan & Tema.
- 🍎 Tema **macOS** (Sonoma & Dark): menu bar kaca, jendela berlampu lalu lintas, dock di ponsel.
- 📱 **Tampilan ringkas ponsel & tablet**: navigasi bawah, menu lembar bawah, kartu bergeser, dialog bottom sheet.

## Baru di v2.5.0 “Prisma”
- 🎨 Gaya **Gen Z Vibrant** (+ Neon Night, Acid, Sunset) dan 4 palet warna Gen Z di **Sistem › Tampilan & Tema**.
- 🔤 **Pustaka 38 huruf** — atur huruf judul & teks secara terpisah (Super Admin).

## Baru di v2.4.0 “Nebula”
- ⚡ **Sinkron Bertahap (delta sync)** — data disimpan di perangkat; saat dibuka hanya dokumen yang berubah yang dibaca. Kunjungan ulang beranda: **±3 read** (sebelumnya puluhan–ratusan). Data admin dienkripsi AES-GCM 256-bit.
- 📊 **Widget pengunjung realtime** (kiri bawah beranda) & menu **Sistem › Monitor & Analitik** (read/write/delete/download/upload, kuota gratis, kunjungan 30 hari) — khusus Super Admin.
- 📰 **Berita & Kegiatan Lembaga** bergulir otomatis di bawah Kegiatan Rutin; kecepatan diatur di **Sistem › Widget Beranda** (Super Admin).
- 🗂️ Data Master: **hapus kategori** (bawaan bisa dipulihkan), **geser ▲▼ antar kelompok**, bug hapus kategori diperbaiki.
- 👥 Grup baru **Admin › Manajemen Akun** untuk admin bercentang hijau; akun Super Admin tak terlihat oleh siapa pun.
- 💾 Cadangan **benar-benar lengkap** (hingga audit log), **pengingat tanggal 29**, notifikasi sukses hapus semua data.
- 🧾 Ekspor PDF/Excel tanpa nomor versi: *tanggal, jam • Deah Glumpang Powered by Serenity Creativa Labs. © 2026 All Rights Reserved*.

### Wajib setelah memperbarui ke v2.4.0
1. Deploy sekaligus hosting, Rules, dan indeks: `npm run deploy` (atau `firebase deploy --only hosting,firestore:rules,firestore:indexes`). Indeks komposit butuh beberapa menit untuk siap — selama itu aplikasi otomatis memakai muat penuh (tetap berjalan normal).
2. (Disarankan) Aktifkan **TTL** agar data kehadiran lama terhapus otomatis: Firebase Console → Firestore → *Time-to-live* → koleksi `presence`, field `exp`.
3. Login sekali sebagai Super Admin agar dokumen versi sinkron (`meta/pub`, `meta/adm`) dibuat.

## Baru di v2.3.0 “Aurora”
- Nama baru **Serenity**, ikon baru, dan **pengubah ikon** (Super Admin).
- **Latar belakang website** dari URL foto/video/YouTube (izin baru `latar`).
- **Badge pengguna**: centang biru/emas/hijau, developer, gamer, GitHub, Stack Overflow, Credly, Coursera, Google Cloud, dll. (Super Admin).
- **Linmas** di Lembaga Kemasyarakatan, dan **pengelola lembaga** yang diangkat Super Admin.
- Efek **Glassy / Blurry Aurora**, **Dark Glass Modern**, palet hangat (Terracotta, Creamy, Golden Hour, Sage, Soft Calm), dan 14 pasangan huruf.
- Dropdown tidak lagi tertutup saat diarahkan; peringatan tutup tab hanya bila ada isian belum disimpan; footer rata kanan.

## Baru di v2.2.0
- **Kelembagaan Gampong** — Pemerintahan, Adat & Keagamaan, LKG, Ekonomi, Pendidikan; pengurus, anggota, murid/santri, galeri YouTube, dokumen, ekspor.
- **Dokumen Publik** — RPJMG, APBG, Reusam, dll. dengan pencarian & filter.
- **Tampilan** — tema warna, model tata letak, font, mode gelap/terang; tata letak drag & drop (Super Admin).
- Ekspor mengikuti filter, kata sandi saat menghapus, editor teks kaya, media URL pada informasi.
- Hak akses baru: `lembaga`, `dokumen` (diatur Super Admin di Manajemen Akun).

## Fitur

| Modul | Keterangan |
|---|---|
| **Import Excel** | Upload `.xlsx/.xls/.csv`. Baris judul dideteksi otomatis (termasuk format 33 kolom *Data Master Kependudukan*). “Alamat Domisili” seperti *Dusun Cempaka, RT 02/RW 01* dipecah otomatis ke Dusun/RT/RW. NIK yang sudah ada diperbarui, bukan diduplikasi. Tersedia template Excel. |
| **Input manual** | Formulir 5 modul (Kependudukan, Sosial-Ekonomi, Kesehatan, Sektoral, Peristiwa) + wilayah. Semua dropdown memberi **saran saat mengetik** (tidak menampilkan seluruh daftar). Umur dihitung otomatis dari tanggal lahir. |
| **Wilayah seluruh Indonesia** | Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Gampong, berantai dan bisa dicari dengan mengetik. Wilayah desa default terisi otomatis. |
| **WhatsApp** | Setiap nomor HP warga & kepala dusun langsung bisa diklik ke WhatsApp. |
| **Data Master** | Tambah/ubah/hapus/urutkan pilihan dropdown. Buat **kategori dropdown baru** yang otomatis muncul di formulir. Nilai baru dari input/import otomatis masuk master. |
| **Dusun & Kepala Dusun** | Kelola dusun, kepala dusun (saran nama dari data warga), statistik jiwa/KK/L/P per dusun, ekspor per dusun. |
| **Laporan & Ekspor** | Rekap per kategori (dirinci per dusun) dan data warga tersaring → **PDF & Excel**. Biodata per warga ke PDF. |
| **Papan Informasi** | Pengumuman, berita kegiatan, acara desa (dengan tanggal, waktu, lokasi, gambar). Tampil di halaman publik & agenda. |
| **Kirim WhatsApp** | Sebarkan informasi ke semua warga / KK / satu dusun / semua kadus / warga terpilih, dengan personalisasi `{nama}` `{dusun}`. |
| **Instagram** | Postingan Instagram desa otomatis tampil di halaman **Highlight** (sinkron via API, bisa disembunyikan/disematkan, atau ditambah manual). |
| **Super Admin & Admin** | Super Admin (`serenityxcreative@gmail.com`) login **cukup password** dengan **klik 5× tulisan copyright**. Admin hanya didaftarkan oleh Super Admin dan memakai email + password, dengan **hak akses per fitur**. |
| **Audit Log** | Khusus Super Admin. Mencatat semua aktivitas: login/logout/gagal, akses & lihat detail warga, tambah/ubah (sebelum→sesudah)/hapus, import, ekspor, WhatsApp, pengaturan, manajemen admin, cadangan. Permanen, bisa disaring & diekspor. |
| **Cadangan & Pemulihan** | Unduh cadangan JSON dan **upload/pulihkan** kembali (gabungkan atau ganti total). |
| **Profil Gampong (publik)** | Menu dropdown: Profil, Sejarah, Visi & Misi, Struktur Organisasi, Lembaga, Layanan Administrasi, Transparansi Anggaran, Potensi & UMKM, Kontak & Peta, Infografis — diisi dari admin. |
| **Infografis & Insight** | Piramida penduduk, rasio jenis kelamin, usia produktif, rasio ketergantungan, dll. Admin mendapat insight tambahan (potensi salah sasaran bansos, BPJS, gizi) & **Kualitas Data**. |
| **Jadwal Sholat** | Panel kiri beranda, perhitungan Kemenag RI secara lokal (offline), hitung mundur ke waktu sholat berikutnya, tanggal Hijriah. |
| **Portal Data Publik** | Halaman `#/data`: kartu kategori non-sensitif (dusun, agama, pendidikan, pekerjaan, umur, status kawin…) yang bisa diklik → donat, tabel, unduh Excel. |
| **Running text** | Teks berjalan di footer publik, diatur di Pengaturan. |
| **Kegiatan Rutin** | Panel kanan beranda: pengajian, wirid yasin, posyandu, gotong royong, dll. Kegiatan hari ini disorot. |
| **Keamanan** | Tanpa API key di kode sumber, App Check (anti-bot), konfirmasi password untuk import/restore/hapus massal, logout otomatis, cache dihapus saat logout. Lihat **SECURITY.md**. |
| **PWA** | Bisa dipasang di HP/PC, bekerja offline (data Firestore di-cache), notifikasi versi baru. |

## Di mana `index.html` dan halaman login?

- **`public/index.html`** — halaman utama aplikasi (semua halaman ada di sini).
- **Halaman login** = `public/index.html#/login` (atau `public/login.html`). Admin masuk dengan email + password. **Super Admin: klik 5× tulisan “© Serenity Creativa 2026”** di bagian bawah halaman mana pun, lalu masukkan password saja.
- `index.html` di folder utama hanya meneruskan ke `public/index.html`.
- ⚠️ Jangan membuka `index.html` dengan **dobel-klik** — browser memblokir JavaScript dari `file://`. Buka lewat alamat hosting (`https://digides-8423e.web.app/#/login`) atau jalankan `npx serve public` lalu buka `http://localhost:3000/#/login`.

## Struktur Proyek

```
serenity/
├─ index.html               ← meneruskan ke public/index.html
├─ public/                  ← situs yang di-deploy ke Firebase Hosting
│  ├─ index.html            ← HALAMAN UTAMA aplikasi (login: index.html#/login)
│  ├─ login.html            ← jalan pintas ke halaman login
│  ├─ manifest.webmanifest  ← PWA
│  ├─ sw.js                 ← service worker (offline + cache)
│  ├─ css/app.css
│  ├─ icons/
│  └─ js/
│     ├─ config.js          ← VERSI, copyright, email Super Admin, site key App Check (tanpa API key)
│     ├─ firebase.js        ← memuat konfigurasi Firebase saat runtime (/__/firebase/init.json)
│     ├─ firebase-config.example.js ← contoh konfigurasi untuk uji lokal
│     ├─ core.js            ← peran & hak akses, audit log, konfirmasi password
│     ├─ security.js        ← login Super Admin, manajemen admin, audit log, cadangan & pemulihan
│     ├─ cms.js             ← Profil Gampong, infografis, jadwal sholat, kegiatan rutin
│     ├─ praytimes.js       ← perhitungan jadwal sholat (Kemenag)
│     ├─ fields.js          ← skema data warga & nilai bawaan master
│     ├─ wilayah.js         ← dropdown wilayah Indonesia
│     ├─ exporter.js        ← ekspor PDF & Excel
│     ├─ ui.js              ← autocomplete, modal, toast, WhatsApp
│     └─ app.js             ← aplikasi utama
├─ firestore.rules          ← aturan keamanan berbasis peran
├─ SECURITY.md              ← panduan menangani kebocoran API key, App Check, biaya
├─ firebase.json / .firebaserc
├─ scripts/
│  ├─ bump-version.mjs      ← naikkan versi di semua berkas
│  └─ sync-instagram.mjs    ← sinkron Instagram (dipakai GitHub Actions)
└─ .github/workflows/
   ├─ deploy.yml            ← deploy otomatis setiap push ke main
   └─ instagram-sync.yml    ← sinkron Instagram setiap jam
```

Tanpa proses *build* — cukup HTML, CSS dan JavaScript modul.

---

## Pemasangan (sekali saja, ±15 menit)

### 1. Siapkan Firebase (console.firebase.google.com → proyek **digides-8423e**)

1. **Authentication → Sign-in method** → aktifkan **Email/Password**.
2. **Authentication → Users → Add user** → email `serenityxcreative@gmail.com` dan password pilihan Anda. *(Ini password Super Admin.)* Profil Super Admin dibuat otomatis saat login pertama.
3. **Authentication → Settings → User actions** → biarkan “Enable create (sign-up)” **aktif** agar Super Admin bisa mendaftarkan admin dari aplikasi (akun tanpa profil tetap tidak punya akses — dikunci Firestore Rules).
4. **Authentication → Settings → Authorized domains** → pastikan domain hosting Anda ada (`digides-8423e.web.app` otomatis ada).
5. **Firestore Database → Create database** → mode *production*, lokasi `asia-southeast2 (Jakarta)`.
6. **Firestore → Rules** → tempel isi `firestore.rules` → **Publish** (atau otomatis via GitHub Actions di langkah 3).

> Paket gratis (Spark) sudah cukup. Gambar informasi dikompres dan disimpan di Firestore, jadi **tidak perlu Firebase Storage**.

> **Penting (keamanan):** ikuti **SECURITY.md** untuk membatasi API key lama yang sempat ter-commit di v1.0.0 dan mengaktifkan App Check.

### 2. Upload ke GitHub

```bash
cd serenity
git init
git add .
git commit -m "Serenity v2.0.0"
git branch -M main
git remote add origin https://github.com/<akun-anda>/serenity.git
git push -u origin main
```

### 3. Deploy otomatis via GitHub Actions

1. Firebase Console → ⚙ **Project settings → Service accounts → Generate new private key** → unduh berkas JSON.
2. Di Google Cloud IAM (console.cloud.google.com/iam-admin), pastikan service account itu punya peran **Firebase Hosting Admin** dan **Firebase Rules Admin** (peran bawaan *Firebase Admin SDK Administrator Service Agent* biasanya sudah cukup untuk Firestore; tambahkan dua peran tadi bila deploy ditolak).
3. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `FIREBASE_SERVICE_ACCOUNT` = seluruh isi berkas JSON tadi.
4. Push ke `main` → buka tab **Actions** → workflow **Deploy ke Firebase** berjalan. Selesai, aplikasi ada di **https://digides-8423e.web.app**.
5. Setiap deploy juga membuat **GitHub Release** sesuai versi di `package.json`.

> Alternatif manual: `npm i -g firebase-tools && firebase login && firebase deploy`.

### 4. Login pertama

1. Buka `https://digides-8423e.web.app` → gulir ke bawah → **klik 5× tulisan “© Serenity Creativa 2026”** → masukkan password Super Admin.
2. **Pengaturan** → isi Profil Gampong, koordinat **Jadwal Sholat**, dan kategori **Infografis** publik.
3. **Profil Gampong** → isi Visi Misi, Struktur, Layanan, dll. **Kegiatan Rutin** → isi jadwal pengajian.
4. **Import Excel** (wajib konfirmasi password).
5. **Manajemen Admin** → daftarkan operator/humas dengan hak akses yang sesuai.

---

## Koneksi Firebase

Mulai v2.1.0 konfigurasi Firebase tertanam di `public/js/firebase-config.js`, sehingga aplikasi **langsung terhubung** di semua browser & perangkat. Keamanan dijaga Firestore Rules yang diperketat, pembatasan API key, dan App Check — **wajib ikuti SECURITY.md bagian 1 & 2**.

## Peran pengguna

| Peran | Dibuat oleh | Login | Akses |
|---|---|---|---|
| **Super Admin** | otomatis (`serenityxcreative@gmail.com`) | klik 5× “© Serenity Creativa 2026”, password saja | Semua fitur, akun Admin & Kadus, Audit Log, Cadangan |
| **Admin** | Super Admin | `#/login` email + password | Sesuai hak akses yang dicentang |
| **Kepala Dusun** | Super Admin / Admin berizin *Kelola akun Kepala Dusun* (tombol **Akun Kadus** di kartu dusun) | `#/login` email + password | Hanya warga dusunnya: dasbor, data warga, laporan, WhatsApp |

Semua peran dapat mengganti **foto profil** di *Pengaturan → Akun Saya*. Informasi yang diterbitkan otomatis memuat tanda **“Diterbitkan oleh [Peran] [Nama]”**.

## Mengatasi “Konfigurasi Firebase belum tersedia”

API key tidak disimpan di repositori. Aplikasi mengambil konfigurasi secara berurutan dari:
1. **Firebase Hosting** — `https://digides-8423e.web.app` (otomatis, cara yang disarankan).
2. **`public/js/firebase-config.local.js`** — untuk uji lokal (di-`.gitignore`).
3. **Situs Firebase Hosting proyek** — bila dibuka dari hosting lain, konfigurasi diambil dari `digides-8423e.web.app/__/firebase/init.js` (syarat: sudah pernah deploy ke Firebase Hosting minimal sekali).
4. **Tempel konfigurasi** di layar bantuan — hanya tersimpan di browser tersebut.

Jika layar itu muncul:
- Pastikan workflow **Deploy ke Firebase** di tab GitHub **Actions** berhasil (centang hijau), lalu buka `https://digides-8423e.web.app`.
- Pastikan Firebase Console → Project settings → **Your apps** sudah berisi aplikasi **Web**.
- **GitHub Pages:** buat secret `FIREBASE_WEB_CONFIG` berisi objek config, mis. `{"apiKey":"…","authDomain":"digides-8423e.firebaseapp.com","projectId":"digides-8423e","appId":"…","messagingSenderId":"…","storageBucket":"digides-8423e.firebasestorage.app"}`, aktifkan *Settings → Pages → Source: GitHub Actions*, lalu jalankan workflow **Deploy ke GitHub Pages**. Tambahkan domain `*.github.io` ke *Authorized domains* (Authentication) dan ke pembatasan API key.

## Integrasi Instagram

1. Jadikan akun Instagram desa akun **Profesional** (Bisnis/Kreator).
2. Buka [developers.facebook.com/apps](https://developers.facebook.com/apps) → *Create app* → kasus penggunaan **Instagram** → **API setup with Instagram login** → tambahkan akun → **Generate token**.
3. Tempel token di aplikasi: **Admin → Instagram → Access Token → Simpan**. Token (60 hari) diperpanjang otomatis.
4. Sinkronisasi berjalan:
   - otomatis saat admin membuka dasbor (maksimal tiap 3 jam), tombol **Sinkronkan sekarang**, dan
   - **setiap jam** lewat workflow `instagram-sync.yml` (memakai secret `FIREBASE_SERVICE_ACCOUNT` yang sama) — postingan baru muncul di Highlight tanpa admin membuka aplikasi.

Tanpa token pun Anda bisa **Tambah manual** (tautan postingan + gambar).

## WhatsApp

- Nomor `08…` otomatis diubah ke format internasional `628…` untuk tautan `wa.me`.
- **Kirim WhatsApp**: pilih penerima, tekan **Buka pesan berikutnya** → WhatsApp terbuka dengan nomor & pesan terisi → tekan Kirim. Kemajuan tercatat.
- WhatsApp tidak mengizinkan kirim massal otomatis kecuali melalui WhatsApp Business API (berbayar). Untuk ribuan warga, gunakan tombol **Kirim ke Grup / Kontak lain** ke grup WhatsApp desa.

## Versi & Rilis

Versi tampil di footer, sidebar, halaman Pengaturan, PDF/Excel hasil ekspor, dan nama cache service worker.

```bash
node scripts/bump-version.mjs patch "Perbaikan kecil"     # 2.0.0 → 2.0.1
node scripts/bump-version.mjs minor "Fitur baru"          # 2.0.1 → 2.1.0
git commit -am "v2.1.0" && git push                         # deploy + release otomatis
```

Pengguna PWA akan melihat notifikasi **“Versi baru tersedia → Muat ulang”**.

## Keamanan

Ringkas (lengkapnya di **SECURITY.md**):
- **Tidak ada API key di repositori.** Konfigurasi dibaca dari `/__/firebase/init.json` milik Firebase Hosting.
- Batasi API key di Google Cloud Console (domain & API) dan aktifkan **App Check** untuk mencegah bot & pencurian kuota.
- Data warga hanya bisa dibaca akun dengan izin “Lihat data warga”; publik hanya melihat statistik agregat.
- Audit log tidak dapat diubah/dihapus; token Instagram disimpan di koleksi `private`.

### Hak akses admin
`warga` (lihat), `wargaEdit`, `wargaDelete`, `import`, `export`, `dusun`, `master`, `informasi`, `broadcast`, `instagram`, `profil`, `kegiatan`, `pengaturan`. Template cepat: *Operator Data*, *Humas/Informasi*, *Hanya Lihat*, *Admin Penuh*. Manajemen Admin, Audit Log, dan Cadangan selalu khusus Super Admin.

## Pengembangan lokal

```bash
cp public/js/firebase-config.example.js public/js/firebase-config.local.js   # isi nilainya (berkas ini di-.gitignore)
npm run dev     # http://localhost:5173
```
Tambahkan `localhost` di *Authorized domains* Firebase Authentication bila ingin login dari lokal. Alternatif tanpa berkas lokal: `npx firebase-tools serve` (otomatis menyediakan `/__/firebase/init.json`).

---

**Serenity v2.3.0 “Aurora”** — Deah Glumpang ◦ Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
