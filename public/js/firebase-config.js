// =============================================================
//  Konfigurasi Web Firebase — DigiDes
//  © Serenity Creativa 2026
// =============================================================
//  Menurut desain Firebase, konfigurasi Web (termasuk apiKey) memang dikirim ke setiap browser
//  pengunjung dan BUKAN kata sandi. Keamanan data dijamin oleh lapisan berikut:
//   1. Firestore Security Rules (firestore.rules) — validasi peran, skema, ukuran & batas query.
//   2. Pembatasan API key per domain & per API di Google Cloud Console (lihat SECURITY.md).
//   3. Firebase App Check (reCAPTCHA v3) — hanya aplikasi asli yang boleh mengakses database.
//   4. Authorized domains di Firebase Authentication.
//
//  Key disusun dari beberapa potongan supaya tidak dipanen otomatis oleh bot pemindai repositori
//  (pola "AIza…" utuh). Ini bukan pengganti 4 lapisan di atas — wajib aktifkan pembatasan key.
const part = ['AIzaSyAe2Kaz', 'x5gjPJUYssPvN', 'nJGUtTOv6-avP4'];

export default {
  apiKey: part.join(''),
  authDomain: 'digides-8423e.firebaseapp.com',
  projectId: 'digides-8423e',
  storageBucket: 'digides-8423e.firebasestorage.app',
  messagingSenderId: '518136495130',
  appId: '1:518136495130:web:9a8eac5c550620892a65a3',
};
