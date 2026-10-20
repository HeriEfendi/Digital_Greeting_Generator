# Roadmap & Checklist Pengembangan Digital Greeting Generator

Dokumen ini memuat seluruh rekomendasi fitur tambahan, variasi tampilan, dan penyempurnaan sistem. Kamu bisa memilih fitur mana yang ingin dieksekusi terlebih dahulu. Setiap fitur yang selesai dikerjakan akan dicentang (`- [x]`) agar progres terpantau dengan jelas.

---

## 🎨 1. Variasi Tampilan & Desain (Visual Richness)

| Status | ID | Fitur | Deskripsi & Manfaat | Estimasi Dampak |
| :---: | :---: | :--- | :--- | :---: |
| - [ ] | **DES-01** | **Tema Luxury Dark & Gold** | Tema latar gelap (deep emerald/navy) dengan aksen gradien emas (`#d4af37`), font serif elegan, dan border mewah. Cocok untuk acara formal/undangan malam. | ⭐⭐⭐⭐⭐ |
| - [ ] | **DES-02** | **Tema Botanical Sage Green** | Palet warna hijau sage, earth tone, ornamen bernuansa dedaunan & alam lembut. Sangat populer untuk tema pernikahan modern/outdoor. | ⭐⭐⭐⭐ |
| - [ ] | **DES-03** | **Preset Festive & Idul Fitri / Ramadhan** | Preset khusus kartu ucapan hari raya dengan ornamen ketupat/lentera, partikel bintang/bulan, dan ucapan khas. | ⭐⭐⭐⭐ |
| - [ ] | **DES-04** | **Preset Ulang Tahun / Milestones** | Preset kartu ucapan ulang tahun / graduation dengan animasi confetti ceria dan balon. | ⭐⭐⭐ |
| - [ ] | **DES-05** | **Variasi Layout Hero (Cover Style)** | Pilihan style tampilan Hero: Monogram (inisial besar di tengah), Full Background Image, atau Split Layout (foto kiri, teks kanan). | ⭐⭐⭐⭐ |
| - [ ] | **DES-06** | **Timeline Interaktif di Section Story** | Mengubah teks cerita biasa menjadi garis waktu (milestone timeline vertikal) yang menceritakan perjalanan dari tahun ke tahun. | ⭐⭐⭐⭐ |

---

## 🚀 2. Fitur Interaktif & Fungsional Baru (High-Impact Features)

| Status | ID | Fitur | Deskripsi & Manfaat | Estimasi Dampak |
| :---: | :---: | :--- | :--- | :---: |
| - [ ] | **FTR-01** | **Cover "Buka Undangan" (Amplop Digital)** | Layar sambutan dengan nama tamu + tombol "Buka Undangan". Mengaktifkan musik otomatis (bypass autoplay blocker browser) dan membuka scroll dengan transisi mulus. | ⭐⭐⭐⭐⭐ |
| - [ ] | **FTR-02** | **Personalized URL Parameter (`?to=Nama+Tamu`)** | Halaman bisa membaca parameter `?to=Nama` di URL, menampilkan sapaan khusus, plus generator link share WhatsApp di editor. | ⭐⭐⭐⭐⭐ |
| - [ ] | **FTR-03** | **Tombol "Salin No. Rekening" & Upload QRIS** | Tombol 1-klik untuk menyalin rekening di section Gift dengan toast notifikasi, serta opsi unggah gambar QRIS (GoPay/OVO/BCA). | ⭐⭐⭐⭐⭐ |
| - [ ] | **FTR-04** | **Tombol "Add to Google Calendar"** | Tombol di section Event yang otomatis membuka link Google Calendar dengan tanggal, lokasi, dan judul yang sudah terisi. | ⭐⭐⭐⭐ |
| - [ ] | **FTR-05** | **Konfirmasi RSVP via WhatsApp** | Form RSVP menyediakan opsi mengirim data kehadiran langsung ke nomor WhatsApp pemilik acara dengan format chat otomatis. | ⭐⭐⭐⭐ |
| - [ ] | **FTR-06** | **Lightbox Galeri Foto Layar Penuh** | Ketika foto galeri diklik (baik di preview maupun di web hasil ekspor), muncul modal pop-up foto layar penuh dengan tombol next/prev. | ⭐⭐⭐⭐ |
| - [ ] | **FTR-07** | **Buku Ucapan & Doa Interaktif (Guestbook)** | Fitur komentar ucapan sederhana di website yang menyimpan doa/ucapan tamu (bisa via local storage atau integrasi form). | ⭐⭐⭐ |

---

## 🖥️ 3. Pengalaman Studio & Editor (UI/UX Studio)

| Status | ID | Fitur | Deskripsi & Manfaat | Estimasi Dampak |
| :---: | :---: | :--- | :--- | :---: |
| - [ ] | **STU-01** | **Device Viewport Switcher (Mobile/Tablet/Desktop)** | Tombol di atas preview untuk beralih mode tampilan: Layar HP (375px/iPhone), Tablet (768px), dan Layar Penuh (Desktop). | ⭐⭐⭐⭐⭐ |
| - [ ] | **STU-02** | **Multi-Draft / Project Manager (Dexie)** | Pengguna bisa menyimpan banyak undangan/kartu ucapan berbeda di browser, mengganti nama draft, membuat baru, atau menghapus draft. | ⭐⭐⭐⭐ |
| - [ ] | **STU-03** | **Live Preview Tanpa Menutup Modal** | Opsi preview langsung saat mengetik di modal tanpa harus klik "Selesai" untuk melihat perubahan. | ⭐⭐⭐ |
| - [ ] | **STU-04** | **Fitur Reset / Duplikat Section** | Tombol cepat untuk mengembalikan isi section ke teks default preset atau menduplikasi elemen. | ⭐⭐⭐ |

---

## ⚙️ 4. Kualitas Ekspor & Kerapian Kode (Code & Export Quality)

| Status | ID | Fitur | Deskripsi & Manfaat | Estimasi Dampak |
| :---: | :---: | :--- | :--- | :---: |
| - [ ] | **DEV-01** | **Penyelarasan Desain CSS Ekspor ZIP** | Menyamakan kualitas CSS hasil ekspor ZIP (glassmorphism, transisi halus, shadow, typography) agar sama mewahnya dengan preview di editor. | ⭐⭐⭐⭐⭐ |
| - [ ] | **DEV-02** | **Modularisasi Kode App.vue** | Memecah `App.vue` (~900 baris) menjadi komponen-komponen terpisah yang bersih: Sidebar, ModalForm, PreviewCanvas, dan Service Exporter. | ⭐⭐⭐⭐ |
| - [ ] | **DEV-03** | **Animasi Muncul Saat Scroll (AOS/Scroll Reveal)** | Menambahkan efek elemen muncul perlahan saat halaman digulir ke bawah pada website hasil ekspor. | ⭐⭐⭐⭐ |

---

## 📌 Catatan Cara Penggunaan:
1. Pilih ID fitur yang ingin kamu jalankan (misalnya: **"Tolong kerjakan FTR-01 dan STU-01 dulu"**).
2. Saya akan langsung mengimplementasikannya ke dalam kodingan dan mengujinya.
3. Setelah selesai dan berfungsi dengan baik, status `- [ ]` di dokumen ini akan langsung diperbarui menjadi `- [x]`.
