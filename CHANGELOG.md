# Catatan Perubahan

## v3.1.0 “Meutuah” — 2026.10.31 (Build 2026.10.31 · R37 · Stable)
### Chat staf — kirim foto & berkas
- Tombol **lampiran** (ikon gambar) di kolom tulis pesan: pilih **foto** (dari galeri atau kamera HP) atau **berkas** (PDF, Word, Excel, PowerPoint, TXT/CSV, ZIP), boleh ditambah keterangan.
- **Foto dikompres otomatis** (maks. 1600 px, umumnya 150–600 KB) sebelum dikirim; pratinjau tampil di atas kolom tulis dan bisa dibatalkan (×).
- Di percakapan: foto tampil sebagai gambar kecil — ketuk untuk melihat ukuran penuh dan **Unduh foto**; berkas tampil sebagai kartu nama + ukuran — ketuk untuk mengunduh.
- Batas berkas **700 KB** (untuk berkas lebih besar, kirim tautan Google Drive). Jenis berbahaya (HTML, SVG, program) ditolak; berkas selain foto selalu diunduh, tidak dibuka di halaman.
- Lampiran tetap **privat** untuk kedua anggota percakapan, permanen seperti pesan, tercatat di Audit Log (“[Foto: …]”). Daftar percakapan menampilkan “📷 Foto” / “📎 nama berkas”.
- Disimpan di database (tanpa layanan penyimpanan berbayar) — **tetap bisa di paket gratis**. Lampiran dimuat hanya saat diketuk agar hemat kuota.
- Aturan database baru untuk lampiran + 3 skenario uji otomatis tambahan (total 18).

## v3.0.1 “Meutuah” — 2026.10.31 (Build 2026.10.31 · R36 · Stable)
### Keamanan — isolasi data antar dusun
- **Catatan hapus diperketat** (temuan L2 laporan uji keamanan): hanya akun yang berhak menghapus suatu data yang bisa membuat catatan hapusnya (warga → hak hapus warga, informasi → hak Papan Informasi, dst.). Akun Kepala Dusun hanya bisa membuat catatan hapus untuk **warga dusunnya sendiri** (ditandai nama dusun, diwajibkan aturan database), dan perangkat admin lain hanya menerapkannya pada warga dusun tersebut.
- **Uji otomatis aturan keamanan** (GitHub Actions › “Uji Aturan Keamanan”, Firebase Emulator, tanpa menyentuh data asli): 15 skenario — Kepala Dusun tidak bisa membaca, mengubah, memindah, menambah ke, atau menghapus warga dusun lain; tidak bisa menaikkan hak aksesnya sendiri; pengunjung tanpa login tidak bisa membaca data warga. Berjalan otomatis setiap aturan database berubah.
### Mesin pencari
- **robots.txt** (semua halaman publik boleh dijelajahi) dan **sitemap.xml** (alamat utama situs) untuk Google Search Console.

## v3.0.0 “Meutuah” — 2026.10.31 (Build 2026.10.31 · R35 · Stable)
Rilis besar: website & aplikasi kini jauh lebih ringan dan rapi di HP.
### Mode Ringan (HP)
- **Aktif otomatis** di HP layar sentuh, perangkat dengan mode Hemat Data, atau RAM ≤ 4 GB: efek kaca buram (blur) dimatikan — header, bilah bawah, panel & kartu memakai warna polos; latar foto tanpa blur, video latar diganti gambar diam; animasi ikon & dekorasi dihentikan; bayangan diperingan. Tata letak, warna tema & isi tetap sama.
- **Bisa diatur siapa saja**: ☰ Menu → **Mode Ringan** (pengunjung) atau tombol di bilah atas/menu samping (admin). Sekali tekan, pilihan tersimpan permanen di perangkat itu sampai diubah lagi.
- **Info pertama kali**: pengunjung baru di HP mendapat pemberitahuan singkat tentang Mode Ringan beserta letak tombolnya (sekali saja).
- Teks berjalan & panel gulir otomatis berhenti saat tidak terlihat di layar (semua perangkat).
- Formulir Tambah Warga di HP: hanya bagian I terbuka (bagian lain diketuk), panduan ⓘ muncul pada kolom yang sedang diisi.
### Tampilan HP lebih rapi & ringan
- **Footer dimatikan di HP** (teks berjalan, statistik pengunjung, tombol tata letak) — tidak dimuat sama sekali.
- **Tombol Kembali di HP**: menutup dialog, bilah menu admin, menu bawah, atau panel chat yang sedang terbuka lebih dulu — halaman di belakangnya tidak lagi berganti diam-diam. Dialog yang berisi isian belum disimpan meminta konfirmasi. Satu tekan Kembali = satu langkah.
- Tabel panel admin (Data Warga, Manajemen Akun, Audit Log, Dokumen, dll.) tampil sebagai **kartu** di layar kecil; tombol aksi cepat dasbor rata dua kolom.
- Menu baru **Pasang Aplikasi** (menu bawah pengunjung & menu samping admin): memasang aplikasi langsung bila browser mendukung, atau menampilkan panduan Android/iPhone.
### Beranda & Data Publik
- Sorotan warna di kartu statistik & tombol beranda kini **mengikuti kursor** (kartu/tombol yang ditunjuk ikut berwarna), kembali ke bawaan saat kursor keluar.
- **Kartu statistik bisa diklik** (beranda, Data Publik, Infografis):
  - Penduduk, Kepala Keluarga, Usia Produktif, Lansia, Balita → jumlah menurut **jenis kelamin** + tabel per dusun.
  - Laki-laki / Perempuan → **sebaran per dusun** dan per kelompok umur.
  - Dusun → penduduk, laki-laki, perempuan & KK per dusun.
  - Jumlah di bawah batas privasi ditampilkan “< n”.
- Tombol **← Kembali** di halaman Data Publik, rincian statistik, dan Infografis Lengkap; “← Semua data” dan label “PORTAL DATA PUBLIK” kini bertumpuk sejajar kiri.
### Lainnya
- Judul tab browser tidak lagi bergerak — cukup **“Deah Glumpang”**.

## v2.9.18 “Kirana” — 2026.10.31 (Build 2026.10.31 · R34 · Stable)
### Halaman publik Lembaga & Dokumen
- Halaman setiap lembaga: bilah tab **Profil / Struktur / Berita / Galeri / Dokumen** kini kartu melayang membulat (transparan + blur) mengikuti gaya kartu lain — tidak lagi pita kaku selebar halaman. Berlaku untuk semua lembaga.
- Halaman kategori lembaga: “← Semua lembaga” dan label “KELEMBAGAAN” kini bertumpuk rapi dan sejajar kiri.
- **Dokumen Publik Gampong:** ditambah tombol **← Kembali** (kembali ke halaman sebelumnya; bila dibuka langsung → halaman Lembaga).
### Panduan pengisian di setiap kolom (panel admin)
- Hampir 200 kolom isian — dari Data Warga, Dusun, Import, Laporan, Lembaga & Kontak Luar, Profil, Papan Informasi, Dokumen, Kegiatan, Kirim WhatsApp, Instagram, Pengaturan (termasuk jadwal sholat & keamanan), Tampilan, Latar, Widget, Manajemen Akun, hingga Cadangan & Pemulihan — kini punya **keterangan ⓘ di bawah kolom**: apa yang diisi, format, contoh, dan hal yang perlu diperhatikan (mis. NIK 16 digit tanpa spasi, satu KK satu Kepala Keluarga, pendidikan yang sudah tamat, link Drive harus “siapa saja yang memiliki link”).
- Kolom di tabel (pengurus, anggota, murid/santri, dokumen lembaga) menampilkan panduan saat kursor diarahkan.

## v2.9.17 “Kirana” — 2026.10.31 (Build 2026.10.31 · R33 · Stable)
### Lembaga Gampong — Kontak Luar (warga luar gampong)
- **Daftar Kontak Luar bersama** (Lembaga Gampong › Kontak Luar): pengurus, anggota, atau murid/santri yang **bukan penduduk gampong** (bidan/kader puskesmas, pelatih, ustaz dari gampong lain, dll.) — nama, L/P, No. HP, **asal/instansi** (wajib), keterangan. Sekali dicatat, bisa dipakai di semua lembaga.
- **Terpisah total dari Data Warga:** disimpan di koleksi tersendiri; tidak masuk Data Warga, statistik penduduk, Dasbor, Laporan, Broadcast, maupun ekspor warga.
- Isian nama: saran menampilkan warga lokal dan warga luar (“Warga luar • asal”); bila nama tidak ditemukan → **“＋ Tambah … sebagai warga luar gampong”** atau tombol **“＋ Jadikan warga luar”**. Peringatan bila nama ternyata terdaftar di Data Warga atau sudah ada di Kontak Luar (“Pakai ini”).
- **Label “Warga luar · asal” hanya terlihat admin**; halaman publik tetap menampilkan nama & jabatan saja.
- Jumlah dipisah (“n warga lokal · m warga luar”); ekspor Excel/PDF lembaga mendapat kolom **Status** (Warga lokal / Warga luar / Belum terhubung).
- Halaman Kontak Luar: cari, ekspor Excel, ubah (nama ikut berubah di semua lembaga), hapus dengan peringatan tempat pemakaian (nama tetap ada di lembaga, menjadi “belum terhubung”); daftar “Dipakai di” per orang.
- Nama lama yang persis sama dengan satu kontak luar ditautkan otomatis. Pengelola lembaga dapat memakai & menambah kontak luar; menghapus hanya admin Kelembagaan / Super Admin.
- Keamanan: aturan database baru untuk koleksi `kontakLuar`; ikut dalam Cadangan & Pemulihan.

## v2.9.16 “Kirana” — 2026.10.31 (Build 2026.10.31 · R32 · Stable)
### Lembaga Gampong — perbaikan isian nama & integrasi Data Warga
- **Perbaikan:** memilih nama dari daftar saran (Struktur Kepengurusan, Anggota, Murid/Santri, juga kolom Jabatan/Bagian/Dusun/Jenis dokumen) tidak lagi hanya menyimpan huruf yang sempat diketik (mis. “B” untuk “Budi”). Nama lengkap langsung tampil sekali klik/Enter dan tersimpan utuh — berlaku untuk semua lembaga (Posyandu, PKK, TPA, dll.).
- **Terhubung ke Data Warga:** nama yang dipilih dari saran ditautkan ke data warga (tanda ✓ “Data warga · Dusun”), dan kolom terkait terisi otomatis:
  - Pengurus: No. HP.
  - Anggota: L/P, dusun, No. HP.
  - Murid/Santri: L/P, tanggal lahir, orang tua/wali (kepala keluarga pada KK yang sama) & HP wali.
- **Selalu mengikuti Data Warga:** bila nama warga diubah di Data Warga, nama di lembaga ikut menyesuaikan saat dibuka; nama lama yang persis sama dengan satu warga ditautkan otomatis; warga yang dihapus → tautan dilepas, nama tetap.
- Nama yang diketik manual (bukan warga) tetap bisa disimpan, ditandai “Belum terhubung data warga”; tautan bisa dilepas (×). Peringatan bila orang yang sama dipilih dua kali dalam satu daftar.

## v2.9.15 “Kirana” — 2026.10.31 (Build 2026.10.31 · R31 · Stable)
### OCR KTP & KK diperkuat untuk foto asli
- **Pengolahan gambar baru:** dokumen dideteksi & dipotong otomatis dari latar (meja/tangan), kemiringan diluruskan sampai 0,05°, gambar diperbesar dari foto asli ke resolusi baca (KTP 2300 px, KK 3600 px), lalu **binarisasi adaptif** (tahan bayangan, pantulan cahaya & motif latar KTP) dan penghapusan garis tabel KK yang lebih toleran.
- **Beberapa kali baca otomatis** (mode hitam-putih & abu-abu, beberapa tata letak); hasil terbaik dipilih otomatis dan berhenti lebih awal bila sudah lengkap.
- **Label KTP dikenali walau salah eja/terpotong** (mis. “Tempat/Tgl Lahir”, “Gol. Darah”, “Kel/Desa”), tanggal lahir tidak lagi hilang, nama tempat yang tergabung dirapikan (“BANDAACEH” → “BANDA ACEH”); pekerjaan yang tidak terbaca jelas dikosongkan, bukan diisi asal.
- **Tabel KK:** kolom agama/pendidikan/pekerjaan dicocokkan dengan Data Master walau kolomnya bergeser, sisa garis/huruf liar di depan nama dibuang, jenis kelamin & status kawin dikenali walau huruf salah baca (mis. “ELUM KAWIN”), status & hubungan keluarga dipasangkan sesuai urutan anggota.
- **Pemeriksaan NIK dengan tanggal lahir:** NIK memuat tanggal lahir (DDMMYY, perempuan +40); angka NIK yang salah/kelebihan digit dari garis tabel diperbaiki otomatis bila cocok dengan tanggal lahir.
- Hasil uji foto contoh (miring, bayangan, pantulan, buram): KTP dari 1–3 menjadi **15–16 dari 16 kolom**; KK dari **0 anggota** menjadi **semua anggota terbaca** (4/4) dengan kolom lengkap.

## v2.9.14 “Kirana” — 2026.10.31 (Build 2026.10.31 · R30 · Stable)
### OCR di perangkat — membaca tulisan dari foto (bahasa Indonesia)
- **Scan KTP → isi formulir warga** (Data Warga › Tambah/Ubah Warga › “Isi otomatis dari foto KTP”): NIK, nama, tempat & tanggal lahir, jenis kelamin, golongan darah, alamat, RT/RW, kelurahan, kecamatan, kabupaten, provinsi, agama, status perkawinan, dan pekerjaan (16 kolom). Pilihan disesuaikan otomatis dengan Data Master, umur dihitung dari tanggal lahir, setiap kolom bisa dikoreksi/dilewati sebelum diisi; kolom yang terisi disorot.
- **Scan Kartu Keluarga** (Data Warga › “Scan KK”): No. KK, alamat, RT/RW, dan seluruh anggota keluarga (nama, NIK, L/P, tempat & tanggal lahir, agama, pendidikan, pekerjaan, status kawin, hubungan keluarga) dalam tabel yang bisa diedit, lalu disimpan sekaligus ke dusun yang dipilih. Tanda “periksa kembali” bila No. KK tampak keliru (kode wilayah berbeda dengan NIK anggota). Tercatat di Audit Log.
- **Teks dari foto dokumen**: tombol 📷 di semua editor teks (Papan Informasi, berita lembaga, kegiatan, profil, dll.); baris yang terpotong dirapikan menjadi paragraf.
- **Kamera langsung** selain unggah foto: bingkai panduan sesuai dokumen (KTP, lembar KK mendatar, halaman A4), potong otomatis sesuai bingkai, ganti kamera depan/belakang, senter (bila didukung), resolusi tinggi untuk KK/dokumen; kamera langsung dimatikan setelah memotret/menutup.
- Pengolahan gambar otomatis: orientasi, kontras, **meluruskan foto miring**, dan **menghapus garis tabel** KK agar angka NIK tidak tertukar dengan garis.
- **Privasi:** foto diproses di perangkat petugas, tidak dikirim ke server mana pun dan tidak disimpan (sesuai UU PDP); gratis tanpa batas. Mesin OCR (±3–4 MB) hanya diunduh saat pertama dipakai staf lalu tersimpan di perangkat — pengunjung website tidak mengunduh apa pun.
### Pengecekan duplikasi NIK & pembaruan data
- Bila NIK hasil scan KTP sudah terdaftar: peringatan **“Data sudah tersedia, Silahkan cek kembali untuk penyesuaian.”**, data awal tetap dipakai, perbandingan *data tersimpan vs hasil scan* per kolom; **Buka data tersimpan** atau **Perbarui data terpilih** (hanya kolom yang dicentang, lalu Simpan).
- Peringatan yang sama saat NIK diketik manual di form Tambah Warga, dengan tombol **Buka & perbarui**.
- Scan KK: anggota yang NIK-nya sudah terdaftar ditandai “Data sudah tersedia” dengan pilihan **Pakai data awal** atau **Perbarui data** (daftar perubahan bisa dicentang per kolom). Ringkasan “Simpan (n baru, m diperbarui)”.
- Tampilan HP: tabel perbandingan & tabel KK menjadi kartu per kolom/anggota; tombol bawah selalu terlihat.

## v2.9.13 “Kirana” — 2026.10.30 (Build 2026.10.30 · R29 · Stable)
### Beranda — daftar berita samping lebih ramping
- Baris berita di samping berita utama kini tipis (±52 px, judul 1 baris) dan tidak lagi melar mengikuti tinggi berita utama bila beritanya sedikit.
- Efek transparan + blur (58%) pada daftar, sementara berita utama/disematkan tetap lebih pekat (92%) dengan bayangan → tetap jadi sorotan.
### Papan Informasi — Kelola Kategori
- Tombol baru **Kelola Kategori**: tambah kategori manual, ubah nama (berita yang memakainya ikut diperbarui), lihat jumlah berita per kategori, dan **28 saran kategori** (tambah satu per satu atau sekaligus). Kategori lama yang tidak ada di daftar bisa dimasukkan dengan satu klik.
- **Hapus kategori yang masih dipakai** → peringatan keras & rinci: jumlah berita terdampak (terbit/draf/disematkan), daftar judulnya, penjelasan dampak; berita **wajib dipindahkan** ke kategori lain; tombol aktif hanya setelah mengetik nama kategori + centang “Saya mengerti” + password. Tercatat di Audit Log.
- Form berita: kategori dipilih dari daftar + opsi “＋ Kategori baru…”.
### Foto & video dari URL
- Setiap tautan foto/video tampil sebagai kartu dengan tombol **Hapus**, serta tombol **Hapus semua** — foto/video yang sudah ditempel kini mudah dilepas dari berita.
### Sunting langsung dari beranda
- Tombol **Sunting** pada kartu berita (beranda & halaman Papan Informasi publik) dan halaman baca berita — hanya terlihat oleh staf yang berhak mengelola Papan Informasi; membuka form edit berita tersebut di dasbor.

## v2.9.12 “Kirana” — 2026.10.30 (Build 2026.10.30 · R28 · Stable)
### Beranda (desktop)
- **Dokumen Terbaru** & **Agenda Terdekat** pindah ke panel kiri, tepat di bawah **Jadwal Sholat** (kartu ringkas dengan tombol › lihat semua; Dokumen otomatis disembunyikan bila belum ada dokumen). Tata letak tersimpan lama tetap dihormati.
- **Informasi & Berita Terbaru** kini selebar konten: berita utama + **4 berita ringkas** di sampingnya (tinggi sejajar) + 3 kartu berita berikutnya — 8 berita terbaru tampil.
- **Header** publik menjadi kartu melayang (sudut membulat, bayangan, sejajar panel kiri & kanan); logo tetap 44 px.
- **Layanan & Kelembagaan**: kartu lebih ringkas; tulisan panjang (mis. “Kemasyarakatan”) selalu di dalam kotak.
- Tombol **Atur tata letak** (Super Admin): ikon saja, di footer kiri setelah titik pengunjung online.
- Tombol **chat** lebih kecil (54 → 44 px) & lebih rendah (tepat di atas footer).
### Beranda (HP, tablet & PWA)
- Kartu **Portal Data Publik** lebih ringkas (±25% lebih pendek): judul, deskripsi 2 baris, tombol & kotak statistik lebih kecil.
- **Berita**: kartu utama mendatar yang ringkas (foto kiri, teks kanan) + **daftar 7 berita lain** dalam baris ringkas — tidak lagi hanya 1 berita yang terlihat.
### Panel kanan
- **Kegiatan Lainnya** (dan semua panel bergulir) kini tetap **bergerak walau isinya sedikit** (mis. hanya 1 kegiatan) — isi diulang mulus seperti Kegiatan Rutin & Berita Lembaga. Tetap berhenti saat disorot/disentuh.
### Dasbor admin
- **Sistem › Pengaturan → panel baru “Teks Kartu Beranda”**: ubah tulisan di bawah judul “Portal Data & Informasi …” dengan editor teks + **pratinjau langsung**, tombol “Pakai tulisan bawaan”; tercatat di Audit Log; bisa dicari di kolom cari dasbor. (Kolom “Deskripsi singkat” di Profil Gampong dipindahkan ke panel ini; isinya tetap.)
- Urutan menu **Publikasi**: Profil Gampong → Papan Informasi → **Dokumen Publik** (pindah dari Kelembagaan) → Kegiatan Rutin → Kirim WhatsApp → Instagram. Daftar centang Hak Akses mengikuti urutan yang sama (hak akses akun tidak berubah).

## v2.9.11 “Kirana” — 2026.10.30 (Build 2026.10.30 · R27 · Stable)
### Footer satu baris: running text & pengunjung online pindah ke dalam footer
- **Desktop:** running text kini berada di **dalam footer sebelah kiri bawah** (bentuk kapsul, tetap semi-transparan & warna pilihan), info footer (WA, versi, copyright) tetap di kanan. Running text hanya memakai sisa ruang → tidak pernah bertabrakan; copyright selalu utuh. Baris running text terpisah di atas footer dihapus → ruang konten bertambah ±26 px.
- Layar 861–1180 px (laptop kecil/tablet mendatar): nomor WA & versi disembunyikan otomatis bila running text aktif agar tetap lega.
- **HP, tablet & PWA:** titik online + running text dalam satu baris tipis tepat di atas menu bawah; tanpa running text hanya titik kecil di kiri bawah (tanpa baris kosong).
### Statistik pengunjung realtime: hanya titik hijau
- Widget di footer kini hanya **titik hijau berkedip** (angka “Hari ini” & “Total” dihapus dari footer agar hemat ruang).
- Tekan titik → panel statistik: **Online · Hari ini · Total**, grafik kunjungan 7 hari, dan keterangan pembaruan. Panel tertutup otomatis saat menekan di luar panel. Jumlah online juga tampil sebagai keterangan saat titik disorot.

## v2.9.10 “Kirana” — 2026.10.30 (Build 2026.10.30 · R26 · Stable)
### Footer & running text
- Baris footer lebih ringkas: 40 → 30 px (desktop), tulisan & ikon sedikit lebih kecil, latar kaca lembut.
- Latar **running text semi-transparan** (±70%) dengan blur lembut — warna pilihan di Pengaturan tetap dipakai; video/foto latar terlihat samar di baliknya.
- Diperbaiki: huruf pilihan Running Text sebelumnya tidak pernah dimuat (tampil huruf pengganti). Kini dimuat otomatis.
### Semua huruf website di semua kolom isian
- Editor teks (Papan Informasi, berita lembaga, kegiatan, profil, dll.) dan pilihan huruf Running Text kini berisi **semua 39 huruf pustaka website** + Lora & Georgia (42 pilihan), dikelompokkan Sans · Display · Serif · Mono · Sistem.
- Hemat: huruf hanya dimuat bila dipakai; daftar huruf memuat pratinjau semua huruf saat dibuka di dasbor; huruf yang dipakai di konten otomatis dimuat di halaman publik.
### Pencarian menu & panel (bilah samping dasbor, di bawah Dasbor)
- Cari menu, kategori lembaga, **nama lembaga** (mis. “Tuha Lapan”), warga per dusun, dan bagian di dalam halaman (Jadwal Sholat, Running Text, Ikon Aplikasi, Riwayat Chat, dll. — dibuka lalu digulir & disorot otomatis).
- Navigasi papan ketik: ↑/↓ & Enter; tekan **/** atau **Ctrl+K** untuk mencari dari mana saja. Hanya menampilkan menu yang boleh diakses akun tersebut.
### Lihat Sebagai (Super Admin › di atas Audit Log)
- Pratinjau dasbor persis seperti yang dilihat **admin, pengelola lembaga, atau kepala dusun** tertentu — menu, data (mis. kepala dusun hanya warga dusunnya), dan tombol sesuai hak aksesnya.
- **Hanya pratinjau**: semua penyimpanan data diblokir di perangkat; pita oranye penanda mode + tombol Keluar; chat staf dijeda; mode berakhir otomatis saat halaman dimuat ulang. Mulai & selesai tercatat di Audit Log.
### Perbaikan
- Ikon kaca pembesar menimpa tulisan di kolom cari halaman dasbor (efek tampilan ringkas v2.9.9).

## v2.9.9 “Kirana” — 2026.10.30 (Build 2026.10.30 · R25 · Stable)
### Beranda publik — lebih ringkas & rapi
- **Panel kanan jadi 3 blok terpisah**, urutan bawaan: **Kegiatan Rutin Gampong** (kegiatan hari ini) → **Berita & Kegiatan Lembaga** → **Kegiatan Lainnya**. Masing-masing kartu sendiri dengan gulir otomatis sendiri.
  - Di laptop/komputer/PWA desktop **ketiganya selalu terlihat utuh tanpa perlu digulir** — tinggi dibagi otomatis mengikuti tinggi layar (diuji 768 & 860 px); blok berisi sedikit tidak memanjang kosong.
  - Isi lebih ringkas: kegiatan cukup 1 baris (jam · nama · tempat — PJ & WA tetap di halaman detail), berita lembaga tanpa cuplikan isi, judul blok lebih kecil dengan tombol panah “semua” di pojok, tanpa tulisan petunjuk.
  - Di ponsel: 3 kartu bertumpuk (±190 px/blok) tanpa kotak pembungkus ganda.
  - “Kegiatan Lainnya” kini blok tata letak tersendiri (bisa dipindah di Atur Tata Letak). Widget Beranda: “Tinggi tiap blok” (bawaan 260 px).
- **Jadwal Sholat ringkas**: kolom kiri 300 → 252 px, tanggal & Hijriah satu baris, hitung mundur satu baris, 8 waktu dalam kisi 2 kolom (±40% lebih pendek), catatan perhitungan dipersingkat.
- **Kartu hero** ±56% lebih pendek di laptop (515 → 227 px), ±20% di ponsel: statistik dengan ikon di kiri, judul & deskripsi lebih kecil, tombol tetap 1 baris — label dipersingkat otomatis (“Informasi · Data · Dokumen”) saat ruang sempit.
- **Logo header simetris**: logo kini terkunci di dalam kotaknya (sebelumnya logo tegak seperti lambang Banda Aceh meluber ±13 px ke bawah) dan ukurannya 44 px, sejajar tengah dengan nama web & deskripsi.
- **Running text lebih ramping**: 34 → 26 px (laptop), 30 → 24 px (ponsel).
- Outline halus pada tulisan di atas latar (v2.9.8) **dikembalikan** seperti semula.
### Dasbor admin — ringkas di semua halaman
- Jarak panel, kartu statistik, tombol, kolom isian, chip, tab, tabel, kotak keterangan, dan baris berita/informasi dirapatkan. Contoh penghematan tinggi halaman: Dasbor −19%, Laporan −16%, Lembaga −20%, Instagram −49%, Pengaturan −15%, Tampilan & Tema −27%, Monitor −34%, Audit Log −42%, Manajemen Akun −28%.
- **Instagram**: Username, Access Token & tombol Simpan/Sinkronkan sejajar satu baris; grid postingan lebih kecil dengan tombol di atas gambar. Diperbaiki: grid melebar setinggi satu layar sehingga ada ruang kosong besar.
- **Manajemen Akun**: hak akses dikelompokkan per bagian dengan label pendek (mis. DATA WARGA: Lihat · Ubah · Hapus); akun berakses penuh cukup “Semua hak akses admin (17)”; rincian lengkap di tooltip. Lencana peran tidak lagi terlipat.
- **Monitor**: tabel pemakaian per koleksi dibatasi tinggi & bisa digulir dengan judul kolom menempel.
- **Tampilan & Tema**: kartu gaya, pratinjau efek/model/kursor/huruf lebih kecil; pratinjau Ikon Aplikasi tanpa latar putih.

## v2.9.8 “Kirana” — 2026.10.30 (Build 2026.10.30 · R24 · Stable)
### Panel Kegiatan Rutin bergulir otomatis
- Panel **Kegiatan Rutin Gampong** di beranda (bagian **Hari ini** & **Kegiatan lainnya**) kini bergulir mulus seperti panel Berita & Kegiatan Lembaga: berhenti saat diarahkan kursor/disentuh, bisa digulir manual dengan roda mouse, dan tetap diam bila semua kegiatan muat di panel.
- Pengaturan baru di **Sistem › Widget Beranda › Gerak Panel Kegiatan Rutin** (khusus Super Admin): hidup/mati gulir otomatis, kecepatan (4–120 piksel/detik, bawaan 18), arah (ke atas/ke bawah), dan tinggi panel — lengkap dengan pratinjau langsung.
- Mesin gulir kini mendukung beberapa panel sekaligus; salinan daftar untuk putaran tanpa jeda disembunyikan dari pembaca layar. Klik baris kegiatan tetap membuka halaman detail.
### Tulisan di atas foto/video latar tetap terbaca
- Judul bagian (mis. “Informasi & Berita Terbaru”, “Agenda Terdekat”), tautan “Lihat semua →”, judul panel samping, label & petunjuk yang langsung berada di atas latar belakang kini memiliki **outline halus (halo)** berwarna kartu tema — terang di mode terang, gelap di mode gelap — sehingga nyaman dibaca di atas video atau foto apa pun. Ikon ikut diberi halo.

## v2.9.7 “Kirana” — 2026.10.30 (Build 2026.10.30 · R23 · Stable)
### Video YouTube latar — benar-benar bersih
- **Tombol sebelumnya / jeda / berikutnya tidak lagi muncul.** Penyebab: pengulangan video memakai mode *playlist* YouTube (memunculkan tombol sebelumnya/berikutnya), dan YouTube selalu menampilkan tombol ±3 detik setelah mulai, saat buffering, atau saat berhenti. Kini:
  - tanpa mode playlist — pengulangan diatur sendiri, kembali ke awal ±0,6 detik sebelum selesai (layar akhir & video terkait tidak pernah muncul);
  - video baru ditampilkan setelah berputar mulus **≥ 3 detik** dan kualitas target tercapai;
  - saat buffering/berhenti, video disembunyikan sebentar dan gambar sampul yang tampil.
- **Profil kualitas per perangkat:** komputer, laptop & PWA desktop → pemutar **1080p** (60 fps bila videonya diunggah 1080p60); ponsel & tablet → **720p** (tajam di layar kecil, ±2–3× lebih hemat kuota); mode Hemat Data → gambar sampul. Matikan “Mode hemat” untuk 1080p di semua perangkat.
- Catatan: YouTube tidak mengizinkan situs lain mengunci kualitas secara paksa — kualitas akhir tetap disesuaikan YouTube dengan kecepatan internet pengunjung. Untuk kualitas yang benar-benar terkunci, gunakan tautan langsung video MP4 1080p60.

## v2.9.6 “Kirana” — 2026.10.29 (Build 2026.10.29 · R22 · Stable)
### Perbaikan latar belakang foto/video (YouTube, MP4, gambar)
- **Latar tidak tampil walau sudah disimpan.** Dua penyebab:
  1. Di panel Latar Belakang, kotak centang “Aktifkan” bawaannya tidak tercentang, sehingga tombol Simpan menyimpan latar dalam keadaan **mati** (pemberitahuan “Latar belakang dimatikan” mudah terlewat). Kini tombol **Simpan & tampilkan** selalu mengaktifkan latar bila URL terisi; tombol **Matikan latar** untuk menonaktifkan. Status **Aktif / Belum aktif** tampil jelas di bagian atas panel, plus tombol **Lihat website**.
  2. Sejak v2.9.0 warna dasar tema dipasang di elemen `<html>` (untuk mencegah kilatan putih), sehingga latar `<body>` — yang pada efek Kaca, Aurora, Gen Z, macOS & model Kartu tetap pekat — ikut tergambar **di atas** lapisan video dan menutupinya. Kini `<body>` selalu transparan saat latar aktif; warna dasar tema tetap berada di bawah video.

## v2.9.5 “Kirana” — 2026.10.29 (Build 2026.10.29 · R21 · Stable)
### Pratinjau tautan
- Warna gambar pratinjau (`public/og-image.png`) disesuaikan dengan tema website **Warm Neutral / Creamy**: garis paling atas bergradasi #8b6b4e → #c4975f, tulisan “PORTAL RESMI PEMERINTAH”, alamat website & garis pemisah berwarna utama tema #8b6b4e, latar krem #faf6f0.

## v2.9.4 “Kirana” — 2026.10.29 (Build 2026.10.29 · R20 · Stable)
### Pratinjau tautan
- Gambar pratinjau (`public/og-image.png`, 1200×630) kini memakai **lambang resmi Kota Banda Aceh** dengan judul “Portal Resmi Pemerintah Gampong Deah Glumpang”, keterangan “Kota Banda Aceh · Provinsi Aceh”, dan alamat www.digides.web.id.

## v2.9.3 “Kirana” — 2026.10.29 (Build 2026.10.29 · R19 · Stable)
### Pratinjau tautan saat dibagikan
- Tautan website yang dibagikan ke WhatsApp, Facebook, Telegram, X, LinkedIn, dll. kini tampil sebagai **“Portal Resmi Pemerintah Gampong Deah Glumpang”** lengkap dengan deskripsi & **gambar pratinjau 1200×630** (`public/og-image.png`). Sebelumnya tampil “Serenity — Sistem Informasi Desa Digital” tanpa gambar.
- Penyebab: domain www.digides.web.id melayani halaman pengalih `index.html` di folder utama repo yang masih berjudul lama dan tidak memiliki tag Open Graph — mesin pratinjau tidak menjalankan JavaScript/pengalihan sehingga hanya membaca halaman itu. Kini halaman pengalih **dan** halaman aplikasi sama-sama memiliki tag Open Graph & Twitter Card, deskripsi, dan alamat kanonik.
- Nama aplikasi saat dipasang (PWA): “Portal Resmi Pemerintah Gampong Deah Glumpang” / “Deah Glumpang”.

## v2.9.2 “Kirana” — 2026.10.29 (Build 2026.10.29 · R18 · Stable)
### Video YouTube latar belakang
- **Langsung berjalan** saat halaman dibuka — bisu, tanpa tombol play/kontrol, tanpa judul & logo YouTube, berulang terus. Sebelumnya: di layar < 700 px & saat “Mode hemat” aktif video sengaja diganti gambar diam, dan video dimuat malas (*lazy*) sehingga tertunda.
- Gambar sampul video tampil lebih dulu, lalu video **muncul halus setelah benar-benar berputar** — tombol play, judul, atau layar hitam YouTube tidak pernah terlihat. Tepi pemutar sedikit diperbesar agar sisa logo/judul terpotong keluar layar.
- **Kualitas tinggi**: pemutar dirender minimal 1920 px sehingga YouTube memilih **1080p / 1080p60** bila video tersedia dalam kualitas itu (kualitas akhir tetap ditentukan YouTube sesuai kecepatan internet pengunjung).
- Otomatis mencoba memutar ulang bila browser menahan putar otomatis (mis. mode hemat daya iPhone) — video berjalan saat pengunjung menyentuh/menggulir halaman; diputar ulang saat tab kembali dibuka.
- “Mode hemat” kini hanya mengganti video dengan gambar diam bila perangkat pengunjung memakai mode **Hemat Data**; di ponsel kualitas dibatasi 720p (matikan Mode hemat untuk 1080p di semua perangkat). Video MP4/WebM juga dipaksa berputar otomatis.
### Layar memuat & pemberitahuan
- Layar memuat (splash) kini memakai **ikon aplikasi terbaru** & nama gampong — tersimpan di perangkat sehingga langsung tampil sejak detik pertama, bukan ikon bawaan lama.
- Kotak “Website belum dapat dimuat” kini **mengikuti warna, huruf & sudut tema website** (termasuk mode gelap) dan menampilkan ikon terbaru — tidak lagi hijau & putih bawaan.
### Judul tab berjalan lebih mulus
- Ritme tetap & rapat (1 huruf tiap 0,15 detik) tanpa jeda berhenti-jalan; waktu dihitung dari jam sehingga tidak tersendat.
- Detak dari Web Worker sehingga judul **tetap bergerak lancar saat tab sedang tidak dibuka** (sebelumnya browser memperlambatnya menjadi 1× per detik — justru saat judul tab sedang terlihat).

## v2.9.1 “Kirana” — 2026.10.29 (Build 2026.10.29 · R17 · Stable)
### Perbaikan
- **Notifikasi palsu “Hak akses Anda diperbarui”** yang muncul berulang (terutama pada admin ber-badge seperti Centang Hijau) saat menyimpan data atau membuka halaman. Penyebab: profil akun dibandingkan sebagai teks mentah, padahal urutan field dari server bisa berbeda walau isinya sama, dan perubahan non-akses (login terakhir, nama, foto, catatan badge) ikut dihitung. Kini yang dibandingkan hanya isi hak akses secara kanonik: peran, izin aktif, lembaga yang dikelola, jenis badge, dan dusun.
- Bila Super Admin benar-benar mengubah hak akses, notifikasi kini menjelaskan apa yang berubah (mis. “dicabut Kelola Data Master”, “mendapat Centang Hijau”) dan hanya muncul sekali.

## v2.9.0 “Kirana” — 2026.10.29 (Build 2026.10.29 · R16 · Stable)
### Model Tampilan Baca (Super Admin › Tampilan & Tema)
- Tiga model untuk halaman baca **Papan Informasi**, **Berita & Kegiatan Lembaga**, dan **Kegiatan Rutin**:
  - **A · Kartu Baca** (bawaan) — satu kartu pekat mengikuti warna tema, sampul tipis di atas, judul & huruf lebih ringkas, subjudul beraksen, tombol bagikan di bilah bawah kartu.
  - **B · Lembar Kertas** — ala koran/majalah: kertas krem lembut (arang hangat di mode gelap), judul di tengah, huruf serif, huruf awal besar.
  - **C · Dua Kolom** — kartu tulisan + panel samping (tanggal, waktu baca, penulis, info acara, tombol bagikan, tulisan lainnya) yang menempel saat digulir. Otomatis menjadi satu kolom bila ruang baca sempit (ponsel, tablet, atau tata letak dengan panel samping).
- Ukuran menyesuaikan **lebar ruang baca** (container query), bukan lebar layar → rapi di desktop, tablet, ponsel & PWA serta di semua model tata letak.
- Tulisan selalu berada di atas kartu pekat sehingga **kontras tetap jelas** di atas efek Gen Z, Aurora, Kaca, macOS, maupun foto/video latar belakang.
- Daftar “tulisan lainnya” ringkas di bawah setiap tulisan; tombol **Salin tautan** kini juga ada di berita lembaga.
### Logo & ikon transparan — tanpa latar putih
- Gambar PNG/WebP/GIF/SVG berlatar transparan **tetap transparan** saat diunggah (logo desa, logo lembaga, foto, dll.). Sebelumnya semua gambar diubah menjadi JPEG berlatar putih. Foto biasa tetap JPEG agar hemat ukuran.
- Kotak logo di header, menu admin, layar login & layar memuat tidak lagi memberi latar; logo ditampilkan utuh (tidak terpotong).
- **Ikon Aplikasi**: logo kini ditampilkan utuh tanpa terpotong (opsi baru “Isi penuh (potong tepi)”), bagian kosong tetap transparan di tab browser desktop, ponsel & tablet. Otomatis dibuat juga **ikon aplikasi berlatar warna tema** untuk layar utama Android/iOS & PWA (sistem operasi ponsel tidak menampilkan ikon transparan — Android memberi lingkaran putih), sehingga tidak ada latar putih.
- **Tanpa kilatan layar putih**: warna dasar tema dipasang sebelum halaman dimuat, dan layar pembuka PWA (warna latar & tema manifest) mengikuti tema website, termasuk mode gelap.
### Judul tab browser berjalan
- Judul tab kini **“Portal Resmi Gampong Deah Glumpang Powered by © 2026 Serenity Creativa Labs.”** dan bergerak perlahan dari kanan ke kiri (1 karakter tiap 0,28 detik, jeda singkat di awal tiap putaran) di desktop, ponsel, tablet, dan bilah judul jendela PWA. Dasbor admin: “Dasbor Admin — …”.
### Riwayat Chat Staf (Audit Log › tab baru, khusus Super Admin)
- Seluruh isi chat antar Kepala Dusun, Pengelola, Admin & Super Admin dapat **dibaca utuh per percakapan** (gelembung pesan, pengirim, penerima, tanggal, jam, perangkat), dengan pencarian isi pesan, saringan per staf & rentang tanggal, serta **ekspor PDF/Excel** per percakapan.
- Tabel Audit Log kini menampilkan **isi pesan** langsung pada baris Chat Staf; detail aktivitas menampilkan penerima & isi pesan.
- Setiap pembukaan Riwayat Chat dan ekspornya juga tercatat di Audit Log.
### Firestore
- Rules: ikon aplikasi boleh menyimpan versi ikon layar utama (`ikon.maskable`).
- Indeks baru `audit (cat, at)` untuk Riwayat Chat (bila belum siap, otomatis membaca dari audit log terbaru).

## v2.8.1 “Nadi” — 2026.10.29 (Build 2026.10.29 · R15 · Stable)
### Perbaikan
- **Dasbor kadang tertahan di animasi loading.** Penyebab: saat versi data di cache browser sama persis dengan server, Firestore tidak mengirim kabar “sudah dikonfirmasi server”, sehingga sinkron bertahap menunggu selamanya. Kini pemantau versi juga menerima kabar konfirmasi tersebut (tanpa tambahan read), ditambah pengaman: bila dalam 6 detik versi belum tiba, data langsung dimuat.
- **Postingan/dokumen yang baru disimpan tidak langsung muncul di halaman publik** (terutama di browser yang sama setelah logout/muat ulang). Penyebabnya sama — salinan lama di perangkat tetap ditampilkan karena versi terbaru dianggap “belum terkonfirmasi”. Kini halaman publik langsung memuat perubahan begitu versi server diterima.
- Penanda versi dari tulisan perangkat sendiri yang belum dikonfirmasi server diabaikan (mencegah muat ulang penuh ganda setelah menyimpan → lebih hemat read).

## v2.8.0 “Nadi” — 2026.10.29 (Build 2026.10.29 · R14 · Stable)
### Chat Staf privat
- Tombol **chat** baru di kanan bawah (dasbor & halaman publik) — **hanya muncul untuk Kepala Dusun, Pengelola Lembaga, Admin, dan Super Admin**. Pengunjung & warga tidak melihatnya sama sekali.
- Percakapan **1-lawan-1**: semua staf bisa saling mengirim pesan (Kadus ↔ Admin, Admin ↔ Super Admin, Kadus ↔ Kadus, dst.). Daftar kontak lengkap dengan jabatan, pencarian, urutan percakapan terbaru, jumlah belum dibaca, pratinjau pesan terakhir, centang **terkirim / dibaca**.
- **Privasi dijamin di server**: setiap percakapan hanya bisa dibaca & ditulis oleh kedua anggotanya (dikunci Firestore Rules, bukan sekadar disembunyikan di tampilan). Staf lain tidak bisa membuka percakapan orang lain.
- **Identitas Super Admin tetap tersembunyi**: tampil sebagai “Super Admin” tanpa nama asli maupun email.
- **Pesan permanen**: tidak bisa diubah atau dihapus oleh siapa pun, termasuk pengirim.
- **Audit Log**: setiap pesan tercatat lengkap (pengirim, penerima, waktu, perangkat, dan isi pesan) pada kategori baru **Chat Staf**. Audit Log hanya bisa dibuka Super Admin.
- **Notifikasi pesan masuk** di kanan bawah (nama, jabatan, cuplikan pesan; klik untuk membalas), bunyi lembut, lencana jumlah belum dibaca di tombol chat & ikon aplikasi (PWA), serta **notifikasi perangkat** saat tab tidak sedang dibuka (aktifkan lewat ikon lonceng di panel chat).
- Tautan di pesan otomatis bisa diklik, Enter untuk kirim & Shift+Enter untuk baris baru, draf tersimpan saat berpindah percakapan, “Muat pesan sebelumnya” untuk riwayat panjang. Di ponsel, panel chat tampil layar penuh.
- Hemat kuota: hanya 1 pemantauan daftar percakapan + 1 percakapan yang sedang dibuka. Daftar kontak diambil sekali per 10 menit.
- Akun yang dinonaktifkan/dihapus otomatis hilang dari daftar kontak (riwayat chat tetap tersimpan) dan tidak bisa lagi menerima pesan.
### Firestore Rules
- Koleksi baru `staf` (direktori kontak, hanya terbaca staf aktif) dan `chats/{id}/pesan` (hanya 2 anggota percakapan, pesan tidak bisa diubah/dihapus).
- Audit: kategori `chat` boleh menyimpan isi pesan hingga 2.600 karakter.

## v2.7.0 “Lumen” — 2026.10.29 (Build 2026.10.29 · R13 · Stable)
### Tata baca nyaman
- **Kotak putih di belakang tulisan dihilangkan.** Penyebabnya warna latar dari teks yang ditempel (Word, WhatsApp Web, situs lain) ikut tersimpan. Kini warna latar & warna hitam/putih bawaan tempelan diabaikan saat ditampilkan — **berlaku juga untuk semua postingan lama** tanpa perlu diedit.
- Tata baca baru untuk **Papan Informasi**, **Berita & Kegiatan Lembaga**, dan **Kegiatan Rutin**: lebar baris nyaman (±70 karakter), huruf lebih besar, jarak baris lega, perkiraan waktu baca, kutipan & tautan bergaya, mengikuti mode terang/gelap.
- **Halaman baca sendiri** untuk setiap berita lembaga (`#/lembaga/…/berita/…`) dan setiap kegiatan rutin (`#/kegiatan/…`), lengkap dengan tombol bagikan WhatsApp. Berita lembaga di beranda & halaman lembaga kini berupa kartu yang membuka halaman baca.
### Pemutar video & foto otomatis
- Tempel link di **baris tersendiri** pada isi postingan, atau di kolom “Foto & video dari URL”, dan langsung tampil sebagai pemutar/foto: **YouTube, TikTok, Instagram (post & reel), Facebook (video, reel, post), Vimeo, X/Twitter, Spotify, Google Drive, link foto (.jpg/.png/.webp/.gif), video .mp4**. Link lain menjadi kartu tautan rapi. URL di dalam teks otomatis menjadi tautan.
- Kegiatan Rutin kini punya kolom **Foto & video** dan keterangan yang lebih panjang.
### Admin › Lembaga › Berita & Kegiatan
- Menu baru untuk mengelola **berita & kegiatan seluruh lembaga** dari satu tempat: saring per kategori & per lembaga, cari, tulis, ubah, hapus, buka halaman baca. Setiap halaman kategori lembaga juga menampilkan panel beritanya. Pengelola lembaga hanya melihat lembaga yang ditugaskan.
### Keterangan pada setiap kolom isian
- Semua kolom isian kini memiliki petunjuk (placeholder) & keterangan saat diarahkan — diambil dari label kolom bila belum ada petunjuk khusus (email, nomor HP, tautan, tahun, RT/RW, urutan, tanggal, dll.).
### Privasi tampilan teknis
- Kata **Firebase, Firestore, GitHub** dan pesan galat teknis berbahasa Inggris tidak lagi terlihat oleh pengunjung, admin, maupun Kadus — diganti kalimat umum berbahasa Indonesia. **Hanya Super Admin** yang melihat detail teknis. Konsol browser juga senyap untuk selain Super Admin. Konfigurasi tidak diubah sama sekali.
### Perbaikan
- **Kursor animasi tidak muncul** di banyak laptop: (1) laptop layar sentuh/hibrida tidak dikenali sebagai perangkat ber-mouse, (2) setelan “kurangi animasi” Windows/macOS ikut mematikan kursor. Keduanya diperbaiki — kursor tetap aktif; hanya jejak & efek klik yang mengikuti setelan tersebut.
### Firestore Rules
- Kegiatan rutin: keterangan hingga 30.000 karakter & daftar media (maks. 30).

## v2.6.0 “Orbit” — 2026.10.29 (Build 2026.10.29 · R12 · Stable)
### Animasi Kursor & Ikon (Super Admin › Tampilan & Tema)
- **5 model kursor**: Mati, **Dot + Ring** (membesar di tombol, menyempit jadi garis di kolom teks), **Glow Spotlight**, **Jejak Neon**, **Blob Cair** (meregang saat bergerak cepat). Ukuran 60–180%, tombol **magnetic**, opsi sembunyikan panah asli.
- **Efek klik**: Ripple, Sparkle, Konfeti mini.
- **Ikon animasi** 3 tingkat: *Halus* (ikon bergerak sesuai jenisnya saat diarahkan — lonceng bergoyang, refresh berputar, unduh memantul, lokasi jatuh, dll.), *Sedang* (+ ikon muncul saat digulir, garis ikon “tergambar”, kilau logo), *Ramai* (+ gerak halus terus-menerus).
- Cakupan: halaman publik saja atau publik + dasbor. Otomatis mati di layar sentuh & bila perangkat meminta “kurangi gerakan”. Satu animasi frame yang berhenti sendiri saat kursor diam — ringan & tanpa pustaka.
- Gaya Gen Z kini membawa paket animasi masing-masing (Dot + Ring, Glow, Jejak Neon, Blob).
### Tema baru: macOS
- Efek **macOS**: menu bar kaca (vibrancy), panel & hero berbentuk jendela dengan lampu lalu lintas, dialog ala jendela Mac (lampu merah = tutup), tombol & kontrol segmen ala Mac, menu dropdown dengan sorotan biru, sidebar ala Finder, scrollbar tipis, wallpaper lembut ala Sonoma.
- Di ponsel/tablet navigasi bawah berubah menjadi **dock** melayang.
- Gaya siap pakai **macOS Sonoma** (terang) & **macOS Dark**; palet **macOS Aqua, Graphite, Purple, Green**; huruf **SF Pro (Apple System)** dengan pengganti Inter di Windows/Android.
### Tampilan ringkas ponsel & tablet (semua tema)
- **Navigasi bawah** (Beranda, Info, Lembaga, Data, Menu) dan menu lengkap berbentuk **lembar bawah**.
- Hero lebih padat (tombol bergeser horizontal, 6 statistik ringkas), berita & galeri **bergeser horizontal**, layanan & data publik 2 kolom, jadwal sholat ringkas 4 kolom, panel berita lembaga lebih pendek.
- Dialog berbentuk **bottom sheet** dengan pegangan, tombol aksi menempel di bawah; dasbor admin 2 kolom statistik, formulir 1 kolom, tab bergeser.
- Mendukung area aman iPhone (notch / home indicator). Tablet memakai jarak yang lebih rapat.
### Perbaikan
- Menu ponsel tidak lagi tertutup sendiri saat data diperbarui di latar.

## v2.5.0 “Prisma” — 2026.10.29 (Build 2026.10.29 · R11 · Stable)
### Gaya baru: Gen Z Vibrant
- Efek visual baru **Gen Z Vibrant**: blob neon bergerak, tekstur grain halus, judul tebal bergradasi, tombol pil bercahaya, kartu “sticker” dengan bayangan geser, garis gradasi pada judul bagian, running text & hitung mundur sholat bergradasi, animasi muncul saat digulir. Ringan (GPU) dan menghormati pengaturan “kurangi gerakan”.
- 4 gaya siap pakai: **Gen Z Vibrant** (Clash Display + Satoshi), **Gen Z Neon Night** (mode gelap, Cabinet Grotesk + General Sans), **Gen Z Acid** (Syne + Space Grotesk), **Gen Z Sunset** (Bebas Neue + Outfit).
- 4 palet warna baru grup **Gen Z**: Gen Z Electric, Acid Lime, Sunset Pop, Cyber Ocean. Semua tetap bisa diganti warna kustom oleh Super Admin.
### Pustaka Huruf (Super Admin)
- **38 huruf** yang bisa dipilih terpisah untuk **judul** dan **teks**: Plus Jakarta Sans, Inter, Satoshi, Outfit, General Sans, Clash Display, Syne, Cabinet Grotesk, Bebas Neue, Playfair Display, Cinzel, Fraunces, Instrument Serif, Sora, Space Grotesk, Lexend, JetBrains Mono, Space Mono, Helvetica, Arial, Verdana, Open Sans, Poppins, Lato, Roboto, Montserrat, Times New Roman, Cambria, Geneva, Courier, Butler, Lucida Bright, Raleway, Merriweather, Nunito, Garamond, Perpetua, Proxima Nova.
- Pratinjau langsung, galeri semua huruf, dan tombol cepat “Judul / Teks”. Huruf dimuat hanya bila dipakai (Google Fonts & Fontshare).
- Huruf komersial/sistem memakai huruf terpasang di perangkat pengunjung bila ada, dengan pengganti gratis yang mirip (Proxima Nova → Montserrat, Butler → Playfair Display, Perpetua → Cormorant Garamond, Lucida Bright → Libre Baskerville, Cambria → Caladea, Garamond → EB Garamond).
- Huruf pilihan ikut diingat perangkat sehingga tampil benar sejak halaman pertama dibuka.

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
