<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, toRaw, watch, nextTick } from 'vue'
import Dexie from 'dexie'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { CalendarDays, ChevronDown, ChevronUp, Download, Gift, ImagePlus, MapPin, Music2, Plus, Trash2, Sparkles, Upload, Play, Pause, X, Settings2, Layers, ArrowUp } from 'lucide-vue-next'

const db = new Dexie('GreetingGeneratorDB')
db.version(2).stores({ projects: 'id' })

// Must be reactive so reorder triggers re-render
const sections = reactive([
  ['hero', 'Cover & CTA'],
  ['event', 'Detail acara'],
  ['countdown', 'Countdown'],
  ['story', 'Cerita'],
  ['gallery', 'Galeri'],
  ['rsvp', 'RSVP'],
  ['gift', 'Gift'],
  ['faq', 'FAQ & dress code'],
  ['map', 'Lokasi'],
])

const base = () => ({
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
    event: { on: true, label: 'Save the date', date: '2026-12-20T10:00', venue: 'The Glasshouse', address: 'Jl. Kemang Raya No. 8, Jakarta Selatan' },
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
    rsvp: { on: true, title: 'Konfirmasi kehadiran', note: 'Mohon isi sebelum 10 Desember 2026.' },
    gift: { on: true, title: 'Kado & doa', note: 'Kehadiran dan doa baikmu sudah sangat berarti.', bank: 'BCA 1234567890', holder: 'Naya Putri' },
    faq: { on: true, title: 'Yang perlu kamu tahu', dress: 'Semi formal · warna earth tone', items: [{ q: 'Boleh membawa anak?', a: 'Tentu, kami senang merayakan bersama keluarga.' }] },
    map: { on: true, title: 'Temukan kami', url: 'https://maps.google.com', label: 'Buka Google Maps' },
  }
})

const state = reactive(base())
const ready = ref(false)
const status = ref('Memuat studio…')
const exporting = ref(false)
const open = ref('')
const urls = ref({})
const musicUrl = ref('')
const bgImageUrl = ref('')
const musicPlaying = ref(false)
const audioEl = ref(null)
const showScrollTop = ref(false)

function onWindowScroll() {
  showScrollTop.value = window.scrollY > 200
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})

// ===== Live countdown =====
const countdownDisplay = ref([['Hari', 0], ['Jam', 0], ['Menit', 0], ['Detik', 0]])
let countdownTimer = null

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer)
  const tick = () => {
    const target = new Date(state.sections.event.date).getTime()
    // An empty or malformed date is a valid intermediate form value. Keep the
    // preview usable while the user edits it instead of rendering NaN values.
    const d = Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0
    countdownDisplay.value = [
      ['Hari', Math.floor(d / 864e5)],
      ['Jam', Math.floor(d / 36e5) % 24],
      ['Menit', Math.floor(d / 6e4) % 60],
      ['Detik', Math.floor(d / 1e3) % 60],
    ]
  }
  tick()
  countdownTimer = setInterval(tick, 1000)
}

onUnmounted(() => { if (countdownTimer) clearInterval(countdownTimer) })

// ===== Music preview =====
function toggleMusic() {
  const audio = audioEl.value
  if (!audio || !musicUrl.value) return
  if (audio.paused) {
    audio.play()
    musicPlaying.value = true
  } else {
    audio.pause()
    musicPlaying.value = false
  }
}

// ===== Particle system =====
const particleCanvas = ref(null)
let particleAnimId = null
let particles = []
let resizeObserver = null

const particleCfg = computed(() => {
  const densityMap = { low: 25, medium: 50, high: 100 }
  const speedMap = { slow: 0.3, normal: 1, fast: 2.5 }
  return {
    count: densityMap[state.meta.particle_density] || 50,
    speed: speedMap[state.meta.particle_speed] || 1,
    type: state.meta.particles,
  }
})

function initParticles() {
  if (particleAnimId) { cancelAnimationFrame(particleAnimId); particleAnimId = null }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  particles = []
  const canvas = particleCanvas.value
  if (!canvas || state.meta.particles === 'none') return

  const ctx = canvas.getContext('2d')

  function resize() {
    // Use parent dimensions since canvas might be 0
    const parent = canvas.parentElement
    if (!parent) return
    canvas.width = parent.offsetWidth
    canvas.height = parent.offsetHeight
  }
  resize()

  // Watch for size changes
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.parentElement)

  // Don't start if canvas has no size yet
  if (canvas.width === 0 || canvas.height === 0) return

  const cfg = particleCfg.value
  for (let i = 0; i < cfg.count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * cfg.speed,
      speedY: Math.random() * cfg.speed + 0.3,
      opacity: Math.random() * 0.7 + 0.3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2,
    })
  }

  function drawSnow(ctx, p) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${p.opacity})`
    ctx.fill()
  }

  function drawHeart(ctx, p) {
    const s = p.size * 1.5
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.3)
    ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.4, 0, s * 0.6)
    ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s, 0, -s * 0.3)
    ctx.fillStyle = `rgba(220,60,100,${p.opacity})`
    ctx.fill()
    ctx.restore()
  }

  function drawConfetti(ctx, p) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff78ae', '#a855f7']
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.fillStyle = colors[Math.floor(p.opacity * colors.length) % colors.length]
    ctx.globalAlpha = p.opacity
    ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8)
    ctx.restore()
  }

  function drawStar(ctx, p) {
    const s = p.size
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const method = i === 0 ? 'moveTo' : 'lineTo'
      ctx[method](Math.cos(angle) * s, Math.sin(angle) * s)
    }
    ctx.closePath()
    ctx.fillStyle = `rgba(255,215,0,${p.opacity})`
    ctx.fill()
    ctx.restore()
  }

  const drawFns = { snow: drawSnow, love: drawHeart, confetti: drawConfetti, stars: drawStar }
  const drawFn = drawFns[cfg.type] || drawSnow

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.x += p.speedX
      p.y += p.speedY
      p.rotation += p.rotSpeed
      if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width }
      if (p.x > canvas.width + 10) p.x = -10
      if (p.x < -10) p.x = canvas.width + 10
      drawFn(ctx, p)
    }
    particleAnimId = requestAnimationFrame(animate)
  }
  animate()
}

onUnmounted(() => {
  if (particleAnimId) cancelAnimationFrame(particleAnimId)
  if (resizeObserver) resizeObserver.disconnect()
})

watch(() => [state.meta.particles, state.meta.particle_speed, state.meta.particle_density], () => {
  nextTick(initParticles)
})

// ===== Themes & presets =====
const themes = {
  romantic: 'Romantic Pink',
  luxury_gold: 'Luxury Dark & Gold',
  botanical: 'Botanical Sage Green',
  minimalist: 'Minimalist Clean',
  playful: 'Playful Pastel',
}

const fonts = ['DM Sans', 'Playfair Display', 'Cinzel', 'Inter', 'Roboto', 'Outfit', 'Lora', 'Poppins', 'Montserrat']

const monogramInitials = computed(() => {
  const t = (state.sections.hero.title || '').trim()
  if (!t) return 'NA'
  if (t.includes('&')) {
    const parts = t.split('&')
    return (parts[0].trim().charAt(0) + ' & ' + parts[1].trim().charAt(0)).toUpperCase()
  }
  if (t.includes('—')) {
    const parts = t.split('—')
    return parts[0].trim().substring(0, 2).toUpperCase()
  }
  const words = t.split(/\s+/)
  if (words.length >= 2) {
    return (words[0].charAt(0) + ' & ' + words[1].charAt(0)).toUpperCase()
  }
  return t.substring(0, 2).toUpperCase()
})

const presets = {
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

// Theme-specific preview styles
const themeStyles = computed(() => {
  const t = state.meta.theme_id
  if (t === 'minimalist') {
    return {
      heroGradient: 'linear-gradient(180deg, #fafafa, #f0f0f0)',
      borderColor: '#e5e7eb',
      textColor: '#1f2937',
      textMuted: '#6b7280',
      cardBg: '#ffffff',
      isDark: false
    }
  }
  if (t === 'playful') {
    return {
      heroGradient: 'linear-gradient(135deg, #fff0f5, #f0f0ff, #f0fff0)',
      borderColor: '#e8d0e8',
      textColor: '#372535',
      textMuted: '#7c5874',
      cardBg: '#ffffff',
      isDark: false
    }
  }
  if (t === 'luxury_gold') {
    return {
      heroGradient: 'radial-gradient(ellipse at 50% 15%, #182337 0%, #090e17 80%)',
      borderColor: 'rgba(212, 175, 55, 0.35)',
      textColor: '#f8fafc',
      textMuted: '#94a3b8',
      cardBg: '#0f172a',
      isDark: true
    }
  }
  if (t === 'botanical') {
    return {
      heroGradient: 'radial-gradient(circle at 30% 15%, #edf4ee, #d8e5d9 85%)',
      borderColor: 'rgba(120, 155, 126, 0.4)',
      textColor: '#1c2c20',
      textMuted: '#4a634f',
      cardBg: '#fbfdfb',
      isDark: false
    }
  }
  // romantic (default)
  return {
    heroGradient: 'radial-gradient(circle at 20% 5%,rgba(255,255,255,.7),transparent 35%),linear-gradient(140deg,rgba(255,249,250,.75),rgba(247,220,229,.6))',
    borderColor: 'rgba(240,229,232,0.5)',
    textColor: '#33242a',
    textMuted: '#69545d',
    cardBg: '#fffaf9',
    isDark: false
  }
})

const cardStyle = computed(() => ({
  '--accent': state.meta.primary_color,
  '--font': state.meta.font_family,
  '--bg-color': state.meta.bg_color,
  '--hero-gradient': themeStyles.value.heroGradient,
  '--border-color': themeStyles.value.borderColor,
  '--card-bg': themeStyles.value.cardBg,
  '--text-main': themeStyles.value.textColor,
  '--text-muted': themeStyles.value.textMuted,
  fontFamily: `'${state.meta.font_family}', sans-serif`,
}))

function onThemeChange() {
  const t = state.meta.theme_id
  if (t === 'luxury_gold') {
    state.meta.primary_color = '#d4af37'
    state.meta.bg_color = '#0b0f19'
    state.meta.font_family = 'Playfair Display'
    if (state.meta.particles === 'none') state.meta.particles = 'stars'
  } else if (t === 'botanical') {
    state.meta.primary_color = '#22543d'
    state.meta.bg_color = '#f2f7f3'
    state.meta.font_family = 'Lora'
  } else if (t === 'minimalist') {
    state.meta.primary_color = '#1f2937'
    state.meta.bg_color = '#fafafa'
    state.meta.font_family = 'Inter'
  } else if (t === 'playful') {
    state.meta.primary_color = '#d946ef'
    state.meta.bg_color = '#fdf2f8'
    state.meta.font_family = 'Outfit'
    if (state.meta.particles === 'none') state.meta.particles = 'confetti'
  } else if (t === 'romantic') {
    state.meta.primary_color = '#a85270'
    state.meta.bg_color = '#fffaf9'
    state.meta.font_family = 'DM Sans'
    if (state.meta.particles === 'none') state.meta.particles = 'love'
  }
}

const bgStyle = computed(() => {
  const s = {}
  if (bgImageUrl.value) {
    s.backgroundImage = `url(${bgImageUrl.value})`
    s.backgroundSize = 'cover'
    s.backgroundPosition = 'center'
  } else {
    s.background = state.meta.bg_color
  }
  return s
})

const bgOverlayStyle = computed(() => {
  if (state.meta.bg_blur > 0 && bgImageUrl.value) {
    return { backdropFilter: `blur(${state.meta.bg_blur}px)`, WebkitBackdropFilter: `blur(${state.meta.bg_blur}px)` }
  }
  return {}
})

// ===== URL management =====
function resetUrls() {
  Object.values(urls.value).forEach(u => { try { URL.revokeObjectURL(u) } catch {} })
  if (musicUrl.value) try { URL.revokeObjectURL(musicUrl.value) } catch {}
  if (bgImageUrl.value) try { URL.revokeObjectURL(bgImageUrl.value) } catch {}

  const newUrls = {}
  for (const item of state.gallery) {
    if (item.file_blob instanceof Blob) {
      newUrls[item.id] = URL.createObjectURL(item.file_blob)
    }
  }
  urls.value = newUrls
  musicUrl.value = state.music.file_blob instanceof Blob ? URL.createObjectURL(state.music.file_blob) : ''
  bgImageUrl.value = state.meta.bg_image instanceof Blob ? URL.createObjectURL(state.meta.bg_image) : ''
  musicPlaying.value = false
}

function fmtDate(v) {
  if (!v) return ''
  const date = new Date(v)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(date)
}

function changePreset() {
  const p = presets[state.meta.preset]
  if (!p) return
  state.meta.title = p.title
  // Update all sections, preserving 'on' toggle and event date
  for (const [key, val] of Object.entries(p)) {
    if (key === 'title') continue
    if (state.sections[key]) {
      const keep = { on: state.sections[key].on }
      if (key === 'event') keep.date = state.sections[key].date
      Object.assign(state.sections[key], val, keep)
    }
  }
}

function closeModal() {
  const target = open.value
  open.value = ''
  if (target) {
    nextTick(() => {
      setTimeout(() => {
        let el = null
        if (target === 'general') {
          el = document.getElementById('preview-hero') || document.querySelector('.site')
        } else {
          el = document.getElementById(`preview-${target}`) || document.getElementById('preview-hero')
        }
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('section-highlight')
          setTimeout(() => el.classList.remove('section-highlight'), 1800)
        }
      }, 50)
    })
  }
}

function addImages(e) {
  for (const file of [...e.target.files].filter(f => f.type.startsWith('image/')))
    state.gallery.push({ id: crypto.randomUUID(), file_blob: file, file_name: file.name, caption: '' })
  e.target.value = ''
  resetUrls()
}

function setMusic(e) {
  const f = e.target.files[0]
  if (f) {
    state.music.file_blob = f
    state.music.file_name = f.name
    e.target.value = ''
    resetUrls()
  }
}

function removeMusic() {
  state.music.file_blob = null
  state.music.file_name = ''
  musicPlaying.value = false
  resetUrls()
}

function setBgImage(e) {
  const f = e.target.files[0]
  if (f && f.type.startsWith('image/')) {
    state.meta.bg_image = f
    state.meta.bg_image_name = f.name
    e.target.value = ''
    resetUrls()
  }
}

function removeBgImage() {
  state.meta.bg_image = null
  state.meta.bg_image_name = ''
  resetUrls()
}

function move(id, dir) {
  const i = sections.findIndex(x => x[0] === id), j = i + dir
  if (j < 0 || j >= sections.length) return;
  // Swap using splice for reactive array
  const temp = sections[i]
  sections.splice(i, 1, sections[j])
  sections.splice(j, 1, temp)
}

// ===== Export helpers =====
function esc(s = '') { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
function fileName(n, p) { return `${p}-${n.replace(/[^\w.-]/g, '-')}` }

// Google Fonts URL for selected font
function fontUrl(fontName) {
  const map = {
    'DM Sans': 'DM+Sans:wght@400;500;600;700',
    'Playfair Display': 'Playfair+Display:wght@400;600;700',
    'Inter': 'Inter:wght@400;500;600;700',
    'Roboto': 'Roboto:wght@400;500;700',
    'Outfit': 'Outfit:wght@400;500;600;700',
    'Lora': 'Lora:wght@400;600;700',
    'Poppins': 'Poppins:wght@400;500;600;700',
    'Montserrat': 'Montserrat:wght@400;500;600;700',
  }
  return `https://fonts.googleapis.com/css2?family=${map[fontName] || map['DM Sans']}&display=swap`
}

function exportedHtml(imgs, song, bgImg) {
  const x = state.sections, active = id => x[id].on
  const photos = state.gallery.map((p, i) => imgs[i] ? `<figure><img src="assets/${imgs[i]}" alt="${esc(p.caption || 'Kenangan')}"><figcaption>${esc(p.caption)}</figcaption></figure>` : '').join('')
  const bgCss = bgImg ? `background:url('assets/${bgImg}') center/cover fixed` : `background:${state.meta.bg_color}`
  const blurCss = state.meta.bg_blur > 0 && bgImg ? `backdrop-filter:blur(${state.meta.bg_blur}px);-webkit-backdrop-filter:blur(${state.meta.bg_blur}px)` : ''
  const font = state.meta.font_family

  const faqItems = (x.faq.items || []).map(item => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('')
  const mapUrl = (() => {
    try {
      const url = new URL(x.map.url)
      return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
    } catch { return '' }
  })()

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(state.meta.title)}</title><meta name="description" content="${esc(x.hero.subtitle)}"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${fontUrl(font)}"><link rel="stylesheet" href="style.css"></head><body style="--accent:${state.meta.primary_color};--font:'${font}',sans-serif;${bgCss};font-family:'${font}',sans-serif">${blurCss ? `<div style="position:fixed;inset:0;${blurCss};z-index:0"></div>` : ''}${state.meta.particles !== 'none' ? `<canvas id="particles" style="position:fixed;inset:0;z-index:1;pointer-events:none"></canvas>` : ''}<div style="position:relative;z-index:2">${active('hero') ? `<header class="hero"><p>${esc(x.hero.kicker)}</p><h1>${esc(x.hero.title)}</h1><p>${esc(x.hero.subtitle)}</p><a href="#details">${esc(x.hero.cta)}</a></header>` : ''}<main>${active('event') ? `<section id="details"><p class="label">${esc(x.event.label)}</p><h2>${esc(fmtDate(x.event.date))}</h2><p>${esc(x.event.venue)}<br>${esc(x.event.address)}</p></section>` : ''}${active('countdown') ? `<section><p class="label">${esc(x.countdown.label)}</p><div id="countdown" data-date="${esc(x.event.date)}"></div></section>` : ''}${active('story') ? `<section class="section-story"><p class="label">OUR STORY</p><h2>${esc(x.story.title)}</h2><p>${esc(x.story.body)}</p></section>` : ''}${active('gallery') ? `<section><h2>${esc(x.gallery.title)}</h2><div class="gallery">${photos}</div></section>` : ''}${active('rsvp') ? `<section><h2>${esc(x.rsvp.title)}</h2><p>${esc(x.rsvp.note)}</p><form id="rsvp"><label>Nama<input required name="name"></label><label>Konfirmasi<select name="attendance"><option>Hadir</option><option>Belum bisa hadir</option></select></label><button>Kirim konfirmasi</button><p id="reply" aria-live="polite"></p></form></section>` : ''}${active('gift') ? `<section><h2>${esc(x.gift.title)}</h2><p>${esc(x.gift.note)}</p><strong>${esc(x.gift.bank)}</strong><p>a.n. ${esc(x.gift.holder)}</p></section>` : ''}${active('faq') ? `<section><h2>${esc(x.faq.title)}</h2>${x.faq.dress ? `<p><strong>Dress code:</strong> ${esc(x.faq.dress)}</p>` : ''}${faqItems}</section>` : ''}${active('map') ? `<section><h2>${esc(x.map.title)}</h2>${mapUrl ? `<a href="${esc(mapUrl)}" target="_blank" rel="noopener">${esc(x.map.label)}</a>` : `<span>${esc(x.map.label)}</span>`}</section>` : ''}</main></div><button id="back-to-top" style="position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:99px;background:var(--accent);color:white;border:0;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;display:none;z-index:99;font-weight:700;font-size:13px" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑ Ke Atas</button>${song ? `<audio autoplay loop src="assets/${song}"></audio>` : ''}<script src="script.js"></${''}script></body></html>`
}

async function exportZip() {
  exporting.value = true; status.value = 'Merakit website…'
  try {
    const zip = new JSZip(), imgs = Array(state.gallery.length).fill('')
    for (const [i, p] of state.gallery.entries()) {
      if (!(p.file_blob instanceof Blob)) continue
      const n = fileName(p.file_name, `gallery-${i + 1}`)
      imgs[i] = n; zip.file(`assets/${n}`, await p.file_blob.arrayBuffer())
    }
    let song = ''
    if (state.music.file_blob instanceof Blob) {
      song = fileName(state.music.file_name, 'bg-music')
      zip.file(`assets/${song}`, await state.music.file_blob.arrayBuffer())
    }
    let bgImg = ''
    if (state.meta.bg_image instanceof Blob) {
      bgImg = fileName(state.meta.bg_image_name, 'bg-image')
      zip.file(`assets/${bgImg}`, await state.meta.bg_image.arrayBuffer())
    }

    zip.file('index.html', exportedHtml(imgs, song, bgImg))

    // Particle script for exported site
    const particleScript = state.meta.particles !== 'none' ? `
;(function(){
  const canvas=document.getElementById('particles');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};resize();addEventListener('resize',resize);
  const type='${state.meta.particles}',speed=${particleCfg.value.speed},count=${particleCfg.value.count};
  const ps=[];for(let i=0;i<count;i++)ps.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*4+2,sx:(Math.random()-.5)*speed,sy:Math.random()*speed+.3,o:Math.random()*.7+.3,r:Math.random()*360,rs:(Math.random()-.5)*2});
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);for(const p of ps){p.x+=p.sx;p.y+=p.sy;p.r+=p.rs;if(p.y>canvas.height+10){p.y=-10;p.x=Math.random()*canvas.width}if(p.x>canvas.width+10)p.x=-10;if(p.x<-10)p.x=canvas.width+10;
  if(type==='snow'){ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+p.o+')';ctx.fill()}
  else if(type==='love'){const s=p.size*1.5;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);ctx.beginPath();ctx.moveTo(0,-s*.3);ctx.bezierCurveTo(s*.5,-s,s,-s*.4,0,s*.6);ctx.bezierCurveTo(-s,-s*.4,-s*.5,-s,0,-s*.3);ctx.fillStyle='rgba(220,60,100,'+p.o+')';ctx.fill();ctx.restore()}
  else if(type==='confetti'){const colors=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff78ae','#a855f7'];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);ctx.fillStyle=colors[Math.floor(p.o*colors.length)%colors.length];ctx.globalAlpha=p.o;ctx.fillRect(-p.size,-p.size*.4,p.size*2,p.size*.8);ctx.restore()}
  else if(type==='stars'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);ctx.beginPath();for(let i=0;i<5;i++){const a=i*4*Math.PI/5-Math.PI/2;ctx[i?'lineTo':'moveTo'](Math.cos(a)*p.size,Math.sin(a)*p.size)}ctx.closePath();ctx.fillStyle='rgba(255,215,0,'+p.o+')';ctx.fill();ctx.restore()}}
  requestAnimationFrame(draw)}draw()
})();` : ''

    zip.file('style.css', `@import url('${fontUrl(state.meta.font_family)}');*{box-sizing:border-box}body{margin:0;font:17px/1.7 var(--font);color:#33242a;background:#fffafa}.hero,section{padding:clamp(3rem,9vw,8rem) 1.5rem;text-align:center}.hero{min-height:92vh;display:grid;place-content:center;background:linear-gradient(145deg,rgba(255,255,255,.85),rgba(247,223,230,.85))}h1{font:clamp(3.5rem,12vw,9rem)/.9 var(--font);color:var(--accent);margin:.25em 0}h2{font:clamp(2rem,6vw,4rem)/1 var(--font);color:var(--accent)}section{max-width:900px;margin:auto;border-top:1px solid #ead8dd}.label{letter-spacing:.16em;font-size:.7rem;font-weight:700;color:var(--accent)}a,button{color:white;background:var(--accent);padding:.75rem 1.1rem;border:0;border-radius:99px;text-decoration:none;font:inherit}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.gallery figure{margin:0}.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:1rem}input,select{display:block;width:100%;padding:.7rem;margin:.3rem 0 1rem;border:1px solid #c9b9be;border-radius:.5rem}form{max-width:440px;margin:2rem auto;text-align:left}#countdown{font-size:clamp(2rem,7vw,4rem);font-weight:700;color:var(--accent)}`)

    zip.file('script.js', `const c=document.querySelector('#countdown');if(c){setInterval(()=>{let d=Math.max(0,new Date(c.dataset.date)-Date.now());c.textContent=Math.floor(d/864e5)+' hari '+Math.floor(d/36e5)%24+' jam'},1000)}document.querySelector('#rsvp')?.addEventListener('submit',e=>{e.preventDefault();document.querySelector('#reply').textContent='Terima kasih. Konfirmasi tersimpan di browser kamu.'});const b=document.getElementById('back-to-top');if(b){window.addEventListener('scroll',()=>{b.style.display=window.scrollY>250?'block':'none'})}${particleScript}`)

    saveAs(await zip.generateAsync({ type: 'blob' }), 'generated-greeting.zip')
    status.value = 'ZIP siap diunduh'
  } catch (e) { status.value = `Export gagal: ${e.message}` } finally { exporting.value = false }
}

// ===== Auto-save =====
watch(state, () => {
  if (ready.value) {
    clearTimeout(window.save)
    window.save = setTimeout(async () => {
      const raw = toRaw(state)
      const clone = JSON.parse(JSON.stringify(raw, (k, v) => v instanceof File || v instanceof Blob ? undefined : v))
      // Re-attach blobs
      clone.music = { file_blob: raw.music.file_blob, file_name: raw.music.file_name }
      clone.gallery = raw.gallery.map(g => ({ ...g }))
      clone.meta.bg_image = raw.meta.bg_image
      await db.projects.put(clone)
      status.value = 'Tersimpan lokal'
    }, 350)
  }
}, { deep: true })

watch(() => state.sections.event.date, startCountdown)

// Keep meta.title in sync with hero title for export
watch(() => state.sections.hero.title, v => { state.meta.title = v })

// ===== Init =====
onMounted(async () => {
  const saved = await db.projects.get('primary_project')
  if (saved) {
    Object.assign(state, saved)
    if (!state.sections) Object.assign(state, base())
    // Ensure new meta fields exist for upgrades
    const defaults = base().meta
    for (const key of Object.keys(defaults)) {
      if (state.meta[key] === undefined) state.meta[key] = defaults[key]
    }
    // Migrate old FAQ single Q&A to items array
    if (state.sections.faq && !state.sections.faq.items) {
      state.sections.faq.items = [{ q: state.sections.faq.question || '', a: state.sections.faq.answer || '' }]
      delete state.sections.faq.question
      delete state.sections.faq.answer
    }
  }
  resetUrls()
  ready.value = true
  status.value = 'Tersimpan lokal'
  startCountdown()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  nextTick(initParticles)
})
</script>

<template>
  <!-- Hidden audio element for music preview -->
  <audio ref="audioEl" :src="musicUrl" loop></audio>

  <header class="top">
    <a href="#builder">NOTECRAFT</a>
    <span aria-live="polite">{{ status }}</span>
    <button class="primary" :disabled="exporting" @click="exportZip">
      <Download /> {{ exporting ? 'Merakit…' : 'Download ZIP' }}
    </button>
  </header>

  <main id="builder" class="app">
    <aside>
      <p class="eyebrow">SITE BUILDER</p>
      <h1>One editor.<br><em>Many moments.</em></h1>
      <p class="intro">Atur dan sesuaikan setiap section melalui modal editor.</p>

      <!-- ===== Sections List ===== -->
      <fieldset class="sections">
        <legend><Layers style="width:14px;height:14px;vertical-align:-2px" /> Sections</legend>
        
        <!-- Preset, Tema & Musik (Pengaturan Utama) -->
        <div class="section-row section-row-preset" @click="open = 'general'">
          <span class="section-preset-icon"><Settings2 /></span>
          <span class="section-preset-label">Pengaturan Utama &amp; Musik</span>
          <span></span>
          <span></span>
          <button class="edit" @click.stop="open = 'general'">Edit</button>
        </div>

        <!-- Reorderable content sections -->
        <div v-for="([id, label], i) in sections" :key="id" class="section-row">
          <input :id="`section-${id}`" v-model="state.sections[id].on" type="checkbox">
          <label :for="`section-${id}`">{{ label }}</label>
          <button :disabled="!i" :aria-label="`Naikkan ${label}`" @click="move(id, -1)"><ChevronUp /></button>
          <button :disabled="i === sections.length - 1" :aria-label="`Turunkan ${label}`" @click="move(id, 1)"><ChevronDown /></button>
          <button class="edit" @click="open = id">Edit</button>
        </div>
      </fieldset>
    </aside>

    <!-- ===== Modal Editor ===== -->
    <Teleport to="body">
      <div v-if="open" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            <h2>
              <Settings2 v-if="open === 'general'" style="width:18px;height:18px;color:#a85270" />
              <Layers v-else style="width:18px;height:18px;color:#a85270" />
              Edit {{ open === 'general' ? 'Pengaturan Utama & Tema' : sections.find(x => x[0] === open)?.[1] }}
            </h2>
            <button class="modal-close" title="Tutup modal" @click="closeModal"><X /></button>
          </div>
          <div class="modal-body">

            <!-- General Settings (Preset, Title, Theme, Background, Particles, Music) -->
            <template v-if="open === 'general'">
              <div class="modal-section-group">
                <h3 class="modal-group-title">Preset &amp; Judul</h3>
                <label for="preset">Mulai dari preset</label>
                <select id="preset" v-model="state.meta.preset" @change="changePreset">
                  <option value="invitation">Undangan digital</option>
                  <option value="greeting">Kartu ucapan</option>
                  <option value="landing">Landing page</option>
                </select>

                <label for="site-title">Judul / nama utama</label>
                <input id="site-title" v-model="state.sections.hero.title">
              </div>

              <div class="modal-section-group">
                <h3 class="modal-group-title">Tema &amp; Tampilan</h3>
                <label for="accent">Warna brand</label>
                <input id="accent" v-model="state.meta.primary_color" type="color">

                <label for="theme-select">Tema</label>
                <select id="theme-select" v-model="state.meta.theme_id">
                  <option v-for="(label, key) in themes" :key="key" :value="key">{{ label }}</option>
                </select>

                <label for="font-select">Font</label>
                <select id="font-select" v-model="state.meta.font_family">
                  <option v-for="f in fonts" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
                </select>

                <label for="bg-color">Warna background</label>
                <input id="bg-color" v-model="state.meta.bg_color" type="color">

                <label class="upload" for="bg-upload">
                  <Upload /> {{ state.meta.bg_image_name || 'Upload background image' }}
                </label>
                <input id="bg-upload" class="sr" type="file" accept="image/*" @change="setBgImage">
                <div v-if="state.meta.bg_image_name" class="bg-preview">
                  <img v-if="bgImageUrl" :src="bgImageUrl" alt="Background preview">
                  <button class="remove-bg" @click="removeBgImage"><Trash2 /> Hapus background</button>
                </div>

                <label for="bg-blur">Blur background: {{ state.meta.bg_blur }}px</label>
                <input id="bg-blur" v-model.number="state.meta.bg_blur" type="range" min="0" max="30" step="1">
              </div>

              <div class="modal-section-group">
                <h3 class="modal-group-title">Efek Partikel</h3>
                <label for="particle-type">Jenis partikel</label>
                <select id="particle-type" v-model="state.meta.particles">
                  <option value="none">Tidak ada</option>
                  <option value="snow">❄️ Salju</option>
                  <option value="love">💕 Love / Hati</option>
                  <option value="confetti">🎉 Confetti</option>
                  <option value="stars">⭐ Bintang</option>
                </select>

                <template v-if="state.meta.particles !== 'none'">
                  <label for="particle-speed">Kecepatan</label>
                  <select id="particle-speed" v-model="state.meta.particle_speed">
                    <option value="slow">Lambat</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Cepat</option>
                  </select>

                  <label for="particle-density">Ketebalan / jumlah</label>
                  <select id="particle-density" v-model="state.meta.particle_density">
                    <option value="low">Sedikit</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Banyak</option>
                  </select>
                </template>
              </div>

              <div class="modal-section-group">
                <h3 class="modal-group-title">Musik Latar</h3>
                <label class="upload" for="music"><Music2 /> {{ state.music.file_name || 'Upload musik' }}</label>
                <input id="music" class="sr" type="file" accept="audio/*" @change="setMusic">
                <div v-if="state.music.file_name" class="music-controls">
                  <button class="music-btn" @click="toggleMusic" :title="musicPlaying ? 'Pause' : 'Play'">
                    <Pause v-if="musicPlaying" />
                    <Play v-else />
                    {{ musicPlaying ? 'Pause' : 'Preview' }}
                  </button>
                  <button class="remove-bg" @click="removeMusic"><Trash2 /> Hapus musik</button>
                </div>
              </div>
            </template>

            <!-- Hero Section -->
            <template v-if="open === 'hero'">
              <label>Eyebrow</label><input v-model="state.sections.hero.kicker">
              <label>Judul</label><input v-model="state.sections.hero.title">
              <label>Subjudul</label><textarea v-model="state.sections.hero.subtitle" rows="3"></textarea>
              <label>CTA</label><input v-model="state.sections.hero.cta">
            </template>

            <!-- Event Section -->
            <template v-if="open === 'event'">
              <label>Label section</label><input v-model="state.sections.event.label">
              <label>Tanggal &amp; waktu</label><input v-model="state.sections.event.date" type="datetime-local">
              <label>Venue</label><input v-model="state.sections.event.venue">
              <label>Alamat</label><textarea v-model="state.sections.event.address" rows="2"></textarea>
            </template>

            <!-- Countdown Section -->
            <template v-if="open === 'countdown'">
              <label>Label</label><input v-model="state.sections.countdown.label">
            </template>

            <!-- Story Section -->
            <template v-if="open === 'story'">
              <label>Judul</label><input v-model="state.sections.story.title">
              <label>Cerita</label><textarea v-model="state.sections.story.body" rows="5"></textarea>
            </template>

            <!-- Gallery Section -->
            <template v-if="open === 'gallery'">
              <label class="upload" for="photos"><ImagePlus /> Tambah foto</label>
              <input id="photos" class="sr" type="file" accept="image/*" multiple @change="addImages">
              <div v-for="(p, i) in state.gallery" :key="p.id" class="asset">
                <img v-if="urls[p.id]" :src="urls[p.id]" alt="">
                <input v-model="p.caption" placeholder="Caption">
                <button @click="state.gallery.splice(i, 1); resetUrls()"><Trash2 /></button>
              </div>
            </template>

            <!-- RSVP Section -->
            <template v-if="open === 'rsvp'">
              <label>Judul</label><input v-model="state.sections.rsvp.title">
              <label>Catatan</label><textarea v-model="state.sections.rsvp.note" rows="3"></textarea>
            </template>

            <!-- Gift Section -->
            <template v-if="open === 'gift'">
              <label>Judul</label><input v-model="state.sections.gift.title">
              <label>Catatan</label><textarea v-model="state.sections.gift.note" rows="3"></textarea>
              <label>Rekening</label><input v-model="state.sections.gift.bank">
              <label>Nama pemilik</label><input v-model="state.sections.gift.holder">
            </template>

            <!-- FAQ Section -->
            <template v-if="open === 'faq'">
              <label>Judul</label><input v-model="state.sections.faq.title">
              <label>Dress code</label><input v-model="state.sections.faq.dress">
              <div v-for="(item, i) in state.sections.faq.items" :key="i" class="faq-item">
                <label>Pertanyaan {{ i + 1 }}</label>
                <input v-model="item.q">
                <label>Jawaban</label>
                <textarea v-model="item.a" rows="2"></textarea>
                <button v-if="state.sections.faq.items.length > 1" class="remove-bg" @click="state.sections.faq.items.splice(i, 1)"><Trash2 /> Hapus</button>
              </div>
              <button class="add-btn" @click="state.sections.faq.items.push({ q: '', a: '' })"><Plus /> Tambah pertanyaan</button>
            </template>

            <!-- Map Section -->
            <template v-if="open === 'map'">
              <label>Judul</label><input v-model="state.sections.map.title">
              <label>URL Google Maps</label><input v-model="state.sections.map.url" type="url">
              <label>Label tombol</label><input v-model="state.sections.map.label">
            </template>

          </div>
          <div class="modal-footer">
            <button class="modal-done-btn" @click="closeModal">Selesai &amp; Tinjau Preview</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Preview -->
    <section class="canvas">
      <div class="canvas-bar">
        <span>PREVIEW · {{ themes[state.meta.theme_id] }} · {{ state.meta.font_family }}</span>
        <span class="canvas-page-title" :title="'Judul halaman: ' + state.meta.title">{{ state.meta.title }}</span>
        <button class="primary mobile" @click="exportZip"><Download /> Export</button>
      </div>

      <article :style="cardStyle" class="site">
        <div class="site-bg" :style="bgStyle">
          <div class="site-bg-overlay" :style="bgOverlayStyle"></div>
        </div>
        <canvas ref="particleCanvas" class="particle-canvas"></canvas>
        <div class="site-content">
          <template v-for="[id] in sections" :key="id">
            <section v-if="state.sections[id].on" :id="`preview-${id}`" :class="`block block-${id}`">

              <template v-if="id === 'hero'">
                <p class="eyebrow">{{ state.sections.hero.kicker }}</p>
                <h2>{{ state.sections.hero.title }}</h2>
                <p>{{ state.sections.hero.subtitle }}</p>
                <a href="#preview-event" class="cta-btn">{{ state.sections.hero.cta }}</a>
              </template>

              <template v-else-if="id === 'event'">
                <p class="eyebrow">{{ state.sections.event.label }}</p>
                <h3>{{ fmtDate(state.sections.event.date) }}</h3>
                <p><strong>{{ state.sections.event.venue }}</strong><br>{{ state.sections.event.address }}</p>
              </template>

              <template v-else-if="id === 'countdown'">
                <p class="eyebrow">{{ state.sections.countdown.label }}</p>
                <div class="count">
                  <span v-for="x in countdownDisplay" :key="x[0]">
                    <b>{{ String(x[1]).padStart(2, '0') }}</b>{{ x[0] }}
                  </span>
                </div>
              </template>

              <template v-else-if="id === 'story'">
                <p class="eyebrow">OUR STORY</p>
                <h3>{{ state.sections.story.title }}</h3>
                <p>{{ state.sections.story.body }}</p>
              </template>

              <template v-else-if="id === 'gallery'">
                <h3>{{ state.sections.gallery.title }}</h3>
                <div class="photos">
                  <img v-for="p in state.gallery" :key="p.id" :src="urls[p.id]" :alt="p.caption || 'Kenangan'">
                </div>
                <p v-if="!state.gallery.length" class="muted">Tambahkan foto dari panel editor.</p>
              </template>

              <template v-else-if="id === 'rsvp'">
                <h3>{{ state.sections.rsvp.title }}</h3>
                <p>{{ state.sections.rsvp.note }}</p>
                <button>Konfirmasi hadir</button>
              </template>

              <template v-else-if="id === 'gift'">
                <Gift />
                <h3>{{ state.sections.gift.title }}</h3>
                <p>{{ state.sections.gift.note }}</p>
                <strong>{{ state.sections.gift.bank }}</strong>
                <small>a.n. {{ state.sections.gift.holder }}</small>
              </template>

              <template v-else-if="id === 'faq'">
                <h3>{{ state.sections.faq.title }}</h3>
                <p v-if="state.sections.faq.dress"><b>Dress code</b><br>{{ state.sections.faq.dress }}</p>
                <details v-for="(item, i) in state.sections.faq.items" :key="i">
                  <summary>{{ item.q }}</summary>
                  <p>{{ item.a }}</p>
                </details>
              </template>

              <template v-else-if="id === 'map'">
                <MapPin />
                <h3>{{ state.sections.map.title }}</h3>
                <a :href="state.sections.map.url" target="_blank">{{ state.sections.map.label }}</a>
              </template>

            </section>
          </template>
        </div>
      </article>
      <p class="notice">Hasil export menjadi website statis siap hosting. RSVP memberi konfirmasi lokal, tanpa backend.</p>
    </section>
  </main>

  <!-- Floating Scroll To Top Button -->
  <button
    v-show="showScrollTop"
    class="scroll-to-top"
    title="Kembali ke atas"
    aria-label="Kembali ke atas"
    @click="scrollToTop"
  >
    <ArrowUp />
    <span>Ke Atas</span>
  </button>
</template>
