<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, watch } from 'vue'
import Dexie from 'dexie'
import { ArrowUp, Download } from 'lucide-vue-next'

import { fonts, getDefaultBase, presets, themes, themeStylesMap } from './constants/presets'
import { exportZipPackage, getGoogleCalendarUrl } from './services/exporter'

import Sidebar from './components/Sidebar.vue'
import ModalEditor from './components/ModalEditor.vue'
import PreviewCanvas from './components/PreviewCanvas.vue'
import LightboxModal from './components/LightboxModal.vue'

// ===== Database & State =====
const db = new Dexie('GreetingGeneratorDB')
db.version(2).stores({ projects: 'id' })

const sections = reactive([
  ['hero', 'Cover & CTA'],
  ['event', 'Detail acara'],
  ['countdown', 'Countdown'],
  ['story', 'Cerita'],
  ['gallery', 'Galeri'],
  ['rsvp', 'RSVP Kehadiran'],
  ['guestbook', 'Buku Tamu & Doa'],
  ['gift', 'Gift & Amplop'],
  ['faq', 'FAQ & dress code'],
  ['map', 'Lokasi'],
])

const state = reactive(getDefaultBase())
const ready = ref(false)
const status = ref('Memuat studio…')
const exporting = ref(false)
const open = ref('')

const urls = ref({})
const musicUrl = ref('')
const bgImageUrl = ref('')
const qrisUrl = ref('')
const musicPlaying = ref(false)
const audioEl = ref(null)
const showScrollTop = ref(false)

// Toast feedback
const toastMessage = ref('')
function showToast(msg) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = '' }, 2600)
}

function copyToClipboard(text, customSuccessMsg) {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    showToast(customSuccessMsg || '✅ Berhasil disalin ke clipboard!')
  }).catch(() => {
    showToast('✅ Tersalin: ' + text)
  })
}

// Cover "Buka Undangan" (FTR-01)
const coverOpened = ref(false)
function openInvitation() {
  coverOpened.value = true
  const audio = audioEl.value
  if (audio && musicUrl.value) {
    audio.play().then(() => {
      musicPlaying.value = true
    }).catch(() => {})
  }
}

// Guest name personalization (FTR-02)
const guestNameFromUrl = ref('')
const activeGuestName = computed(() => {
  return guestNameFromUrl.value || state.meta.simulated_guest || 'Tamu Undangan'
})

// WhatsApp Share Generator (FTR-02)
const shareGuestName = ref('Budi Santoso & Partner')
const shareWaNumber = ref('')
const shareBaseUrl = ref(typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://undangan.digital')

const generatedShareLink = computed(() => {
  const base = (shareBaseUrl.value || '').replace(/\/$/, '')
  const name = encodeURIComponent(shareGuestName.value.trim() || 'Tamu Undangan')
  return `${base}?to=${name}`
})

const generatedWaMessage = computed(() => {
  const title = state.sections.hero.title || state.meta.title || 'Hari Bahagia'
  return `Kepada Yth. *${shareGuestName.value.trim() || 'Tamu Undangan'}*,%0A%0ATanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir merayakan ${title}.%0A%0ASilakan buka tautan undangan digital berikut:%0A${generatedShareLink.value}%0A%0ATerima kasih atas doa dan kehadirannya!`
})

function sendShareViaWa() {
  const phone = (shareWaNumber.value || '').replace(/\D/g, '')
  const link = phone ? `https://wa.me/${phone}?text=${generatedWaMessage.value}` : `https://api.whatsapp.com/send?text=${generatedWaMessage.value}`
  window.open(link, '_blank')
}

// Google Calendar URL computed (FTR-04)
const googleCalendarUrl = computed(() => getGoogleCalendarUrl(state))

// QRIS Handlers (FTR-03)
function setQrisImage(e) {
  const f = e.target.files[0]
  if (f && f.type.startsWith('image/')) {
    state.sections.gift.qris_image = f
    state.sections.gift.qris_image_name = f.name
    e.target.value = ''
    resetUrls()
    showToast('✅ Gambar QRIS berhasil diunggah')
  }
}

function removeQrisImage() {
  state.sections.gift.qris_image = null
  state.sections.gift.qris_image_name = ''
  resetUrls()
  showToast('🗑️ Gambar QRIS dihapus')
}

// Lightbox Galeri (FTR-06)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(idx) {
  lightboxIndex.value = idx
  lightboxOpen.value = true
}
function closeLightbox() {
  lightboxOpen.value = false
}
function nextLightbox() {
  if (!state.gallery.length) return
  lightboxIndex.value = (lightboxIndex.value + 1) % state.gallery.length
}
function prevLightbox() {
  if (!state.gallery.length) return
  lightboxIndex.value = (lightboxIndex.value - 1 + state.gallery.length) % state.gallery.length
}

// Scroll to top
function onWindowScroll() {
  showScrollTop.value = window.scrollY > 200
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})
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

// Monogram Initials
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

// Theme-specific styles
const themeStyles = computed(() => {
  return themeStylesMap[state.meta.theme_id] || themeStylesMap.romantic
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
  if (qrisUrl.value) try { URL.revokeObjectURL(qrisUrl.value) } catch {}

  const newUrls = {}
  for (const item of state.gallery) {
    if (item.file_blob instanceof Blob) {
      newUrls[item.id] = URL.createObjectURL(item.file_blob)
    }
  }
  urls.value = newUrls
  musicUrl.value = state.music.file_blob instanceof Blob ? URL.createObjectURL(state.music.file_blob) : ''
  bgImageUrl.value = state.meta.bg_image instanceof Blob ? URL.createObjectURL(state.meta.bg_image) : ''
  qrisUrl.value = state.sections.gift?.qris_image instanceof Blob ? URL.createObjectURL(state.sections.gift.qris_image) : ''
  musicPlaying.value = false
}

function changePreset() {
  const p = presets[state.meta.preset]
  if (!p) return
  state.meta.title = p.title
  if (p.meta) {
    for (const [mk, mv] of Object.entries(p.meta)) {
      state.meta[mk] = mv
    }
  }
  for (const [key, val] of Object.entries(p)) {
    if (key === 'title' || key === 'meta') continue
    if (state.sections[key]) {
      const keep = { on: state.sections[key].on }
      if (key === 'event' && state.sections[key].date && !val.date) keep.date = state.sections[key].date
      const clonedVal = JSON.parse(JSON.stringify(val))
      Object.assign(state.sections[key], clonedVal, keep)
    }
  }
}

function onThemeChange() {
  const t = state.meta.theme_id
  if (t === 'luxury_gold') {
    state.meta.primary_color = '#d4af37'
    state.meta.bg_color = '#0b1120'
    state.meta.font_family = 'Cinzel'
    state.meta.particles = 'stars'
  } else if (t === 'botanical') {
    state.meta.primary_color = '#2f5233'
    state.meta.bg_color = '#f2f8f4'
    state.meta.font_family = 'Playfair Display'
    state.meta.particles = 'snow'
  } else if (t === 'minimalist') {
    state.meta.primary_color = '#1f2937'
    state.meta.bg_color = '#ffffff'
    state.meta.font_family = 'Inter'
    state.meta.particles = 'none'
  } else if (t === 'playful') {
    state.meta.primary_color = '#d946ef'
    state.meta.bg_color = '#fdf2f8'
    state.meta.font_family = 'Outfit'
    state.meta.particles = 'confetti'
  } else {
    state.meta.primary_color = '#a85270'
    state.meta.bg_color = '#fffaf9'
    state.meta.font_family = 'DM Sans'
    state.meta.particles = 'love'
  }
}

function closeModal() {
  const target = open.value
  open.value = ''
  if (target) {
    nextTick(() => {
      const el = document.getElementById(`preview-${target}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('section-highlight')
        setTimeout(() => el.classList.remove('section-highlight'), 1800)
      }
    })
  }
}

// Media upload handlers
function setBgImage(e) {
  const f = e.target.files[0]
  if (f) {
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
  resetUrls()
}
function addImages(e) {
  const files = Array.from(e.target.files || [])
  for (const f of files) {
    const id = (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))
    state.gallery.push({ id, file_blob: f, file_name: f.name, caption: '' })
  }
  e.target.value = ''
  resetUrls()
}
function removeImage(i) {
  state.gallery.splice(i, 1)
  resetUrls()
}

// Section reordering
function move(id, dir) {
  const i = sections.findIndex(x => x[0] === id)
  const j = i + dir
  if (j < 0 || j >= sections.length) return
  const temp = sections[i]
  sections.splice(i, 1, sections[j])
  sections.splice(j, 1, temp)
}

// Export zip package
async function handleExportZip() {
  exporting.value = true
  status.value = 'Merakit website…'
  try {
    const densityMap = { low: 25, medium: 50, high: 100 }
    const speedMap = { slow: 0.3, normal: 1, fast: 2.5 }
    const particleCfg = {
      count: densityMap[state.meta.particle_density] || 50,
      speed: speedMap[state.meta.particle_speed] || 1,
    }
    await exportZipPackage(state, particleCfg, monogramInitials.value)
    status.value = 'ZIP siap diunduh'
  } catch (e) {
    status.value = `Export gagal: ${e.message}`
  } finally {
    exporting.value = false
  }
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
      if (raw.sections.gift && raw.sections.gift.qris_image) {
        clone.sections.gift.qris_image = raw.sections.gift.qris_image
      }
      await db.projects.put(clone)
      status.value = 'Tersimpan lokal'
    }, 350)
  }
}, { deep: true })

watch(() => state.sections.event.date, startCountdown)
watch(() => state.sections.hero.title, v => { state.meta.title = v })

// ===== Init & Migration =====
onMounted(async () => {
  const saved = await db.projects.get('primary_project')
  if (saved) {
    Object.assign(state, saved)
    if (!state.sections) Object.assign(state, getDefaultBase())

    const defaults = getDefaultBase().meta
    for (const key of Object.keys(defaults)) {
      if (state.meta[key] === undefined) state.meta[key] = defaults[key]
    }
    if (state.sections.hero) {
      if (!state.sections.hero.style) state.sections.hero.style = 'classic'
      if (state.sections.hero.monogram === undefined) state.sections.hero.monogram = ''
    }
    if (state.sections.event) {
      if (state.sections.event.enable_calendar === undefined) state.sections.event.enable_calendar = true
    }
    if (state.sections.rsvp) {
      if (!state.sections.rsvp.wa_number) state.sections.rsvp.wa_number = '6281234567890'
      if (state.sections.rsvp.enable_wa === undefined) state.sections.rsvp.enable_wa = true
    }
    if (!state.sections.guestbook) {
      state.sections.guestbook = getDefaultBase().sections.guestbook
    }
    if (state.sections.gift) {
      if (state.sections.gift.qris_image === undefined) state.sections.gift.qris_image = null
      if (state.sections.gift.qris_image_name === undefined) state.sections.gift.qris_image_name = ''
    }
    if (state.sections.story) {
      if (!state.sections.story.mode) state.sections.story.mode = 'text'
      if (!Array.isArray(state.sections.story.items) || !state.sections.story.items.length) {
        state.sections.story.items = getDefaultBase().sections.story.items
      }
    }
    if (state.sections.faq && !state.sections.faq.items) {
      state.sections.faq.items = [{ q: state.sections.faq.question || '', a: state.sections.faq.answer || '' }]
      delete state.sections.faq.question
      delete state.sections.faq.answer
    }
  }

  // Live personalization from URL
  try {
    const p = new URLSearchParams(window.location.search).get('to')
    if (p) {
      guestNameFromUrl.value = p
      shareGuestName.value = p
    }
    shareBaseUrl.value = window.location.origin + window.location.pathname
  } catch (err) {}

  resetUrls()
  ready.value = true
  status.value = 'Tersimpan lokal'
  startCountdown()
})
</script>

<template>
  <!-- Hidden audio element for preview -->
  <audio ref="audioEl" :src="musicUrl" loop></audio>

  <header class="top">
    <a href="#builder">NOTECRAFT</a>
    <span aria-live="polite">{{ status }}</span>
    <button class="primary" :disabled="exporting" @click="handleExportZip">
      <Download /> {{ exporting ? 'Merakit…' : 'Download ZIP' }}
    </button>
  </header>

  <main id="builder" class="app">
    <!-- Sidebar Component (DEV-02) -->
    <Sidebar
      :sections="sections"
      :state="state"
      @open-modal="open = $event"
      @move-section="move"
    />

    <!-- Preview Canvas Component (DEV-02 & DEV-03) -->
    <PreviewCanvas
      :state="state"
      :sections="sections"
      :themes="themes"
      :theme-styles="themeStyles"
      :card-style="cardStyle"
      :bg-style="bgStyle"
      :bg-overlay-style="bgOverlayStyle"
      :urls="urls"
      :qris-url="qrisUrl"
      :countdown-display="countdownDisplay"
      :active-guest-name="activeGuestName"
      :monogram-initials="monogramInitials"
      :cover-opened="coverOpened"
      :google-calendar-url="googleCalendarUrl"
      @export-zip="handleExportZip"
      @open-invitation="openInvitation"
      @reset-cover="coverOpened = false"
      @open-lightbox="openLightbox"
      @copy-account="copyToClipboard($event, 'Nomor rekening berhasil disalin!')"
      @show-toast="showToast"
    />
  </main>

  <!-- Modal Editor Component (DEV-02) -->
  <ModalEditor
    :open="open"
    :state="state"
    :sections="sections"
    :themes="themes"
    :fonts="fonts"
    :bg-image-url="bgImageUrl"
    :music-playing="musicPlaying"
    :qris-url="qrisUrl"
    :urls="urls"
    :share-guest-name="shareGuestName"
    :share-wa-number="shareWaNumber"
    :generated-share-link="generatedShareLink"
    @close="closeModal"
    @change-preset="changePreset"
    @theme-change="onThemeChange"
    @set-bg-image="setBgImage"
    @remove-bg-image="removeBgImage"
    @set-music="setMusic"
    @remove-music="removeMusic"
    @toggle-music="toggleMusic"
    @add-images="addImages"
    @remove-image="removeImage"
    @set-qris-image="setQrisImage"
    @remove-qris-image="removeQrisImage"
    @copy-link="copyToClipboard(generatedShareLink, 'Tautan tamu berhasil disalin!')"
    @send-share-wa="sendShareViaWa"
    @update:share-guest-name="shareGuestName = $event"
    @update:share-wa-number="shareWaNumber = $event"
  />

  <!-- Lightbox Modal Component (DEV-02 & FTR-06) -->
  <LightboxModal
    :open="lightboxOpen"
    :index="lightboxIndex"
    :gallery="state.gallery"
    :urls="urls"
    @close="closeLightbox"
    @next="nextLightbox"
    @prev="prevLightbox"
  />

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

  <!-- Global Toast Notification -->
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="toastMessage" class="toast-popup">
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
</template>
