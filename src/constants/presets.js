export const themes = {
  romantic: 'Romantic Pink',
  luxury_gold: 'Luxury Dark & Gold',
  botanical: 'Botanical Sage Green',
  minimalist: 'Minimalist Clean',
  playful: 'Playful Pastel',
}

export const fonts = [
  'DM Sans',
  'Playfair Display',
  'Cinzel',
  'Inter',
  'Roboto',
  'Outfit',
  'Lora',
  'Poppins',
  'Montserrat'
]

export function fontUrl(f) {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:ital,wght@0,300..800;1,300..800&display=swap`
}

export const themeStylesMap = {
  minimalist: {
    heroGradient: 'linear-gradient(180deg, #fafafa, #f0f0f0)',
    borderColor: '#e5e7eb',
    textColor: '#1f2937',
    textMuted: '#6b7280',
    cardBg: '#ffffff',
    isDark: false
  },
  playful: {
    heroGradient: 'linear-gradient(135deg, #fff0f5, #f0f0ff, #f0fff0)',
    borderColor: '#e8d0e8',
    textColor: '#372535',
    textMuted: '#7c5874',
    cardBg: '#ffffff',
    isDark: false
  },
  luxury_gold: {
    heroGradient: 'radial-gradient(ellipse at 50% 15%, #182337 0%, #090e17 80%)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
    textColor: '#f8fafc',
    textMuted: '#94a3b8',
    cardBg: '#0f172a',
    isDark: true
  },
  botanical: {
    heroGradient: 'radial-gradient(circle at 30% 15%, #edf4ee, #d8e5d9 85%)',
    borderColor: 'rgba(120, 155, 126, 0.4)',
    textColor: '#1c2c20',
    textMuted: '#4a634f',
    cardBg: '#fbfdfb',
    isDark: false
  },
  romantic: {
    heroGradient: 'radial-gradient(circle at 20% 5%,rgba(255,255,255,.7),transparent 35%),linear-gradient(140deg,rgba(255,249,250,.75),rgba(247,220,229,.6))',
    borderColor: 'rgba(240,229,232,0.5)',
    textColor: '#33242a',
    textMuted: '#69545d',
    cardBg: '#fffaf9',
    isDark: false
  }
}

export const presets = {
  invitation: {
    title: 'Naya & Arga — Wedding Day',
    meta: {
      primary_color: '#a85270',
      theme_id: 'romantic',
      font_family: 'DM Sans',
      bg_color: '#fffaf9',
      particles: 'love',
      particle_speed: 'normal',
      particle_density: 'medium',
    },
    hero: {
      style: 'classic',
      monogram: '',
      kicker: 'THE WEDDING OF',
      title: 'Naya & Arga',
      subtitle: 'Dengan penuh cinta, kami mengundangmu untuk merayakan hari bahagia kami.',
      cta: 'Simpan tanggalnya'
    },
    event: { label: 'Save the date', venue: 'The Glasshouse', address: 'Jl. Kemang Raya No. 8, Jakarta Selatan' },
    countdown: { label: 'Menuju hari bahagia' },
    story: {
      title: 'Cerita kami',
      mode: 'timeline',
      body: 'Dua perjalanan yang akhirnya bertemu. Dari obrolan sederhana, tumbuh keyakinan untuk berjalan bersama, hari ini dan seterusnya.',
      items: [
        { year: '2021', title: 'Pertama Kali Bertemu', desc: 'Sebuah perjumpaan sederhana di kedai kopi yang berlanjut menjadi obrolan hangat.' },
        { year: '2024', title: 'Komitmen Bersama', desc: 'Menyadari bahwa setiap impian terasa lebih indah saat kita perjuangkan berdua.' },
        { year: '2026', title: 'Menuju Pelaminan', desc: 'Dengan restu keluarga dan doa tulus, kami siap memulai lembaran baru.' },
      ]
    },
    gallery: { title: 'Potongan momen' },
    rsvp: { title: 'Konfirmasi kehadiran', note: 'Mohon isi sebelum 10 Desember 2026.' },
    gift: { title: 'Kado & doa', note: 'Kehadiran dan doa baikmu sudah sangat berarti.', bank: 'BCA 1234567890', holder: 'Naya Putri' },
    faq: { title: 'Yang perlu kamu tahu', dress: 'Semi formal · warna earth tone', items: [{ q: 'Boleh membawa anak?', a: 'Tentu, kami senang merayakan bersama keluarga.' }] },
    map: { title: 'Temukan kami', url: 'https://maps.google.com', label: 'Buka Google Maps' },
  },
  ramadhan: {
    title: 'Keluarga Pratama — Selamat Hari Raya Idul Fitri 1447 H',
    meta: {
      primary_color: '#1b5e3c',
      theme_id: 'botanical',
      font_family: 'Playfair Display',
      bg_color: '#f2f8f4',
      particles: 'stars',
      particle_speed: 'slow',
      particle_density: 'medium',
    },
    hero: {
      style: 'monogram',
      monogram: 'EID',
      kicker: 'TAQABBALALLAHU MINNA WA MINKUM',
      title: 'Selamat Idul Fitri 1447 H',
      subtitle: 'Dengan penuh ketulusan, kami sekeluarga memohon maaf lahir dan batin. Semoga hari kemenangan ini membawa kedamaian, keberkahan, dan kebahagiaan bagi kita semua.',
      cta: 'Buka Kartu & Doa'
    },
    event: { label: 'Silaturahmi & Open House', date: '2026-03-20T09:00', venue: 'Kediaman Keluarga Pratama', address: 'Jl. Melati Indah No. 18, Jakarta Selatan' },
    countdown: { label: 'Menuju Hari Kemenangan' },
    story: {
      title: 'Untaian Doa & Syukur',
      mode: 'text',
      body: 'Sebulan penuh berkah telah membimbing hati kita menuju keheningan dan keikhlasan. Di hari yang fitri ini, jarak bukan halangan untuk merekatkan kembali silaturahmi dan saling memaafkan dengan tulus.',
      items: [
        { year: '1 Syawal', title: 'Shalat Id & Sungkeman', desc: 'Memulai hari kemenangan dengan sujud bersama dan saling memohon maaf dengan keluarga.' },
        { year: 'Siang Hari', title: 'Jamuan Silaturahmi', desc: 'Menikmati hidangan khas lebaran dan kehangatan temu kangen kerabat.' },
      ]
    },
    gallery: { title: 'Momen Hangat Silaturahmi' },
    rsvp: { title: 'Rencana Kunjungan Silaturahmi', note: 'Kabar kehadiranmu sangat kami nanti agar jamuan dapat kami persiapkan dengan baik.' },
    gift: { title: 'Tanda Kasih & THR Online', note: 'Kehadiran dan doa tulus adalah hadiah terbaik. Bagi yang ingin berbagi tanda kasih dapat melalui:', bank: 'BCA 8890123456', holder: 'Ahmad Pratama' },
    faq: {
      title: 'Info Kunjungan & Busana',
      dress: 'Busana Muslim / Nuansa Sage & Putih',
      items: [
        { q: 'Apakah ada pembagian sesi jam kunjungan?', a: 'Sesi pagi pukul 09.00 - 13.00 WIB, dan sesi sore pukul 15.30 - 20.00 WIB.' },
        { q: 'Apakah area parkir mencukupi?', a: 'Tersedia area parkir di halaman rumah dan lapangan sekitar kompleks.' }
      ]
    },
    map: { title: 'Lokasi Kediaman', url: 'https://maps.google.com', label: 'Buka Google Maps' },
  },
  birthday: {
    title: "Alya's Sweet 17th Birthday Celebration",
    meta: {
      primary_color: '#d946ef',
      theme_id: 'playful',
      font_family: 'Outfit',
      bg_color: '#fdf2f8',
      particles: 'confetti',
      particle_speed: 'normal',
      particle_density: 'high',
    },
    hero: {
      style: 'split',
      monogram: 'A17',
      kicker: 'SWEET SEVENTEEN CELEBRATION',
      title: "Alya's 17th Birthday",
      subtitle: 'Satu dekade lebih tujuh tahun penuh kenangan manis! Mari berkumpul, bersenang-senang, dan rayakan malam spesial ini bersama!',
      cta: 'Lihat Jadwal Pesta'
    },
    event: { label: 'The Grand Party', date: '2026-11-20T18:30', venue: 'Sky Terrace Lounge', address: 'Rooftop Grand Melia Hotel, Jakarta' },
    countdown: { label: 'Countdown to Party Time' },
    story: {
      title: 'Milestones of 17 Years',
      mode: 'timeline',
      body: '17 tahun penuh warna, tawa, dan mimpi baru. Terima kasih telah menjadi bagian dari perjalananku!',
      items: [
        { year: '2009', title: 'Chapter Begins', desc: 'Lahir ke dunia membawa keceriaan dan tawa baru bagi keluarga tercinta.' },
        { year: '2021', title: 'Growing Up & Friends', desc: 'Masa-masa penuh keseruan, persahabatan sejati, dan kenangan indah masa sekolah.' },
        { year: '2026', title: 'Sweet 17 Milestone', desc: 'Melangkah ke fase baru dengan rasa syukur dan mimpi-mimpi yang semakin luas.' },
      ]
    },
    gallery: { title: 'Photo Highlights' },
    rsvp: { title: 'Are You Coming?', note: 'Konfirmasi kehadiranmu sebelum 10 November 2026 ya!' },
    gift: { title: 'Birthday Gift / Angpao', note: 'Kehadiranmu adalah kado terindah. Jika ingin memberikan tanda mata digital:', bank: 'Bank Mandiri 123-00-9876543-1', holder: 'Alya Ramadhani' },
    faq: {
      title: 'Party Rules & Dress Code',
      dress: 'Chic Casual / Glam Touch',
      items: [
        { q: 'Apakah ada dress code khusus?', a: 'Dress code bebas rapi bertema monokrom atau sentuhan warna pastel ceria.' },
        { q: 'Bolehkah mengajak teman plus one?', a: 'Tentu boleh, mohon cantumkan jumlah kehadiran pada formulir RSVP.' }
      ]
    },
    map: { title: 'Party Location', url: 'https://maps.google.com', label: 'Petunjuk Arah Google Maps' },
  },
  greeting: {
    title: 'A little note for you',
    meta: {
      primary_color: '#4f46e5',
      theme_id: 'minimalist',
      font_family: 'Lora',
      bg_color: '#f8fafc',
      particles: 'stars',
      particle_speed: 'slow',
      particle_density: 'low',
    },
    hero: {
      style: 'minimal',
      monogram: 'NOTE',
      kicker: 'A LITTLE NOTE',
      title: 'Untuk Kamu',
      subtitle: 'Karena beberapa hal lebih indah disampaikan lewat kata-kata dan ketulusan.',
      cta: 'Baca pesan'
    },
    event: { label: 'Kapan?', venue: '', address: '' },
    countdown: { label: 'Hari spesial' },
    story: { title: 'Dari hati', mode: 'text', body: 'Setiap detik bersamamu adalah cerita yang tak ingin kuakhiri. Terima kasih telah selalu ada di setiap musim hidupku.', items: [] },
    gallery: { title: 'Momen kita' },
    rsvp: { title: 'Beri respons', note: 'Klik tombol di bawah untuk merespons.' },
    gift: { title: 'Kirim hadiah', note: 'Tidak wajib, tapi kalau mau…', bank: '', holder: '' },
    faq: { title: 'Info tambahan', dress: '', items: [{ q: 'Apa ini?', a: 'Kartu ucapan digital yang dibuat khusus untukmu.' }] },
    map: { title: 'Kita ketemu di sini', url: '', label: 'Lihat lokasi' },
  },
  landing: {
    title: 'Studio Kecil Kita',
    meta: {
      primary_color: '#0284c7',
      theme_id: 'minimalist',
      font_family: 'Inter',
      bg_color: '#f0fdf4',
      particles: 'none',
      particle_speed: 'normal',
      particle_density: 'medium',
    },
    hero: {
      style: 'split',
      monogram: 'SKK',
      kicker: 'WELCOME TO OUR STUDIO',
      title: 'Hal baik dimulai di sini',
      subtitle: 'Selamat datang di ruang kreasi kami. Tempat ide bertumbuh menjadi karya bermakna.',
      cta: 'Mulai jelajah'
    },
    event: { label: 'Event terdekat', venue: '', address: '' },
    countdown: { label: 'Coming soon' },
    story: { title: 'Siapa kami', mode: 'text', body: 'Kami percaya kreativitas bisa mengubah dunia. Satu langkah kecil pada satu waktu bersama orang-orang hebat.', items: [] },
    gallery: { title: 'Portfolio' },
    rsvp: { title: 'Hubungi kami', note: 'Kirim pesan langsung dari sini.' },
    gift: { title: 'Support kami', note: 'Dukung karya kami.', bank: '', holder: '' },
    faq: { title: 'FAQ', dress: '', items: [{ q: 'Bagaimana cara kerja sama?', a: 'Hubungi kami melalui formulir di atas!' }] },
    map: { title: 'Lokasi kami', url: '', label: 'Buka peta' },
  },
}

export function getDefaultBase() {
  return {
    id: 'primary_project',
    meta: {
      title: 'Naya & Arga — Wedding Day',
      primary_color: '#a85270',
      font_family: 'DM Sans',
      theme_id: 'romantic',
      preset: 'invitation',
      bg_color: '#fffaf9',
      bg_image: null,
      bg_image_name: '',
      bg_blur: 0,
      particles: 'none',
      particle_speed: 'normal',
      particle_density: 'medium',
      enable_cover: true,
      cover_kicker: 'THE WEDDING OF',
      cover_subtitle: 'Spesial Mengundang Bapak/Ibu/Saudara/i:',
      simulated_guest: 'Budi Santoso & Partner',
    },
    music: { file_blob: null, file_name: '' },
    gallery: [],
    sections: {
      hero: {
        on: true,
        style: 'classic',
        monogram: '',
        kicker: 'THE WEDDING OF',
        title: 'Naya & Arga',
        subtitle: 'Dengan penuh cinta, kami mengundangmu untuk merayakan hari bahagia kami.',
        cta: 'Simpan tanggalnya'
      },
      event: { on: true, label: 'Save the date', date: '2026-12-20T10:00', venue: 'The Glasshouse', address: 'Jl. Kemang Raya No. 8, Jakarta Selatan', enable_calendar: true },
      countdown: { on: true, label: 'Menuju hari bahagia' },
      story: {
        on: true,
        title: 'Cerita kami',
        mode: 'text',
        body: 'Dua perjalanan yang akhirnya bertemu. Dari obrolan sederhana, tumbuh keyakinan untuk berjalan bersama, hari ini dan seterusnya.',
        items: [
          { year: '2021', title: 'Pertama Kali Bertemu', desc: 'Sebuah perjumpaan sederhana yang membuka jalan untuk obrolan panjang penuh tawa.' },
          { year: '2024', title: 'Komitmen Bersama', desc: 'Menyadari bahwa setiap langkah hidup terasa lebih utuh dan bermakna saat dijalani berdua.' },
          { year: '2026', title: 'Menuju Pelaminan', desc: 'Dengan restu orang tua dan doa tulus, kami melangkah menuju hari bahagia.' },
        ]
      },
      gallery: { on: true, title: 'Potongan momen' },
      rsvp: { on: true, title: 'Konfirmasi kehadiran', note: 'Mohon isi sebelum 10 Desember 2026.', wa_number: '6281234567890', enable_wa: true },
      guestbook: {
        on: true,
        title: 'Buku Tamu & Doa Restu',
        note: 'Tinggalkan doa dan harapan terbaikmu untuk kedua mempelai.',
        items: [
          { name: 'Rina & Dimas', message: 'Selamat atas hari bahagia kalian! Semoga langgeng dan selalu dilimpahi keberkahan.', date: 'Baru saja' },
          { name: 'Budi Santoso', message: 'Selamat ya! Sangat bahagia melihat perjalanan indah kalian berdua.', date: 'Hari ini' }
        ]
      },
      gift: { on: true, title: 'Kado & doa', note: 'Kehadiran dan doa baikmu sudah sangat berarti.', bank: 'BCA 1234567890', holder: 'Naya Putri', qris_image: null, qris_image_name: '' },
      faq: { on: true, title: 'Yang perlu kamu tahu', dress: 'Semi formal · warna earth tone', items: [{ q: 'Boleh membawa anak?', a: 'Tentu, kami senang merayakan bersama keluarga.' }] },
      map: { on: true, title: 'Temukan kami', url: 'https://maps.google.com', label: 'Buka Google Maps' },
    }
  }
}
