# Implementation Plan: To-Do Life Dashboard

## Overview

Implementasi dilakukan secara bertahap: struktur HTML dasar → StorageService → ThemeManager → GreetingWidget → FocusTimer → TodoManager → LinkManager → integrasi akhir dan wiring. Setiap langkah divalidasi sebelum melanjutkan ke langkah berikutnya. Seluruh kode ditulis dalam satu file `index.html`, satu file `css/style.css`, dan satu file `js/app.js`.

## Tasks

- [x] 1. Buat struktur file proyek dan kerangka HTML
  - Buat file `index.html` dengan struktur semantik HTML5 yang mencakup empat section: greeting widget, focus timer, todo manager, dan link manager
  - Buat file `css/style.css` dengan variabel CSS untuk tema terang dan gelap (CSS custom properties pada `:root` dan `[data-theme="dark"]`)
  - Buat file `js/app.js` dengan pola IIFE/module pattern sebagai kerangka kosong untuk semua modul
  - Pastikan `index.html` memuat `css/style.css` dan `js/app.js` dengan benar
  - _Requirements: 9.1, 9.2_

- [x] 2. Implementasi StorageService
  - [x] 2.1 Tulis implementasi `StorageService` di `js/app.js`
    - Implementasi metode `get(key)`, `set(key, value)`, `remove(key)`, dan `clear()`
    - Gunakan try-catch pada semua operasi localStorage; `set` mengembalikan `false` saat `QuotaExceededError`; `get` mengembalikan `null` saat exception atau JSON corrupt
    - Definisikan konstanta kunci storage: `tld_username`, `tld_theme`, `tld_timer_duration`, `tld_todos`, `tld_links`
    - _Requirements: 2.2, 2.7, 4.2, 5.10, 6.4, 7.4, 8.2, 8.3_

  - [ ]* 2.2 Tulis property test round-trip StorageService
    - **Property 3: Round-trip penyimpanan nama pengguna**
    - **Property 7: Round-trip penyimpanan daftar tugas**
    - **Property 11: Round-trip penyimpanan preferensi tema**
    - **Validates: Requirements 2.2, 2.6, 5.10, 7.4, 8.2**

- [x] 3. Implementasi ThemeManager
  - [x] 3.1 Tulis implementasi `ThemeManager` di `js/app.js`
    - Implementasi metode `init()`, `toggle()`, `apply(theme)`, dan `persist(theme)`
    - `init()` harus membaca preferensi dari storage dan memanggil `apply()` sebelum konten lain dirender (cegah flash of wrong theme)
    - `apply(theme)` menetapkan atribut `data-theme` pada elemen `<html>` untuk mengaktifkan variabel CSS yang sesuai
    - Tangkap kegagalan storage dengan senyap; tetap terapkan tema untuk sesi berjalan
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 3.2 Tambahkan toggle tema ke HTML dan sambungkan ke ThemeManager
    - Tambahkan elemen toggle (checkbox atau button) di `index.html`
    - Daftarkan event listener pada toggle yang memanggil `ThemeManager.toggle()`
    - _Requirements: 7.1_

- [x] 4. Implementasi GreetingWidget
  - [x] 4.1 Tulis logika `GreetingWidget` di `js/app.js`
    - Implementasi `getGreetingText(hour, name)` dengan empat interval: 0–11 → "Selamat Pagi", 12–14 → "Selamat Siang", 15–17 → "Selamat Sore", 18–23 → "Selamat Malam"
    - Implementasi `formatDate(date)` yang mengembalikan format "NamaHari, DD NamaBulan YYYY" dalam Bahasa Indonesia
    - Implementasi `startClock()` dengan `setInterval` setiap 1 detik yang memanggil `updateDisplay()`
    - Tangkap exception `new Date()` dan tampilkan pesan "Waktu tidak tersedia"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 4.2 Tulis property test logika salam GreetingWidget
    - **Property 1: Salam berdasarkan jam selalu tepat**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 4.3 Implementasi manajemen nama pengguna di GreetingWidget
    - Implementasi `validateName(name)` menggunakan regex `/^[a-zA-ZÀ-ÿ\s\-]{1,50}$/`
    - Implementasi `promptForName()` yang menampilkan form input nama saat nama belum tersimpan di storage
    - Implementasi `saveName(name)` yang memvalidasi, menyimpan ke storage, dan memperbarui tampilan salam
    - Implementasi `changeName()` yang memunculkan kembali form input nama
    - Tampilkan pesan validasi untuk nama tidak valid; jangan simpan nama tidak valid
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 4.4 Tulis property test validasi nama pengguna
    - **Property 2: Validasi nama pengguna konsisten**
    - **Validates: Requirements 2.2, 2.3**

- [x] 5. Checkpoint — Pastikan semua tes lolos, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 6. Implementasi FocusTimer
  - [x] 6.1 Tulis logika state machine FocusTimer di `js/app.js`
    - Implementasi state `IDLE | RUNNING | PAUSED | COMPLETED` dengan transisi yang benar
    - Implementasi `formatDisplay(seconds)` yang menghasilkan string "MM:SS" untuk 0–7200 detik
    - Implementasi `init()` yang membaca `tld_timer_duration` dari storage atau fallback ke 25 menit
    - Implementasi `start()`, `pause()`, `resume()`, `reset()`, `tick()`, dan `onComplete()`
    - `tick()` dipanggil oleh `setInterval` setiap 1 detik; mendekremen `remainingSeconds` dan memperbarui DOM
    - `onComplete()` berhenti otomatis dan menampilkan indikator visual selesai yang bertahan hingga reset
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 6.2 Tulis property test format tampilan timer
    - **Property 4: Format tampilan timer selalu MM:SS**
    - **Validates: Requirements 3.1**

  - [x] 6.3 Implementasi tombol kontrol timer dan state tombol
    - Tambahkan tombol "Mulai", "Jeda", "Lanjut", "Reset" ke `index.html`
    - Implementasi `updateButtonStates()` yang mengaktifkan/menonaktifkan tombol sesuai state saat ini
    - Daftarkan event listener untuk setiap tombol kontrol
    - _Requirements: 3.8, 3.9, 3.10_

  - [x] 6.4 Implementasi pengaturan durasi kustom timer
    - Tambahkan kolom input numerik dan tombol simpan durasi ke `index.html`
    - Implementasi `saveDuration(minutes)` yang memvalidasi rentang 1–120 (bilangan bulat), menyimpan ke storage
    - Tampilkan pesan kesalahan untuk input di luar rentang atau bukan bilangan bulat
    - Durasi baru saat timer berjalan hanya berlaku pada sesi berikutnya
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 6.5 Tulis property test validasi durasi timer
    - **Property 5: Validasi durasi timer konsisten**
    - **Validates: Requirements 4.2, 4.5, 4.6**

- [x] 7. Implementasi TodoManager
  - [x] 7.1 Tulis logika `TodoManager` di `js/app.js`
    - Definisikan model data `Todo` dengan properti `id`, `text`, `completed`, `createdAt`
    - Implementasi `validateText(text)` yang menerima string 1–200 karakter setelah trim dan menolak string kosong/spasi-saja
    - Implementasi `addTodo(text)`, `toggleTodo(id)`, `editTodo(id, newText)`, `deleteTodo(id)`
    - `editTodo` dengan teks kosong/spasi-saja harus membatalkan perubahan secara senyap
    - Implementasi `persist()` yang menyimpan seluruh array todos ke storage setelah setiap perubahan
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 7.2 Tulis property test validasi teks tugas
    - **Property 6: Validasi teks tugas konsisten**
    - **Validates: Requirements 5.2, 5.3, 5.8**

  - [x] 7.3 Implementasi render TodoManager ke DOM
    - Implementasi `render()` yang me-render ulang seluruh daftar tugas ke `index.html`
    - Tampilkan tugas selesai dengan teks dicoret dan opacity berbeda
    - Sediakan tombol edit dan hapus untuk setiap item tugas
    - Tampilkan daftar kosong tanpa pesan error bila tidak ada tugas tersimpan
    - Daftarkan event listener untuk input tambah tugas (tombol tambah + Enter), toggle, edit, dan hapus
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11_

  - [ ]* 7.4 Tulis property test round-trip penyimpanan daftar tugas
    - **Property 7: Round-trip penyimpanan daftar tugas**
    - **Validates: Requirements 5.10, 8.2**

  - [ ]* 7.5 Tulis property test toggle status tugas
    - **Property 10: Toggle status tugas bersifat idempoten (round-trip)**
    - **Validates: Requirements 5.4, 5.5**

- [x] 8. Implementasi LinkManager
  - [x] 8.1 Tulis logika `LinkManager` di `js/app.js`
    - Definisikan model data `QuickLink` dengan properti `id`, `name`, `url`, `createdAt`
    - Implementasi `validateLink(name, url)` menggunakan aturan: nama 1–50 karakter non-spasi-saja, URL diawali `http://` atau `https://` dan panjang ≤ 2048 karakter
    - Implementasi `addLink(name, url)`, `deleteLink(id)` dengan konfirmasi sebelum hapus
    - Implementasi `persist()` yang menyimpan seluruh array links ke storage setelah setiap perubahan
    - Batasi maksimal 20 quick links; tampilkan pesan error bila batas tercapai
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10_

  - [ ]* 8.2 Tulis property test validasi quick link
    - **Property 8: Validasi Quick Link konsisten**
    - **Validates: Requirements 6.4, 6.5, 6.6**

  - [x] 8.3 Implementasi render LinkManager ke DOM
    - Implementasi `render()` yang me-render quick links sebagai tombol yang dapat diklik
    - Klik pada tombol quick link membuka URL di tab baru (`target="_blank"`)
    - Sediakan antarmuka tambah link (form nama + URL) dan tombol hapus per item
    - Muat dan tampilkan links dari storage saat init, dalam urutan `createdAt` dari lama ke baru
    - Tampilkan daftar kosong tanpa pesan error bila tidak ada link tersimpan
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.9, 8.1, 8.2_

  - [ ]* 8.4 Tulis property test urutan tampil quick links
    - **Property 9: Urutan tampil quick links stabil**
    - **Validates: Requirements 6.9**

- [-] 9. Checkpoint — Pastikan semua tes lolos, tanyakan kepada pengguna jika ada pertanyaan.

- [ ] 10. Implementasi styling responsif di `css/style.css`
  - [ ] 10.1 Tulis layout dasar dan grid/flexbox untuk empat komponen
    - Pastikan layout tidak ada elemen tumpang tindih, terpotong, atau tersembunyi pada lebar 320px–2560px
    - Terapkan variabel CSS tema terang dan gelap yang sudah didefinisikan di task 1
    - _Requirements: 9.2_

  - [~] 10.2 Implementasi styling state tugas selesai dan indikator timer selesai
    - Tugas selesai: teks dicoret (`text-decoration: line-through`) dan opacity yang berbeda
    - Timer selesai: indikator visual yang jelas pada area timer (misalnya perubahan warna atau class khusus)
    - Pastikan tidak ada layout shift saat jam dan timer diperbarui setiap detik
    - _Requirements: 3.7, 5.4, 9.4_

- [ ] 11. Wiring akhir dan inisialisasi `app.js`
  - [~] 11.1 Sambungkan semua modul di entry point `app.js`
    - Pastikan urutan inisialisasi: `ThemeManager.init()` → `GreetingWidget.init()` → `FocusTimer.init()` → `TodoManager.init()` → `LinkManager.init()`
    - `GreetingWidget.init()` harus memeriksa storage: bila nama ada tampilkan salam; bila tidak ada tampilkan form input nama
    - Pastikan semua event listener terdaftar dan semua data di-render dari storage saat halaman dimuat
    - _Requirements: 2.1, 3.2, 4.4, 5.11, 6.9, 7.5, 8.1, 8.2, 8.3, 8.4_

- [~] 12. Checkpoint akhir — Pastikan semua tes lolos, tanyakan kepada pengguna jika ada pertanyaan.

## Notes

- Task yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke tahap berikutnya
- Property test memvalidasi properti kebenaran universal yang didefinisikan di design.md
- Unit test memvalidasi contoh spesifik dan kondisi tepi
- Urutan inisialisasi `ThemeManager.init()` pertama adalah kritis untuk mencegah *flash of wrong theme*

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "7.1"] },
    { "id": 7, "tasks": ["6.5", "7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3"] },
    { "id": 10, "tasks": ["8.4", "10.1"] },
    { "id": 11, "tasks": ["10.2"] },
    { "id": 12, "tasks": ["11.1"] }
  ]
}
```
