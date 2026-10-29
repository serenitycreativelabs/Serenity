# Catatan Perubahan

## v2.4.2 — 2026.10.29 (R10 · Stable)
### Perbaikan
- **Tema/warna lama sesekali muncul saat website dibuka.** Halaman pertama sempat digambar dengan warna bawaan sebelum pengaturan tema Super Admin termuat. Kini tema terakhir (warna, huruf, model, efek, sudut, mode gelap/terang) diingat di perangkat dan diterapkan **sebelum halaman tampil**, dan tampilan pertama menunggu pengaturan termuat (maks. 2,5 detik).

## v2.4.1 — 2026.10.29 (R9 · Stable)
### Perbaikan
- Workflow **Sinkron Instagram** gagal dengan `8 RESOURCE_EXHAUSTED: Quota exceeded` saat kuota harian Firestore habis. Kini dilewati dengan peringatan (workflow tetap hijau) dan dicoba lagi pada jadwal berikutnya.
- Sinkron Instagram jauh lebih hemat: jadwal tiap **6 jam** (sebelumnya tiap jam), hanya menulis bila ada postingan baru/berubah (sidik SHA-256), penyegaran URL media sekali sehari, batas waktu 5 menit & tanpa eksekusi ganda.

## v2.4.0 “Nebula” — 2026.10.29 (Build 2026.10.29 · R8 · Stable)
> Fokus rilis: **hemat kuota Firestore**, **analitik & monitoring**, **cadangan yang benar-benar lengkap**, dan perapian panel admin.

### ⚡ Sinkron Bertahap (Delta Sync) — hemat kuota read
- Mesin sinkron baru (`js/sync.js`). Data disimpan di perangkat (IndexedDB); saat halaman/dasbor dibuka aplikasi **hanya meminta dokumen yang berubah sejak kunjungan terakhir**.
- Dokumen versi `meta/pub` (publik) & `meta/adm` (admin) didengarkan realtime — 1 read per perubahan, bukan seluruh koleksi.
- Bila versi sama → **0 read** (data dari perangkat). Bila berubah → hanya dokumen ber-`syncAt` baru + catatan hapus (`hapus`) + 1 hitungan (*count aggregation*). Bila jumlah tidak cocok → muat ulang penuh otomatis (data selalu benar).
- Berlaku untuk **pengunjung umum** (pengaturan, statistik, informasi, lembaga, dokumen, kegiatan, profil, Instagram) dan **admin** (warga, dusun, data master, dll.).
- **Keamanan**: data publik disimpan apa adanya; data admin (warga, dll.) **dienkripsi AES-GCM 256-bit** dengan kunci turunan password (PBKDF2-SHA256, 210.000 iterasi). Kunci dihapus saat logout → salinan tidak bisa dibaca tanpa password. Ganti password → salinan dienkripsi ulang.
- **Gagal-aman**: jika Rules/indeks baru belum di-deploy, offline, atau salinan rusak, aplikasi otomatis kembali ke listener penuh seperti v2.3 — tidak ada yang rusak.
- `config/auth` tidak lagi didengarkan oleh setiap pengunjung (diambil hanya saat login Super Admin).

### 📊 Analitik & Monitoring (khusus Super Admin)
- **Widget pengunjung realtime** kecil di kiri bawah beranda (di atas running text): online sekarang, kunjungan hari ini, total; klik untuk grafik 7 hari. Hanya tampil di halaman depan.
- Menu baru **Sistem › Monitor & Analitik**: read, write, delete, download, upload, dan *read dihemat* per hari (30 hari) dengan bilah kuota gratis Firestore, rincian per koleksi untuk sesi berjalan, status sinkron bertahap, analitik kunjungan 30 hari, serta ekspor Excel.
- Hemat kuota: 1 tulis per sesi pengunjung, detak kehadiran tiap 2 menit hanya saat tab terlihat, pemakaian dikirim bertahap (≤ 1 tulis / 5 menit / perangkat). Tanpa data pribadi.

### 📰 Widget Beranda
- Panel baru **Berita & Kegiatan Lembaga** tepat di bawah **Kegiatan Rutin Gampong**: seluruh berita dari setiap lembaga bergulir otomatis (atas ↕ bawah), jeda saat diarahkan/disentuh, roda mouse untuk menggulir manual. Tanpa read tambahan.
- Menu baru **Sistem › Widget Beranda** (khusus Super Admin): kecepatan gulir (4–120 px/detik), arah, jumlah berita, tinggi panel, serta tampil/sembunyi widget analitik.

### 🗂️ Data Master
- **Hapus kategori** untuk semua kategori: kategori kustom dihapus permanen; kategori bawaan disembunyikan dan dapat **dipulihkan**. Kategori inti (Jenis Kelamin, SHDK, kategori Informasi & Kegiatan) dilindungi.
- **Geser ▲▼** kategori; melewati batas kelompok memindahkannya ke kelompok lain. Tersedia juga pilihan **“Pindah ke”** kelompok. Formulir warga ikut mengikuti kelompok baru.

### 👥 Akun & Akses
- Grup menu baru **Admin › Manajemen Akun** — terbuka bagi Super Admin dan admin yang diberi badge **Centang Hijau — Perangkat Gampong**.
- Akun **Super Admin tidak terlihat** oleh siapa pun selain Super Admin (dikunci juga oleh Firestore Rules).
- Kotak centang di formulir **Tambah Admin** (dan seluruh aplikasi) kini berukuran seragam.

### 💾 Cadangan & Pemulihan
- Cadangan kini **benar-benar lengkap**: warga, dusun, master, informasi, Instagram, profil, kegiatan, lembaga + anggota/murid, dokumen, akun & hak akses, pengaturan, tema, statistik, analitik, hingga **audit log** — dengan progres per koleksi.
- **Pengingat cadangan setiap tanggal 29** (Februari non-kabisat: 28) khusus Super Admin: jendela pengingat, notifikasi browser, dan titik merah di menu.
- Notifikasi **berhasil** setelah “Hapus semua data warga”, lengkap dengan jumlah & waktu.

### 🧾 Ekspor PDF & Excel
- Penanda dokumen kini hanya **tanggal, jam • Deah Glumpang Powered by Serenity Creativa Labs. © 2026 All Rights Reserved** (tanpa nomor versi). Metadata penulis berkas ikut diisi.

### 🐞 Perbaikan bug
- Kategori Data Master yang baru dibuat **tidak bisa dihapus** (Rules menolak *delete* tanpa pesan). Kini terhapus dan ada pesan sukses/gagal.
- **Unduh Cadangan selalu gagal** karena koleksi `config` dibaca dengan *list* yang ditolak Rules.
- Daftar saran (autocomplete) di **Struktur Kepengurusan & Anggota** lembaga terpotong tabel. Kini kolom lebih lebar dan daftar saran melayang di atas halaman (juga di dalam dialog).

### 🔐 Firestore Rules & Indeks
- Rules baru untuk `meta`, `hapus`, `analytics`, `presence`, `usage`, `sistem`; perbaikan *delete* `master`; `isGreen()` untuk akun bercentang hijau; `widget` sebagai pengaturan khusus Super Admin.
- Indeks komposit baru di `firestore.indexes.json` (published+syncAt, dusun+syncAt, c+at).
- Deploy: `npm run deploy` (hosting + rules + indeks).


## v2.3.0 “Aurora” — 2026.10.27 (Build 2026.10.27 · R7 · Stable)
### Identitas baru
- Nama aplikasi berganti dari **DigiDes** menjadi **Serenity** di semua tempat (judul, PWA, ekspor PDF/Excel, cadangan, service worker).
- **Ikon baru** untuk tab browser (desktop & mobile), layar utama, dan PWA.
- Kredit baru: “Deah Glumpang ◦ Powered by Serenity Creativa Labs. © 2026 All Rights Reserved”. Login Super Admin tetap lewat 5× klik pada kredit.
- Penomoran rilis yang lebih rapi: versi, nama kode, build, revisi (R7), dan kanal (Stable).
### Fitur baru
- **Pengubah ikon aplikasi** (khusus Super Admin) di Tampilan & Tema: unggah gambar atau URL, opsi sudut membulat, latar warna, dan jarak tepi, dengan pratinjau 16/32/60/96 px. Manifest PWA ikut diperbarui.
- **Latar belakang website dari URL** (YouTube, MP4/WebM, gambar, Google Drive), dengan lapisan warna, blur, cakupan (semua halaman / beranda), poster, dan mode hemat untuk ponsel. Bisa diubah Super Admin atau admin berizin baru **Latar Belakang**.
- **Badge pengguna** (hanya diberikan Super Admin): centang biru/emas/hijau/abu/ungu, peran (Developer, Gamer, Moderator, Kreator, dll.), media sosial & komunitas (GitHub, Stack Overflow, LinkedIn, dll., dengan tautan profil), dan sertifikasi digital (Credly, Coursera, Google Cloud, AWS, Microsoft, Dicoding, BNSP, dll., dengan tautan verifikasi). Ikonnya generik, bukan logo merek. Badge tampil di sidebar, daftar akun, dan tanda “Diterbitkan oleh”.
- **Linmas (Perlindungan Masyarakat)** ditambahkan di Lembaga Kemasyarakatan, dengan fitur sama seperti lembaga lain. Data lama mendapat tombol “Tambahkan”.
- **Pengelola lembaga**: untuk Adat & Keagamaan, Kemasyarakatan, Ekonomi, dan Pendidikan, Super Admin dapat mengangkat admin yang sudah ada atau membuat akun pengelola baru dari daftar pengurus/anggota. Pengelola hanya bisa mengubah lembaga yang ditugaskan (dikunci Firestore Rules).
- **Tema & tipografi**:
  - Efek Glassy dan Blurry Aurora yang ringan.
  - Gaya siap pakai: Dark Glass Modern (Inter + JetBrains Mono), Glassy Terang, Aurora Dinamis, Terracotta Hangat, Golden Hour.
  - Palet baru: Earthy & Terracotta, Warm Neutral / Creamy, Warm Autumn / Golden Hour, Sage & Olive Warm, Soft Calm, Lavender Mist.
  - 14 pasangan huruf: Inter, JetBrains Mono, Space Grotesk, Poppins, Manrope, DM Sans, Outfit, Sora, Figtree, Urbanist, Lexend, Playfair Display, Lora, Nunito. Huruf dimuat hanya saat dipakai.
  - Sudut “Ekstra bulat”.
- Warna tema, model, efek, huruf, dan sudut hanya bisa diubah Super Admin. Pengguna lain dan pengunjung hanya bisa mengganti mode gelap/terang.
- **Efek zoom halus** pada kartu berita, agenda, informasi, dan dokumen saat kursor diarahkan.
### Perubahan
- Footer publik rata kanan.
- Peringatan saat menutup tab kini **hanya muncul bila ada isian data yang belum disimpan**.
### Perbaikan bug
- Menu dropdown (Profil Gampong, Lembaga) tertutup sendiri saat kursor pindah ke submenu. Kini ada jembatan hover + jeda 0,4 detik, dan menu tetap terbuka saat data diperbarui.
- Listener perubahan di halaman Tampilan menumpuk ke menu lain (memunculkan galat di halaman berikutnya).
- Judul tab “Serenity | Serenity” sebelum nama desa diatur.
- Badge bertaut di dalam tautan profil sidebar merusak struktur HTML.
- Rules: admin berizin Pengaturan dapat membuat dokumen config berisi tema/tata letak saat dokumen belum ada. Kini ditolak.

## v2.2.0 — 2026.10.27
### Fitur baru
- **Kelembagaan Gampong** (`#/lembaga`): 5 kategori — Pemerintahan (Pemerintah Gampong: Keuchik, Sekretariat, Kasi/Kaur, Kepala Dusun/Ulee Jurong; Tuha Peuet), Adat & Keagamaan (BKM, TPA/TPQ, Imeum Gampong, Tuha Lapan, Remaja Masjid), Kemasyarakatan/LKG (PKK, Posyandu, Karang Taruna, LPMG), Ekonomi (BUMG, Koperasi), Pendidikan (PAUD). Tiap lembaga punya profil, pengurus & jabatan (foto), anggota, murid / santriwan-santriwati, berita, galeri foto/video (URL & YouTube), dokumen unduhan, serta ekspor Excel/PDF. Daftar anggota & murid bersifat privat (publik hanya melihat jumlah).
- **Dokumen Publik** (`#/dokumen`): RPJMG, RKPG, APBG, RAPBG, Reusam, peraturan, laporan — dengan pencarian, filter jenis & tahun, tombol Lihat/Unduh.
- Hak akses baru **Kelembagaan** & **Dokumen Publik**, hanya diberikan Super Admin kepada admin terpilih.
- **Ekspor mengikuti filter aktif** (dusun, jenis kelamin, bansos/jenis bansos, dll.) — judul, nama file, dan kop Excel/PDF mencantumkan filter.
- **Kata sandi wajib** setiap kali menghapus data.
- **Editor teks kaya** di semua kolom deskripsi: jenis font, ukuran, warna, tebal, miring, garis bawah, daftar.
- Papan Informasi mendukung **foto/video via URL** (YouTube, Google Drive, gambar, video).
- **Tata letak bisa digeser (drag & drop)** — panel beranda, panel samping, dan kartu dasbor — khusus Super Admin.
- Menu **Tampilan** (Super Admin): 7 tema warna + warna kustom, 4 model tata letak, 3 pasangan font, sudut kartu, mode default.
- Tombol **Mode Gelap/Terang** untuk pengunjung.
- Konfirmasi **“Perubahan belum disimpan”** saat kembali/menutup form, dan konfirmasi **keluar aplikasi** saat menekan tombol kembali di halaman utama.
- Running text dengan pilihan font, ukuran, warna, latar, tebal, miring, dan kecepatan.
### Tampilan
- Beranda: Berita & Agenda di atas; Insight, Demografi, dan Data Publik di bawah.
- Navigasi publik baru dengan menu Lembaga; navigasi admin dikelompokkan.
- Informasi footer rata kiri.
### Perbaikan bug
- Running text tidak bergerak di desktop (kini animasi JavaScript, tidak terpengaruh pengaturan “kurangi gerakan”).
- Nama ganda “Super Admin Super Admin” pada tanda penerbit.
- Warna grafik mengikuti tema.

## v2.1.0 — 2026.10.27
### Koneksi & keamanan
- Konfigurasi Firebase **tertanam kembali** (`public/js/firebase-config.js`) — aplikasi langsung terhubung di semua browser/perangkat tanpa input manual.
- **Firestore Rules diperketat**: validasi skema & ukuran tiap koleksi, daftar field yang diizinkan, batas jumlah dokumen per query publik (anti scraping/bot), Kadus dikunci ke dusunnya, audit log tetap hanya-tambah.
### Fitur baru
- **Peran Kepala Dusun (Kadus)**: akun dibuat Super Admin atau Admin berizin “Kelola akun Kepala Dusun” (tombol *Akun Kadus* di kartu dusun). Kadus hanya melihat & mengelola warga dusunnya sendiri (dasbor, data warga, laporan, WhatsApp).
- **Foto profil** untuk Super Admin, Admin, dan Kadus.
- Tanda **“Diterbitkan oleh …”** pada setiap informasi/berita (termasuk pesan WhatsApp) dan “Diperbarui oleh …”.
- **Pemisah ribuan otomatis** saat mengetik angka (pendapatan, anggaran, realisasi).
- **Kartu dasbor bisa diklik** untuk membuka daftar warga terkait (aktif, KK, laki-laki, perempuan, penerima bansos, punya WA).
- **Portal Data Publik** (`#/data`): kartu kategori non-sensitif (dusun, agama, pendidikan, pekerjaan, kelompok umur, status kawin, sektor…) yang bisa diklik → diagram donat, tabel, persentase, unduh Excel.
- **Running text** di footer, diatur dari Pengaturan.
- Info teknis (Database, Perlindungan bot, PWA) di *Tentang Aplikasi* hanya untuk Super Admin.
### Tampilan
- Desain baru **Light & Clean** bertema Portal Data Publik: font Inter (angka tabular, nyaman untuk input data) + Plus Jakarta Sans (judul).
- Panel **Jadwal Sholat** & **Kegiatan Rutin** menempel di sisi kiri & kanan layar.
- Visualisasi demografi di beranda (donat jenis kelamin & dusun, piramida penduduk), tata letak mengisi ruang kosong.
- Footer statis & minimalis yang menempel di bawah layar.
- Animasi loading (splash berdenyut, progress bar perpindahan halaman, skeleton).

## v2.0.2 — 2026.10.27
- Perbaikan: tombol **Daftarkan Admin** tersembunyi oleh pemblokir iklan (AdBlock/uBlock/AdGuard) karena ID elemen berawalan `ad-`. Semua ID diganti.
- Tambahan tombol **Tambah Admin Baru** di atas tabel dan petunjuk bila belum ada admin.

## v2.0.1 — 2026.10.27
- Perbaikan: layar “Konfigurasi Firebase belum tersedia” saat aplikasi dibuka di luar Firebase Hosting (GitHub Pages, domain lain, localhost).
- Konfigurasi kini dicari berurutan: Firebase Hosting (`/__/firebase/init.json`) → `js/firebase-config.local.js` → situs `digides-8423e.web.app` → konfigurasi tempelan di browser. Tetap tanpa API key di repositori.
- Layar bantuan menampilkan hasil tiap percobaan beserta langkah perbaikan sesuai tempat hosting, dan formulir “Tempel konfigurasi sementara”.
- Workflow opsional **Deploy ke GitHub Pages** (konfigurasi ditulis dari secret `FIREBASE_WEB_CONFIG` saat build).

## v2.0.0 — 2026.10.27
### Keamanan
- **API key Firebase dihapus dari kode sumber** — konfigurasi dibaca otomatis dari `/__/firebase/init.json` (Firebase Hosting). Tidak ada lagi peringatan *secret leak* di GitHub.
- Dukungan **Firebase App Check (reCAPTCHA v3)** untuk memblokir bot & pencurian kuota.
- **Peran Super Admin & Admin** dengan hak akses per fitur (13 izin). Firestore Rules baru berbasis peran.
- Login Super Admin cukup password lewat **klik 5× tulisan copyright**; login admin memakai email + password.
- Admin hanya dapat didaftarkan oleh Super Admin. Admin bisa dinonaktifkan/diubah aksesnya dan langsung berlaku.
- **Wajib konfirmasi password** setiap import Excel, pendaftaran admin, pemulihan cadangan, dan penghapusan massal.
- Logout otomatis saat tidak aktif (default 30 menit) dan **cache data warga di perangkat dihapus saat logout**.
- Jeda 5 menit setelah 5× salah password di perangkat yang sama.
### Fitur baru
- **Audit Log** lengkap (khusus Super Admin): login/logout, percobaan gagal, akses data & detail warga, tambah/ubah (dengan perbandingan sebelum–sesudah)/hapus, import, ekspor, broadcast WA, master, dusun, informasi, Instagram, profil, pengaturan, manajemen admin, cadangan. Bisa disaring & diekspor PDF/Excel. Tidak dapat diubah/dihapus.
- **Pulihkan cadangan dari file JSON** (gabungkan atau ganti total, pilih koleksi).
- Menu publik **Profil Gampong**: Profil, Sejarah, Visi & Misi, Struktur Organisasi, Lembaga Gampong, Layanan Administrasi, Transparansi Anggaran (APBG), Potensi & UMKM, Kontak & Peta, Infografis.
- **Infografis & insight penduduk** publik (piramida penduduk, rasio jenis kelamin, usia produktif, rasio ketergantungan, dll.) dengan perlindungan privasi.
- **Insight admin & Kualitas Data** di dasbor (potensi salah sasaran bansos, BPJS, lansia, NIK ganda/kosong, dsb.).
- Panel **Jadwal Sholat** (perhitungan Kemenag, offline, hitung mundur) di kiri beranda.
- Panel **Kegiatan Rutin Gampong** (pengajian, wirid, posyandu…) di kanan beranda, dikelola dari admin.
- Lihat **anggota keluarga** (No. KK yang sama) dari detail warga.
### Perbaikan bug
- Draf informasi sempat tampil di halaman publik saat admin sedang login.
- Tampilan dimuat ulang otomatis saat modal terbuka sehingga isian bisa hilang.
- Peringatan NIK 16 digit yang tersimpan sebagai angka di Excel (risiko digit berubah).
- Nama “Desa Desa Digital” saat profil desa belum diisi.
- Menu publik tidak bisa dibuka di ponsel (kini ada tombol menu).

## v1.0.0 — 2026.10.26
- Rilis perdana Serenity — Sistem Informasi Desa Digital.
- Import data warga dari Excel (deteksi header otomatis, 33 kolom, pemecahan alamat → dusun/RT/RW, pembaruan berdasarkan NIK).
- Input manual dengan dropdown saran-saat-mengetik, termasuk wilayah seluruh Indonesia (provinsi s/d kelurahan/gampong).
- Data Master dropdown + kategori kustom.
- Dusun & kepala dusun, pengelompokan warga per dusun.
- Laporan rekap per kategori & ekspor data warga ke PDF dan Excel.
- Papan informasi (pengumuman, berita kegiatan, acara) + penyebaran ke WhatsApp warga.
- Integrasi highlight Instagram (API + sinkron terjadwal GitHub Actions).
- Login admin cukup password; ubah email & password dari aplikasi.
- PWA: dapat dipasang, mode offline, notifikasi versi baru.
- Deploy otomatis Firebase Hosting via GitHub Actions.

© Serenity Creativa 2026
