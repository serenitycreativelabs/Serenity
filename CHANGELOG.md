# Catatan Perubahan

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
- Rilis perdana DigiDes — Sistem Informasi Desa Digital.
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
