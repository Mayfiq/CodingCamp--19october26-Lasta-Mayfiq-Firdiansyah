# Requirements Document

## Introduction

To-Do List Life Dashboard adalah sebuah aplikasi web sederhana berbasis satu halaman (single-page) yang membantu pengguna mengorganisir hari mereka. Dashboard ini menggabungkan empat komponen utama: tampilan waktu dan salam, focus timer berbasis Pomodoro, to-do list interaktif, dan koleksi quick links ke situs favorit. Seluruh data disimpan di sisi klien menggunakan Local Storage, tanpa memerlukan server atau backend. Aplikasi dibangun dengan HTML, CSS, dan Vanilla JavaScript murni.

---

## Glossary

- **Dashboard**: Halaman web utama yang menampilkan semua komponen sekaligus.
- **Greeting_Widget**: Komponen yang menampilkan waktu, tanggal, dan salam berdasarkan waktu hari.
- **Focus_Timer**: Komponen timer hitung mundur berbasis Pomodoro untuk sesi fokus kerja.
- **Todo_Manager**: Komponen yang mengelola daftar tugas (to-do list) pengguna.
- **Link_Manager**: Komponen yang mengelola dan menampilkan tombol quick links.
- **Storage**: Browser Local Storage API yang digunakan untuk menyimpan seluruh data pengguna.
- **Tugas**: Satu item pekerjaan yang ditambahkan pengguna ke dalam Todo_Manager.
- **Quick Link**: Satu entri tautan berisi nama tampilan dan URL yang disimpan pengguna.
- **Sesi Fokus**: Satu periode hitung mundur aktif pada Focus_Timer.
- **Tema**: Pilihan tampilan visual Dashboard, yaitu Terang (Light) atau Gelap (Dark).
- **Pengguna**: Orang yang menggunakan Dashboard melalui browser web.

---

## Requirements

### Requirement 1: Tampilan Waktu dan Salam (Greeting Widget)

**User Story:** Sebagai pengguna, saya ingin melihat waktu, tanggal, dan salam yang sesuai saat membuka dashboard, agar saya langsung tahu konteks waktu saat ini.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL menampilkan jam dan menit saat ini dalam format 24 jam yang diperbarui setiap detik.
2. THE Greeting_Widget SHALL menampilkan nama hari dan tanggal lengkap dalam Bahasa Indonesia dengan format "NamaHari, DD NamaBulan YYYY" (contoh: "Rabu, 21 Oktober 2026"), menggunakan nama hari dan bulan dalam Bahasa Indonesia.
3. WHEN waktu berada antara pukul 00:00 dan 11:59, THE Greeting_Widget SHALL menampilkan salam "Selamat Pagi".
4. WHEN waktu berada antara pukul 12:00 dan 14:59, THE Greeting_Widget SHALL menampilkan salam "Selamat Siang".
5. WHEN waktu berada antara pukul 15:00 dan 17:59, THE Greeting_Widget SHALL menampilkan salam "Selamat Sore".
6. WHEN waktu berada antara pukul 18:00 dan 23:59, THE Greeting_Widget SHALL menampilkan salam "Selamat Malam".
7. IF waktu lokal perangkat tidak dapat dibaca, THEN THE Greeting_Widget SHALL menampilkan pesan error yang menginformasikan bahwa waktu tidak tersedia dan tidak menampilkan salam maupun tanggal.

---

### Requirement 2: Salam dengan Nama Kustom

**User Story:** Sebagai pengguna, saya ingin dashboard menyapa saya dengan nama saya sendiri, agar pengalaman terasa lebih personal.

#### Acceptance Criteria

1. WHEN Pengguna pertama kali membuka Dashboard dan nama belum tersimpan di Storage, THE Greeting_Widget SHALL menampilkan prompt atau form untuk memasukkan nama.
2. WHEN Pengguna memasukkan nama yang valid (1–50 karakter, hanya berisi huruf, spasi, atau tanda hubung) dan mengonfirmasi, THE Storage SHALL menyimpan nama tersebut di Local Storage hingga pengguna secara eksplisit menghapus atau mengubahnya.
3. IF Pengguna memasukkan nama yang kosong, hanya berisi spasi, melebihi 50 karakter, atau mengandung karakter selain huruf, spasi, dan tanda hubung, THEN THE Greeting_Widget SHALL menampilkan pesan validasi dan tidak menyimpan nama tersebut.
4. WHILE nama tersimpan di Storage, THE Greeting_Widget SHALL menampilkan salam yang menyertakan nama pengguna sesuai waktu hari (contoh: "Selamat Pagi, Budi!").
5. THE Greeting_Widget SHALL menyediakan opsi untuk mengubah nama yang sudah tersimpan.
6. WHEN Pengguna mengubah nama dengan nilai yang valid, THE Storage SHALL memperbarui nilai nama di Local Storage dan THE Greeting_Widget SHALL segera menampilkan salam dengan nama baru.
7. IF penulisan nama ke Local Storage gagal, THEN THE Greeting_Widget SHALL menampilkan nama hanya untuk sesi saat ini tanpa menampilkan pesan error kepada pengguna.

---

### Requirement 3: Focus Timer (Pomodoro)

**User Story:** Sebagai pengguna, saya ingin menggunakan timer hitung mundur untuk sesi fokus kerja, agar saya dapat mengelola waktu produktivitas dengan efektif.

#### Acceptance Criteria

1. THE Focus_Timer SHALL menampilkan hitung mundur dalam format MM:SS.
2. WHEN Focus_Timer pertama kali dimuat dan belum ada konfigurasi tersimpan, THE Focus_Timer SHALL menggunakan durasi default 25 menit.
3. WHEN Pengguna menekan tombol "Mulai", THE Focus_Timer SHALL memulai hitung mundur dari durasi yang dikonfigurasi (antara 1 hingga 60 menit).
4. WHEN Focus_Timer sedang berjalan dan Pengguna menekan tombol "Jeda", THE Focus_Timer SHALL menghentikan hitung mundur sementara pada nilai saat ini.
5. WHEN Focus_Timer dijeda dan Pengguna menekan tombol "Lanjut", THE Focus_Timer SHALL melanjutkan hitung mundur dari nilai yang tersimpan.
6. WHEN Pengguna menekan tombol "Reset", THE Focus_Timer SHALL menghentikan hitung mundur dan mengembalikan tampilan ke durasi yang dikonfigurasi.
7. WHEN hitung mundur mencapai 00:00, THE Focus_Timer SHALL berhenti secara otomatis dan menampilkan indikator visual pada area timer yang bertahan hingga tombol Reset ditekan, untuk menandakan sesi selesai.
8. WHILE Focus_Timer dalam status idle (belum dimulai atau setelah reset), THE Focus_Timer SHALL mengaktifkan tombol "Mulai" dan menonaktifkan tombol "Jeda" dan "Lanjut".
9. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL mengaktifkan tombol "Jeda" dan menonaktifkan tombol "Mulai" dan "Lanjut".
10. WHILE Focus_Timer dalam status dijeda, THE Focus_Timer SHALL mengaktifkan tombol "Lanjut" dan tombol "Reset", serta menonaktifkan tombol "Mulai" dan "Jeda".

---

### Requirement 4: Pengaturan Durasi Pomodoro Kustom

**User Story:** Sebagai pengguna, saya ingin mengatur sendiri durasi focus timer, agar saya dapat menyesuaikan panjang sesi fokus dengan kebutuhan saya.

#### Acceptance Criteria

1. THE Focus_Timer SHALL menyediakan kolom input numerik bertipe bilangan bulat untuk memasukkan durasi kustom dalam satuan menit.
2. WHEN Pengguna memasukkan bilangan bulat antara 1 dan 120 menit dan mengaktifkan tombol simpan, THE Storage SHALL menyimpan durasi kustom tersebut di Local Storage.
3. WHEN durasi kustom tersimpan di Storage, THE Focus_Timer SHALL menggunakan durasi tersebut sebagai nilai awal saat sesi direset atau halaman dimuat ulang.
4. WHEN Focus_Timer dimuat dan tidak ada durasi kustom tersimpan di Storage, THE Focus_Timer SHALL menggunakan durasi default 25 menit.
5. IF Pengguna memasukkan nilai di luar rentang 1 hingga 120, THEN THE Focus_Timer SHALL menampilkan pesan kesalahan yang menyebutkan rentang valid (1–120 menit) dan tidak menyimpan nilai tersebut.
6. IF Pengguna memasukkan nilai bukan bilangan bulat atau kolom input kosong, THEN THE Focus_Timer SHALL menampilkan pesan kesalahan yang meminta input berupa angka bulat dan tidak menyimpan nilai tersebut.
7. WHEN Pengguna menyimpan durasi baru saat Focus_Timer sedang berjalan, THE Focus_Timer SHALL menerapkan durasi baru hanya pada sesi berikutnya tanpa mengganggu sesi yang sedang berjalan.

---

### Requirement 5: Pengelolaan To-Do List

**User Story:** Sebagai pengguna, saya ingin menambah, mengedit, menandai, dan menghapus tugas, agar saya dapat melacak pekerjaan yang perlu diselesaikan hari ini.

#### Acceptance Criteria

1. THE Todo_Manager SHALL menampilkan kolom input teks untuk menambahkan tugas baru.
2. WHEN Pengguna memasukkan teks tugas yang tidak kosong dan tidak melebihi 200 karakter, dan menekan tombol tambah atau menekan Enter, THE Todo_Manager SHALL menambahkan tugas baru ke daftar.
3. IF Pengguna mencoba menambahkan tugas dengan input kosong atau hanya spasi, THEN THE Todo_Manager SHALL tidak menambahkan tugas dan tidak menampilkan pesan kesalahan.
4. WHEN Pengguna menandai sebuah Tugas sebagai selesai, THE Todo_Manager SHALL menampilkan Tugas tersebut dengan teks dicoret dan opacity yang berbeda dari tugas yang belum selesai.
5. WHEN Pengguna menandai sebuah Tugas yang telah selesai, THE Todo_Manager SHALL mengembalikan Tugas tersebut ke status belum selesai dan menghapus gaya visual tugas selesai.
6. WHEN Pengguna memilih opsi edit pada sebuah Tugas, THE Todo_Manager SHALL menampilkan field input yang sudah terisi dengan teks Tugas saat ini sehingga Pengguna dapat mengubahnya.
7. WHEN Pengguna menyimpan hasil edit Tugas dengan teks yang tidak kosong dan tidak hanya spasi, THE Todo_Manager SHALL memperbarui teks Tugas dengan nilai baru.
8. IF Pengguna menyimpan hasil edit Tugas dengan teks yang kosong atau hanya spasi, THEN THE Todo_Manager SHALL membatalkan perubahan dan mengembalikan teks Tugas ke nilai sebelumnya.
9. WHEN Pengguna menghapus sebuah Tugas, THE Todo_Manager SHALL menghilangkan Tugas tersebut dari daftar secara permanen.
10. WHEN terjadi perubahan apa pun pada daftar tugas, THE Storage SHALL menyimpan seluruh daftar tugas terbaru ke Local Storage.
11. WHEN Dashboard dimuat, THE Todo_Manager SHALL membaca seluruh tugas dari Storage dan menampilkannya; IF tidak ada tugas tersimpan, THEN THE Todo_Manager SHALL menampilkan daftar kosong tanpa pesan kesalahan.

---

### Requirement 6: Pengelolaan Quick Links

**User Story:** Sebagai pengguna, saya ingin menyimpan dan mengakses tautan ke situs favorit dengan satu klik, agar saya tidak perlu mengetik ulang URL setiap kali.

#### Acceptance Criteria

1. THE Link_Manager SHALL menampilkan semua Quick Link yang tersimpan sebagai tombol yang dapat diklik.
2. WHEN Pengguna mengklik sebuah tombol Quick Link, THE Link_Manager SHALL membuka URL yang terkait di tab baru browser.
3. THE Link_Manager SHALL menyediakan antarmuka untuk menambahkan Quick Link baru dengan nama tampilan maksimal 50 karakter dan URL maksimal 2048 karakter.
4. WHEN Pengguna memasukkan nama dan URL yang valid lalu mengonfirmasi, THE Storage SHALL menyimpan Quick Link baru ke Local Storage.
5. IF Pengguna memasukkan URL yang tidak mengandung format valid (tidak diawali dengan "http://" atau "https://"), THEN THE Link_Manager SHALL menampilkan pesan kesalahan yang mengindikasikan format URL tidak valid dan tidak menyimpan entri tersebut.
6. IF Pengguna memasukkan nama tampilan yang kosong atau hanya mengandung spasi, atau URL yang kosong, THEN THE Link_Manager SHALL menampilkan pesan kesalahan yang mengindikasikan kolom wajib tidak terisi dan tidak menyimpan entri tersebut.
7. THE Link_Manager SHALL menyediakan tombol hapus pada setiap Quick Link yang meminta konfirmasi pengguna sebelum menghapus entri tersebut.
8. WHEN Pengguna menghapus sebuah Quick Link, THE Storage SHALL memperbarui daftar Quick Link di Local Storage.
9. WHEN Dashboard dimuat, THE Link_Manager SHALL membaca dan menampilkan seluruh Quick Link yang tersimpan di Storage dalam urutan penambahan dari yang paling lama ke yang paling baru.
10. IF Pengguna mencoba menambahkan Quick Link baru saat jumlah Quick Link yang tersimpan telah mencapai 20 entri, THEN THE Link_Manager SHALL menampilkan pesan kesalahan yang mengindikasikan batas maksimum telah tercapai dan tidak menyimpan entri tersebut.

---

### Requirement 7: Mode Terang dan Gelap (Light/Dark Mode)

**User Story:** Sebagai pengguna, saya ingin beralih antara tema terang dan gelap, agar dashboard terasa nyaman digunakan dalam berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE Dashboard SHALL menyediakan toggle yang terlihat dan dapat dioperasikan di setiap halaman untuk beralih antara Tema terang dan gelap.
2. WHEN Pengguna mengaktifkan Tema gelap, THE Dashboard SHALL menerapkan skema warna gelap pada seluruh komponen sehingga tidak ada komponen yang tetap menampilkan skema warna terang.
3. WHEN Pengguna mengaktifkan Tema terang, THE Dashboard SHALL menerapkan skema warna terang pada seluruh komponen sehingga tidak ada komponen yang tetap menampilkan skema warna gelap.
4. WHEN Pengguna mengubah Tema, THE Storage SHALL menyimpan preferensi Tema tersebut ke Local Storage sebelum transisi visual selesai.
5. WHEN Dashboard dimuat, THE Dashboard SHALL membaca preferensi Tema dari Storage dan menerapkannya sebelum elemen konten pertama dirender, untuk menghindari kilatan warna yang salah (flash of wrong theme).
6. IF penulisan preferensi Tema ke Local Storage gagal, THEN THE Dashboard SHALL tetap menerapkan Tema yang dipilih untuk sesi saat ini tanpa menampilkan pesan error kepada pengguna.

---

### Requirement 8: Persistensi Data dan Pemuatan Ulang

**User Story:** Sebagai pengguna, saya ingin data saya tetap ada setelah saya menutup dan membuka kembali browser, agar saya tidak perlu mengisi ulang informasi setiap hari.

#### Acceptance Criteria

1. WHEN Dashboard dimuat untuk pertama kalinya tanpa data di Storage, THE Dashboard SHALL menampilkan antarmuka dengan state default: daftar tugas kosong, daftar quick links kosong, nama pengguna belum diisi, Tema terang aktif, dan Focus_Timer pada durasi default 25 menit.
2. WHEN Dashboard dimuat setelah data sebelumnya tersimpan di Storage, THE Dashboard SHALL memulihkan seluruh data (tugas, quick links, nama pengguna, preferensi tema, dan durasi timer) sehingga tampilannya identik dengan kondisi terakhir sebelum browser ditutup.
3. IF data dari Storage tidak dapat dibaca atau rusak untuk komponen tertentu, THEN THE Dashboard SHALL menampilkan state default untuk komponen tersebut tanpa menampilkan pesan error kepada pengguna.
4. THE Dashboard SHALL memastikan bahwa apabila browser ditutup segera setelah aksi pengguna yang memodifikasi data, data tersebut tetap tersimpan dan dapat dipulihkan pada sesi berikutnya.

---

### Requirement 9: Kompatibilitas dan Performa Browser

**User Story:** Sebagai pengguna, saya ingin dashboard berfungsi lancar di browser yang saya gunakan sehari-hari, agar saya tidak perlu mengganti browser.

#### Acceptance Criteria

1. THE Dashboard SHALL berfungsi tanpa error JavaScript yang tidak tertangani pada versi rilis terbaru browser Chrome, Firefox, Edge, dan Safari, dengan semua fitur (Greeting Widget, Focus Timer, To-Do List, Quick Links, Light/Dark Mode) dapat digunakan sepenuhnya.
2. THE Dashboard SHALL menampilkan layout tanpa elemen yang tumpang tindih, terpotong, atau tersembunyi pada lebar layar minimum 320 piksel hingga 2560 piksel.
3. THE Dashboard SHALL memuat seluruh aset (HTML, CSS, JavaScript) dan menampilkan konten yang siap digunakan dalam waktu kurang dari 3 detik pada koneksi dengan bandwidth minimal 10 Mbps dan latensi maksimal 50 ms.
4. THE Dashboard SHALL memperbarui elemen UI (seperti jam dan countdown timer) tanpa menyebabkan pergeseran posisi elemen lain di halaman.
