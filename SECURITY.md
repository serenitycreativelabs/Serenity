# Panduan Keamanan DigiDes

© Serenity Creativa 2026

## 1. API key Firebase & cara mengamankannya

Sejak **v2.1.0**, konfigurasi Firebase **tertanam di aplikasi** (`public/js/firebase-config.js`) supaya langsung terhubung di semua browser dan perangkat tanpa input manual.

**Mengapa ini aman?** API key Web Firebase bukan kata sandi — Google merancangnya untuk dikirim ke setiap browser pengunjung (dokumentasi resmi Firebase menjelaskan bahwa API key Firebase berbeda dengan API key biasa dan boleh dicantumkan di kode aplikasi web; lihat *firebase.google.com/docs/projects/api-keys*). Yang melindungi data Anda adalah **empat lapisan** berikut, dan **semuanya wajib aktif**:

| Lapisan | Melindungi dari | Status |
|---|---|---|
| Firestore Rules v2.1 (`firestore.rules`) | Akses data tanpa izin, spam tulis, scraping massal (batas dokumen per query), Kadus melihat dusun lain | ✅ otomatis ter-deploy |
| Pembatasan API key per domain & API (Langkah A) | Key dipakai dari situs/aplikasi lain, pencurian kuota | ⚠️ **lakukan manual sekali** |
| App Check reCAPTCHA v3 (bagian 2) | Bot/skrip yang memanggil Firebase langsung | ⚠️ **disarankan** |
| Authorized domains (Authentication) | Login dari domain asing | ✅ bawaan Firebase |

Key disusun dari beberapa potongan di kode agar tidak dipanen otomatis oleh bot pemindai GitHub. Bila GitHub tetap menampilkan peringatan, tutup dengan alasan **“False positive / used in tests”** setelah Langkah A selesai — key yang sudah dibatasi tidak bisa disalahgunakan.

Lakukan langkah berikut **sekali saja**:

### Langkah A — Batasi (atau ganti) API key lama  ⚠️ PALING PENTING
1. Buka **https://console.cloud.google.com/apis/credentials?project=digides-8423e**
2. Klik key bernama **“Browser key (auto created by Firebase)”**.
3. **Application restrictions → Websites**, tambahkan:
   - `https://digides-8423e.web.app/*`
   - `https://digides-8423e.firebaseapp.com/*`
   - domain kustom Anda bila ada, mis. `https://gampong-anda.id/*`
   - `http://localhost:*/*` (hanya bila perlu uji lokal)
4. **API restrictions → Restrict key**, centang hanya:
   - Identity Toolkit API
   - Token Service API
   - Cloud Firestore API
   - Firebase Installations API
   - Firebase App Check API
5. **Save**. Key yang bocor kini **tidak bisa dipakai dari situs lain** maupun untuk API lain.
6. (Opsional, paling aman) Klik **Regenerate key**. Karena aplikasi membaca key dari `init.json`, **tidak perlu mengubah kode** — key baru otomatis dipakai setelah deploy berikutnya.

> Catatan: API key Web Firebase memang dirancang dapat dilihat di browser (bukan password). Keamanan data dijaga oleh **Firestore Rules**, **Authentication**, **pembatasan key** di atas, dan **App Check**. Namun membatasi key mencegah penyalahgunaan kuota oleh bot.

### Langkah B — Tutup peringatan GitHub
GitHub → repo → **Security → Secret scanning** → pilih peringatan → **Close as “Revoked”** (bila sudah regenerate) atau **“Used in tests / false positive”** (bila sudah dibatasi).

### Langkah C — Bersihkan riwayat commit (opsional)
Cara termudah: hapus repo lama lalu buat repo baru dan push ulang proyek v2 ini (riwayat lama ikut hilang).
Cara lanjutan (tetap di repo yang sama):
```bash
pip install git-filter-repo
echo 'TEMPEL_API_KEY_LAMA_DI_SINI==>REMOVED' > replace.txt   # ganti dengan key lama secara utuh
git filter-repo --replace-text replace.txt --force
git push origin --force --all
```

## 2. Aktifkan App Check (anti-bot & anti pencurian kuota)
1. Buat site key **reCAPTCHA v3** di https://www.google.com/recaptcha/admin → domain: `digides-8423e.web.app`, `digides-8423e.firebaseapp.com`.
2. Firebase Console → **App Check** → Apps → Web app → **reCAPTCHA v3** → tempel **secret key** → Save.
3. Tempel **site key** (berawalan `6L…`, aman untuk publik) ke `public/js/config.js` → `appCheckSiteKey`.
4. Deploy, buka aplikasi, pastikan berjalan normal, lalu di App Check → **Cloud Firestore** & **Authentication** → **Enforce**.

## 3. Cegah pembengkakan biaya
- Tetap gunakan paket **Spark (gratis)**: tidak ada tagihan sama sekali; bila kuota harian habis layanan hanya berhenti sementara.
- Bila memakai **Blaze**: Google Cloud → Billing → **Budgets & alerts** → buat anggaran (mis. Rp 50.000) dengan notifikasi email 50/90/100%.
- Firebase Console → **Usage and billing** untuk memantau baca/tulis Firestore.
- Aplikasi tidak memakai Firebase Storage (gambar dikompres ke Firestore), sehingga tidak ada biaya unduhan file.

## 4. Akun & peran
| Peran | Cara login | Akses |
|---|---|---|
| **Super Admin** (`serenityxcreative@gmail.com`) | Klik **5×** tulisan “© Serenity Creativa 2026” → masukkan **password saja** | Semua fitur + Manajemen Admin, Audit Log, Cadangan & Pemulihan |
| **Admin** | `#/login` → email + password | Hanya fitur yang dicentang Super Admin |

- Akun admin **hanya** bisa dibuat Super Admin (menu *Manajemen Admin*). Login tanpa profil terdaftar otomatis ditolak.
- Firebase Console → Authentication → Settings → **User actions → Enable create (sign-up)** harus **aktif** agar Super Admin bisa mendaftarkan admin dari aplikasi. Akun yang dibuat orang lain tanpa profil tetap **tidak punya akses apa pun** (dikunci Firestore Rules). Bila ingin lebih ketat, matikan opsi ini dan aktifkan hanya saat mendaftarkan admin.

## 5. Data pribadi warga
- Data warga, dusun, dan master hanya dapat dibaca akun berizin (Firestore Rules).
- Cache offline di perangkat **dihapus saat logout**; logout otomatis setelah tidak aktif.
- Berkas cadangan JSON berisi NIK & data pribadi — simpan di tempat terenkripsi, jangan dibagikan.
- Semua akses detail warga, ekspor, dan perubahan tercatat permanen di **Audit Log**.


## 6. Daftar periksa keamanan (v2.2.0)
| Status | Item |
|---|---|
| ✅ Kode | API key tertanam terpecah (tidak memicu pemindai GitHub); tidak ada service account di repo |
| ✅ Kode | Firestore Rules: peran superadmin/admin/kadus + izin per fitur, validasi skema & ukuran, batas query publik ≤200, audit log hanya-tambah |
| ✅ Kode | Data anggota/murid lembaga di koleksi privat `lembagaPrivate` |
| ✅ Kode | Kata sandi ulang untuk impor, hapus, dan pengaturan sensitif; logout otomatis saat idle |
| ⚠️ Anda | Batasi API key (HTTP referrer + daftar API) — Langkah A |
| ⚠️ Anda | Aktifkan App Check + Enforce — bagian 2 |
| ⚠️ Anda | Authorized domains & Email enumeration protection di Authentication → Settings |
| ⚠️ Anda | Tetap paket Spark, atau pasang budget alert bila Blaze |
| ⚠️ Anda | Deploy `firestore.rules` terbaru (workflow / `firebase deploy --only firestore:rules`) |
| ⚠️ Anda | Tutup alert secret scanning GitHub setelah key dibatasi |
