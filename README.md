# DigiDes — Sistem Informasi Desa Digital

![versi](https://img.shields.io/badge/versi-2.1.0-0f766e) ![PWA](https://img.shields.io/badge/PWA-siap-c98a16)

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

**© 2026 Deah Glumpang Official Website. Seluruh Hak Cipta Dilindungi Undang-Undang.**

Seluruh kode sumber, desain, teks, grafis, dan aset digital pada situs web ini dilindungi oleh Undang-Undang Hak Cipta No. 28 Tahun 2014. Dilarang keras menggandakan, menyalin, mendistribusikan, memodifikasi, atau merekayasa balik (reverse engineering) tanpa izin tertulis.

**TOS (Terms of Service / Ketentuan Layanan)**

**Hak Kekayaan Intelektual dan Perlindungan Konten Digital**
Kepemilikan Konten:

- Seluruh materi yang terdapat pada situs web ini—termasuk namun tidak terbatas pada kode sumber (source code), arsitektur basis data, algoritma, desain antarmuka (UI/UX), teks, citra digital, logo, dan dokumentasi—merupakan hak kekayaan intelektual milik [Nama Pengembang/Perusahaan] dan dilindungi oleh peraturan perundang-undangan Republik Indonesia serta konvensi internasional.
• Larangan Penggunaan Tanpa Izin.

• Pengguna atau pihak ketiga dilarang keras untuk:
Menyalin, mengkloning, atau menyebarluaskan seluruh atau sebagian kode dan aset digital untuk tujuan komersial maupun non-komersial tanpa persetujuan tertulis resmi.

- Melakukan tindakan scraping, ekstraksi data otomatis, dekompilasi, pembongkaran kode (decompiling/disassembling), atau rekayasa balik (reverse engineering) terhadap sistem ini.

- Menggunakan teknologi untuk melewati, merusak, atau menonaktifkan mekanisme pengamanan data dan otentikasi situs.

• Konsekuensi Hukum:

• Setiap pelanggaran atau pembajakan terhadap hak cipta dan sistem digital ini akan diproses secara hukum melalui jalur pidana maupun gugatan ganti rugi perdata sesuai ketentuan Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta dan Undang-Undang Informasi dan Transaksi Elektronik (UU ITE).

**DigiDes v1.0.0** — © Serenity Creativa 2026. Hak cipta dilindungi.
