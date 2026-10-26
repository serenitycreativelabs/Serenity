# DigiDes — Sistem Informasi Desa Digital

![versi](https://img.shields.io/badge/versi-1.0.0-0f766e) ![PWA](https://img.shields.io/badge/PWA-siap-c98a16) ![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-orange)

Aplikasi web (PWA) untuk pengelolaan data desa / gampong: data warga, dusun & kepala dusun, data master dropdown, laporan PDF/Excel, papan informasi yang bisa disebarkan ke WhatsApp warga, serta highlight Instagram desa.

**© Serenity Creativa 2026**

---

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
| **Akun admin** | Login **cukup password**. Ubah password & email dari dalam aplikasi. Lupa password via email. |
| **PWA** | Bisa dipasang di HP/PC, bekerja offline (data Firestore di-cache), notifikasi versi baru. |

## Di mana `index.html` dan halaman login?

- **`public/index.html`** — halaman utama aplikasi (semua halaman ada di sini).
- **Halaman login** = `public/index.html#/login` (atau buka `public/login.html` yang langsung meneruskan ke sana). Login cukup memasukkan password.
- `index.html` di folder utama hanya meneruskan ke `public/index.html`.
- ⚠️ Jangan membuka `index.html` dengan **dobel-klik** — browser memblokir JavaScript dari `file://`. Buka lewat alamat hosting (`https://digides-8423e.web.app/#/login`) atau jalankan `npx serve public` lalu buka `http://localhost:3000/#/login`.

## Struktur Proyek

```
digides/
├─ index.html               ← meneruskan ke public/index.html
├─ public/                  ← situs yang di-deploy ke Firebase Hosting
│  ├─ index.html            ← HALAMAN UTAMA aplikasi (login: index.html#/login)
│  ├─ login.html            ← jalan pintas ke halaman login
│  ├─ manifest.webmanifest  ← PWA
│  ├─ sw.js                 ← service worker (offline + cache)
│  ├─ css/app.css
│  ├─ icons/
│  └─ js/
│     ├─ config.js          ← konfigurasi Firebase, VERSI, copyright
│     ├─ firebase.js        ← inisialisasi SDK Firebase
│     ├─ fields.js          ← skema data warga & nilai bawaan master
│     ├─ wilayah.js         ← dropdown wilayah Indonesia
│     ├─ exporter.js        ← ekspor PDF & Excel
│     ├─ ui.js              ← autocomplete, modal, toast, WhatsApp
│     └─ app.js             ← aplikasi utama
├─ firestore.rules          ← aturan keamanan database
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
2. **Authentication → Users → Add user** → email `serenityxcreative@gmail.com` dan password pilihan Anda. *(Ini password yang dipakai untuk login.)*
3. **Authentication → Settings → User actions** → **matikan** “Enable create (sign-up)” agar orang lain tidak bisa membuat akun.
4. **Authentication → Settings → Authorized domains** → pastikan domain hosting Anda ada (`digides-8423e.web.app` otomatis ada).
5. **Firestore Database → Create database** → mode *production*, lokasi `asia-southeast2 (Jakarta)`.
6. **Firestore → Rules** → tempel isi `firestore.rules` → **Publish** (atau otomatis via GitHub Actions di langkah 3).

> Paket gratis (Spark) sudah cukup. Gambar informasi dikompres dan disimpan di Firestore, jadi **tidak perlu Firebase Storage**.

### 2. Upload ke GitHub

```bash
cd digides
git init
git add .
git commit -m "DigiDes v1.0.0"
git branch -M main
git remote add origin https://github.com/<akun-anda>/digides.git
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

Buka `https://digides-8423e.web.app/#/login` → masukkan **password saja** → isi **Pengaturan → Profil Desa** (nama gampong & wilayah) → **Import Excel**.

---

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
node scripts/bump-version.mjs patch "Perbaikan kecil"     # 1.0.0 → 1.0.1
node scripts/bump-version.mjs minor "Fitur baru"          # 1.0.1 → 1.1.0
git commit -am "v1.1.0" && git push                         # deploy + release otomatis
```

Pengguna PWA akan melihat notifikasi **“Versi baru tersedia → Muat ulang”**.

## Keamanan

- Data warga, dusun & master **hanya** bisa dibaca akun admin yang terdaftar di koleksi `admins` (lihat `firestore.rules`).
- Publik hanya melihat: profil desa, statistik ringkas (jumlah penduduk/KK/L/P/dusun), informasi yang diterbitkan, dan highlight Instagram.
- `apiKey` Firebase di `config.js` memang bersifat publik (bukan rahasia); keamanan dijaga oleh aturan Firestore & Authentication.
- Token Instagram disimpan di koleksi `private` yang hanya bisa dibaca admin.

## Pengembangan lokal

```bash
npm run dev     # http://localhost:5173
```
Tambahkan `localhost` di *Authorized domains* Firebase Authentication bila ingin login dari lokal.

---

**DigiDes v1.0.0** — © Serenity Creativa 2026. Hak cipta dilindungi.
