<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  Calendar,
  Copy,
  Download,
  Gift,
  MailOpen,
  MapPin,
  Maximize2,
  MessageSquare,
  Monitor,
  QrCode,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
  UserCheck
} from 'lucide-vue-next'

const props = defineProps({
  state: { type: Object, required: true },
  sections: { type: Array, required: true },
  themes: { type: Object, required: true },
  themeStyles: { type: Object, required: true },
  cardStyle: { type: Object, required: true },
  bgStyle: { type: Object, required: true },
  bgOverlayStyle: { type: Object, required: true },
  urls: { type: Object, default: () => ({}) },
  qrisUrl: { type: String, default: '' },
  countdownDisplay: { type: Array, default: () => [] },
  activeGuestName: { type: String, default: 'Tamu Undangan' },
  monogramInitials: { type: String, default: 'NA' },
  coverOpened: { type: Boolean, default: false },
  googleCalendarUrl: { type: String, default: '#' },
})

const emit = defineEmits([
  'export-zip',
  'open-invitation',
  'reset-cover',
  'open-lightbox',
  'copy-account',
  'show-toast'
])

// Device Viewport Switcher (STU-01)
const viewportMode = ref('mobile')
const viewportStyle = computed(() => {
  if (viewportMode.value === 'mobile') {
    return { width: '385px', maxWidth: '100%', transition: 'max-width .3s cubic-bezier(0.16, 1, 0.3, 1), width .3s ease' }
  }
  if (viewportMode.value === 'tablet') {
    return { width: '720px', maxWidth: '100%', transition: 'max-width .3s cubic-bezier(0.16, 1, 0.3, 1), width .3s ease' }
  }
  return { width: '100%', maxWidth: '960px', transition: 'max-width .3s cubic-bezier(0.16, 1, 0.3, 1), width .3s ease' }
})

// Local RSVP form state in preview
const rsvpForm = reactive({
  name: '',
  attendance: 'Hadir',
  pax: '2 Orang',
  notes: ''
})
const rsvpSubmitted = ref(false)

function submitRsvpPreview() {
  if (!rsvpForm.name.trim()) {
    emit('show-toast', '⚠️ Mohon masukkan nama Anda')
    return
  }
  rsvpSubmitted.value = true
  emit('show-toast', '✅ Konfirmasi kehadiran berhasil dicatat!')
}

function sendRsvpWaPreview() {
  const name = rsvpForm.name.trim() || 'Tamu Undangan'
  const att = rsvpForm.attendance
  const pax = rsvpForm.pax
  const notes = rsvpForm.notes.trim()
  const wa = (props.state.sections.rsvp.wa_number || '').replace(/\D/g, '')
  const title = props.state.sections.hero.title || props.state.meta.title || 'Acara Bahagia'
  const text = `Halo! Konfirmasi kehadiran untuk *${title}*:%0A- Nama: *${encodeURIComponent(name)}*%0A- Status: *${encodeURIComponent(att)} (${encodeURIComponent(pax)})*%0A- Ucapan: ${encodeURIComponent(notes || '-')}`
  const link = wa ? `https://wa.me/${wa}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`
  window.open(link, '_blank')
}

// Local Guestbook form state in preview
const wishForm = reactive({
  name: '',
  message: ''
})

function submitWishPreview() {
  if (!wishForm.name.trim() || !wishForm.message.trim()) {
    emit('show-toast', '⚠️ Mohon lengkapi nama dan doa restu')
    return
  }
  if (!props.state.sections.guestbook.items) props.state.sections.guestbook.items = []
  props.state.sections.guestbook.items.unshift({
    name: wishForm.name.trim(),
    message: wishForm.message.trim(),
    date: 'Baru saja'
  })
  wishForm.name = ''
  wishForm.message = ''
  emit('show-toast', '✨ Doa & ucapan berhasil dikirim!')
}

function fmtDate(v) {
  if (!v) return ''
  const date = new Date(v)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(date)
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
    count: densityMap[props.state.meta.particle_density] || 50,
    speed: speedMap[props.state.meta.particle_speed] || 1,
    type: props.state.meta.particles,
  }
})

function initParticles() {
  if (particleAnimId) { cancelAnimationFrame(particleAnimId); particleAnimId = null }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  particles = []
  const canvas = particleCanvas.value
  if (!canvas || props.state.meta.particles === 'none') return

  const ctx = canvas.getContext('2d')
  function resize() {
    const parent = canvas.parentElement
    if (!parent) return
    canvas.width = parent.offsetWidth
    canvas.height = parent.offsetHeight
  }
  resize()

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.parentElement)

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

// ===== Scroll Reveal Observer (DEV-03) =====
let scrollRevealObserver = null

function setupScrollReveal() {
  if (scrollRevealObserver) {
    scrollRevealObserver.disconnect()
    scrollRevealObserver = null
  }
  nextTick(() => {
    const blocks = document.querySelectorAll('.site .block')
    if (!blocks.length) return

    if ('IntersectionObserver' in window) {
      scrollRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
          }
        })
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' })

      blocks.forEach(b => {
        b.classList.add('reveal-on-scroll')
        scrollRevealObserver.observe(b)
      })
    } else {
      blocks.forEach(b => b.classList.add('is-revealed'))
    }
  })
}

onMounted(() => {
  nextTick(() => {
    initParticles()
    setupScrollReveal()
  })
})

onUnmounted(() => {
  if (particleAnimId) cancelAnimationFrame(particleAnimId)
  if (resizeObserver) resizeObserver.disconnect()
  if (scrollRevealObserver) scrollRevealObserver.disconnect()
})

watch(() => [props.state.meta.particles, props.state.meta.particle_speed, props.state.meta.particle_density], () => {
  nextTick(initParticles)
})

watch(() => props.sections, () => {
  setupScrollReveal()
}, { deep: true })
</script>

<template>
  <section class="canvas">
    <div class="canvas-bar">
      <span>PREVIEW · {{ themes[state.meta.theme_id] }}</span>
      <span class="canvas-page-title" :title="'Judul halaman: ' + state.meta.title">{{ state.meta.title }}</span>

      <!-- Viewport Device Switcher (STU-01) -->
      <div class="viewport-switcher">
        <button
          type="button"
          :class="['viewport-btn', { active: viewportMode === 'mobile' }]"
          title="Tampilan HP / Mobile (375px)"
          @click="viewportMode = 'mobile'"
        >
          <Smartphone style="width:13px;height:13px;vertical-align:-1px" />
          <span class="viewport-btn-text">HP</span>
        </button>
        <button
          type="button"
          :class="['viewport-btn', { active: viewportMode === 'tablet' }]"
          title="Tampilan Tablet (768px)"
          @click="viewportMode = 'tablet'"
        >
          <Tablet style="width:13px;height:13px;vertical-align:-1px" />
          <span class="viewport-btn-text">Tablet</span>
        </button>
        <button
          type="button"
          :class="['viewport-btn', { active: viewportMode === 'desktop' }]"
          title="Tampilan Penuh / Desktop (960px)"
          @click="viewportMode = 'desktop'"
        >
          <Monitor style="width:13px;height:13px;vertical-align:-1px" />
          <span class="viewport-btn-text">Desktop</span>
        </button>
      </div>

      <button class="primary mobile" @click="$emit('export-zip')"><Download /> Export</button>
    </div>

    <article :style="[cardStyle, viewportStyle]" :class="['site', `theme-${state.meta.theme_id}`, { 'theme-dark': themeStyles.isDark }, `viewport-${viewportMode}`]">
      <div class="site-bg" :style="bgStyle">
        <div class="site-bg-overlay" :style="bgOverlayStyle"></div>
      </div>
      <canvas ref="particleCanvas" class="particle-canvas"></canvas>

      <!-- Envelope Cover Overlay (FTR-01 & FTR-02) -->
      <div v-if="state.meta.enable_cover" :class="['envelope-cover', { 'cover-opened': coverOpened }]">
        <div class="envelope-inner">
          <div class="envelope-seal">
            <MailOpen style="width:36px;height:36px" />
          </div>
          <p class="envelope-kicker">{{ state.meta.cover_kicker || 'Kepada Yth. Tamu Undangan:' }}</p>
          <h2 class="envelope-guest">{{ activeGuestName }}</h2>
          <p class="envelope-sub">{{ state.meta.cover_subtitle || 'Kami mengundang Anda untuk hadir di momen bahagia kami.' }}</p>
          <button class="open-invite-btn" @click="$emit('open-invitation')">
            <MailOpen style="width:17px;height:17px;vertical-align:-3px;margin-right:6px" /> Buka Undangan
          </button>
        </div>
      </div>
      <button
        v-if="state.meta.enable_cover && coverOpened"
        class="cover-reset-pill"
        title="Tutup kembali cover untuk simulasi"
        @click="$emit('reset-cover')"
      >
        Tutup Cover
      </button>

      <div class="site-content">
        <template v-for="[id] in sections" :key="id">
          <section v-if="state.sections[id].on" :id="`preview-${id}`" :class="`block block-${id} reveal-on-scroll`">
            <!-- Hero Block -->
            <template v-if="id === 'hero'">
              <!-- Classic Centered -->
              <div v-if="!state.sections.hero.style || state.sections.hero.style === 'classic'" class="hero-layout-classic">
                <p class="eyebrow">{{ state.sections.hero.kicker }}</p>
                <h2>{{ state.sections.hero.title }}</h2>
                <p>{{ state.sections.hero.subtitle }}</p>
                <a href="#preview-event" class="cta-btn">{{ state.sections.hero.cta }}</a>
              </div>

              <!-- Monogram Initials -->
              <div v-else-if="state.sections.hero.style === 'monogram'" class="hero-layout-monogram">
                <div class="monogram-badge">
                  <span class="monogram-ring"></span>
                  <span class="monogram-text">{{ state.sections.hero.monogram || monogramInitials }}</span>
                </div>
                <p class="eyebrow">{{ state.sections.hero.kicker }}</p>
                <h2>{{ state.sections.hero.title }}</h2>
                <p>{{ state.sections.hero.subtitle }}</p>
                <a href="#preview-event" class="cta-btn">{{ state.sections.hero.cta }}</a>
              </div>

              <!-- Split / Modern Badge -->
              <div v-else-if="state.sections.hero.style === 'split'" class="hero-layout-split">
                <div class="split-pill-badge">
                  <Sparkles style="width:13px;height:13px;vertical-align:-1px;margin-right:4px" /> {{ state.sections.hero.kicker }}
                </div>
                <h2>{{ state.sections.hero.title }}</h2>
                <div class="split-divider"></div>
                <p>{{ state.sections.hero.subtitle }}</p>
                <a href="#preview-event" class="cta-btn">{{ state.sections.hero.cta }}</a>
              </div>

              <!-- Minimal Editorial -->
              <div v-else-if="state.sections.hero.style === 'minimal'" class="hero-layout-minimal">
                <div class="minimal-rule">
                  <span></span>
                  <p class="eyebrow">{{ state.sections.hero.kicker }}</p>
                  <span></span>
                </div>
                <h2>{{ state.sections.hero.title }}</h2>
                <p class="minimal-sub">{{ state.sections.hero.subtitle }}</p>
                <a href="#preview-event" class="cta-btn minimal-btn">{{ state.sections.hero.cta }}</a>
              </div>
            </template>

            <!-- Event Block (FTR-04) -->
            <template v-else-if="id === 'event'">
              <p class="eyebrow">{{ state.sections.event.label }}</p>
              <h3>{{ fmtDate(state.sections.event.date) }}</h3>
              <p><strong>{{ state.sections.event.venue }}</strong><br>{{ state.sections.event.address }}</p>
              <div v-if="state.sections.event.enable_calendar" style="margin-top:1.25rem">
                <a :href="googleCalendarUrl" target="_blank" rel="noopener noreferrer" class="calendar-btn">
                  <Calendar style="width:16px;height:16px;vertical-align:-2px;margin-right:6px" /> Simpan ke Google Calendar
                </a>
              </div>
            </template>

            <!-- Countdown Block -->
            <template v-else-if="id === 'countdown'">
              <p class="eyebrow">{{ state.sections.countdown.label }}</p>
              <div class="count">
                <span v-for="x in countdownDisplay" :key="x[0]">
                  <b>{{ String(x[1]).padStart(2, '0') }}</b>{{ x[0] }}
                </span>
              </div>
            </template>

            <!-- Story Block -->
            <template v-else-if="id === 'story'">
              <p class="eyebrow">OUR STORY</p>
              <h3>{{ state.sections.story.title }}</h3>

              <!-- Text Mode -->
              <p v-if="state.sections.story.mode !== 'timeline'">{{ state.sections.story.body }}</p>

              <!-- Timeline Mode -->
              <div v-else class="story-timeline">
                <div v-for="(item, idx) in state.sections.story.items" :key="idx" class="timeline-item">
                  <div class="timeline-marker">
                    <span class="timeline-dot"></span>
                    <span v-if="idx < state.sections.story.items.length - 1" class="timeline-line"></span>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-year-badge">{{ item.year }}</span>
                    <h4 class="timeline-title">{{ item.title }}</h4>
                    <p class="timeline-desc">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Gallery Block (FTR-06) -->
            <template v-else-if="id === 'gallery'">
              <h3>{{ state.sections.gallery.title }}</h3>
              <div class="photos">
                <div
                  v-for="(p, i) in state.gallery"
                  :key="p.id"
                  class="gallery-figure"
                  @click="$emit('open-lightbox', i)"
                >
                  <img :src="urls[p.id]" :alt="p.caption || 'Kenangan'">
                  <span class="gallery-zoom-icon"><Maximize2 /></span>
                  <figcaption v-if="p.caption">{{ p.caption }}</figcaption>
                </div>
              </div>
              <p v-if="!state.gallery.length" class="muted">Tambahkan foto dari panel editor.</p>
            </template>

            <!-- RSVP Block (FTR-05) -->
            <template v-else-if="id === 'rsvp'">
              <h3>{{ state.sections.rsvp.title }}</h3>
              <p>{{ state.sections.rsvp.note }}</p>
              <div class="rsvp-card">
                <div class="rsvp-field">
                  <label>Nama Anda</label>
                  <input v-model="rsvpForm.name" placeholder="Nama lengkap">
                </div>
                <div class="rsvp-row">
                  <div class="rsvp-field">
                    <label>Konfirmasi</label>
                    <select v-model="rsvpForm.attendance">
                      <option value="Hadir">Hadir</option>
                      <option value="Tidak Bisa Hadir">Tidak Bisa Hadir</option>
                      <option value="Masih Ragu">Masih Ragu</option>
                    </select>
                  </div>
                  <div class="rsvp-field">
                    <label>Jumlah Tamu</label>
                    <select v-model="rsvpForm.pax">
                      <option value="1 Orang">1 Orang</option>
                      <option value="2 Orang">2 Orang</option>
                      <option value="3 Orang">3 Orang</option>
                      <option value="4+ Orang">4+ Orang</option>
                    </select>
                  </div>
                </div>
                <div class="rsvp-field">
                  <label>Pesan / Ucapan Singkat</label>
                  <textarea v-model="rsvpForm.notes" rows="2" placeholder="Tuliskan ucapan atau doa..."></textarea>
                </div>
                <div class="rsvp-actions">
                  <button class="rsvp-submit-btn" @click="submitRsvpPreview">
                    <UserCheck style="width:15px;height:15px;vertical-align:-2px;margin-right:6px" /> Kirim Konfirmasi
                  </button>
                  <button v-if="state.sections.rsvp.enable_wa" class="rsvp-wa-btn" @click="sendRsvpWaPreview">
                    <MessageSquare style="width:15px;height:15px;vertical-align:-2px;margin-right:6px" /> Konfirmasi via WhatsApp
                  </button>
                </div>
                <div v-if="rsvpSubmitted" class="rsvp-reply-msg">
                  ✅ Terima kasih atas konfirmasi kehadiranmu! Data telah tercatat.
                </div>
              </div>
            </template>

            <!-- Guestbook Block (FTR-07) -->
            <template v-else-if="id === 'guestbook'">
              <p class="eyebrow">BUKU TAMU</p>
              <h3>{{ state.sections.guestbook.title }}</h3>
              <p v-if="state.sections.guestbook.note">{{ state.sections.guestbook.note }}</p>

              <div class="guestbook-card">
                <div class="guestbook-field">
                  <label>Nama Pengirim</label>
                  <input v-model="wishForm.name" placeholder="Nama Anda / Pasangan">
                </div>
                <div class="guestbook-field">
                  <label>Ucapan &amp; Doa Restu</label>
                  <textarea v-model="wishForm.message" rows="3" placeholder="Tulis doa restu dan harapan terbaik Anda..."></textarea>
                </div>
                <button class="wish-submit-btn" @click="submitWishPreview">
                  <Send style="width:15px;height:15px;vertical-align:-2px;margin-right:6px" /> Kirim Ucapan &amp; Doa
                </button>
              </div>

              <div class="guestbook-list">
                <div v-for="(w, idx) in (state.sections.guestbook.items || [])" :key="idx" class="wish-card">
                  <div class="wish-header">
                    <strong>{{ w.name }}</strong>
                    <span class="wish-time">{{ w.date }}</span>
                  </div>
                  <p class="wish-body">{{ w.message }}</p>
                </div>
                <p v-if="!state.sections.guestbook.items?.length" class="muted" style="text-align:center">
                  Belum ada ucapan. Jadilah yang pertama memberikan doa!
                </p>
              </div>
            </template>

            <!-- Gift Block (FTR-03) -->
            <template v-else-if="id === 'gift'">
              <Gift />
              <h3>{{ state.sections.gift.title }}</h3>
              <p>{{ state.sections.gift.note }}</p>
              <div class="gift-card-box">
                <div class="gift-acc-row">
                  <strong class="gift-bank-num">{{ state.sections.gift.bank }}</strong>
                  <button class="copy-acc-btn" @click="$emit('copy-account', state.sections.gift.bank)">
                    <Copy style="width:13px;height:13px;vertical-align:-2px;margin-right:4px" /> Salin
                  </button>
                </div>
                <small class="gift-holder-label">a.n. {{ state.sections.gift.holder }}</small>
              </div>

              <div v-if="qrisUrl" class="qris-card">
                <img :src="qrisUrl" alt="QRIS Amplop Digital">
                <p class="qris-label">
                  <QrCode style="width:14px;height:14px;vertical-align:-2px;margin-right:4px" /> Pindai QRIS untuk amplop digital
                </p>
              </div>
            </template>

            <!-- FAQ Block -->
            <template v-else-if="id === 'faq'">
              <h3>{{ state.sections.faq.title }}</h3>
              <p v-if="state.sections.faq.dress"><b>Dress code</b><br>{{ state.sections.faq.dress }}</p>
              <details v-for="(item, i) in state.sections.faq.items" :key="i">
                <summary>{{ item.q }}</summary>
                <p>{{ item.a }}</p>
              </details>
            </template>

            <!-- Map Block -->
            <template v-else-if="id === 'map'">
              <MapPin />
              <h3>{{ state.sections.map.title }}</h3>
              <a :href="state.sections.map.url" target="_blank">{{ state.sections.map.label }}</a>
            </template>
          </section>
        </template>
      </div>
    </article>
    <p class="notice">Hasil export menjadi website statis siap hosting. RSVP &amp; Buku Tamu memberi konfirmasi interaktif lokal, tanpa backend.</p>
  </section>
</template>
