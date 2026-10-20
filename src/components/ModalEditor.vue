<script setup>
import { ref } from 'vue'
import {
  Columns2,
  Copy,
  CopyPlus,
  ImagePlus,
  Layers,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Share2,
  Trash2,
  Upload,
  X
} from 'lucide-vue-next'

const props = defineProps({
  open: { type: String, default: '' },
  state: { type: Object, required: true },
  sections: { type: Array, required: true },
  themes: { type: Object, required: true },
  fonts: { type: Array, required: true },
  bgImageUrl: { type: String, default: '' },
  musicPlaying: { type: Boolean, default: false },
  qrisUrl: { type: String, default: '' },
  urls: { type: Object, default: () => ({}) },
  shareGuestName: { type: String, default: '' },
  shareWaNumber: { type: String, default: '' },
  generatedShareLink: { type: String, default: '' }
})

const emit = defineEmits([
  'close',
  'change-preset',
  'theme-change',
  'set-bg-image',
  'remove-bg-image',
  'set-music',
  'remove-music',
  'toggle-music',
  'add-images',
  'remove-image',
  'set-qris-image',
  'remove-qris-image',
  'copy-link',
  'send-share-wa',
  'reset-section',
  'show-toast',
  'update:shareGuestName',
  'update:shareWaNumber'
])

// Live Preview Docked Mode (STU-03)
const isDocked = ref(false)

// Duplicate item helpers (STU-04)
function duplicateStoryItem(index) {
  const item = props.state.sections.story.items[index]
  if (!item) return
  props.state.sections.story.items.splice(index + 1, 0, {
    year: item.year,
    title: `${item.title} (Salinan)`,
    desc: item.desc
  })
  emit('show-toast', '📋 Momen milestone berhasil diduplikat!')
}

function duplicateFaqItem(index) {
  const item = props.state.sections.faq.items[index]
  if (!item) return
  props.state.sections.faq.items.splice(index + 1, 0, {
    q: `${item.q} (Salinan)`,
    a: item.a
  })
  emit('show-toast', '📋 Pertanyaan FAQ berhasil diduplikat!')
}

function duplicateWishItem(index) {
  const item = props.state.sections.guestbook.items[index]
  if (!item) return
  props.state.sections.guestbook.items.splice(index + 1, 0, {
    name: `${item.name} (Salinan)`,
    message: item.message,
    date: 'Baru saja'
  })
  emit('show-toast', '📋 Doa ucapan berhasil diduplikat!')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      :class="['modal-overlay', { 'modal-overlay-docked': isDocked }]"
      @click.self="!isDocked && $emit('close')"
    >
      <div :class="['modal-box', { 'modal-box-docked': isDocked }]">
        <div class="modal-header">
          <div style="display:flex;align-items:center;gap:.55rem;min-width:0">
            <Settings2 v-if="open === 'general'" style="width:18px;height:18px;color:#a85270;flex-shrink:0" />
            <Share2 v-else-if="open === 'share'" style="width:18px;height:18px;color:#0284c7;flex-shrink:0" />
            <Layers v-else style="width:18px;height:18px;color:#a85270;flex-shrink:0" />
            <h2 class="modal-title-text">
              {{
                open === 'general'
                  ? 'Pengaturan Utama'
                  : open === 'share'
                    ? 'Bagikan & Link Tamu'
                    : `Edit ${sections.find(x => x[0] === open)?.[1] || ''}`
              }}
            </h2>
          </div>

          <div class="modal-header-actions">
            <!-- Reset Section Button (STU-04) -->
            <button
              v-if="open !== 'share'"
              type="button"
              class="modal-action-pill"
              title="Kembalikan section ini ke teks default preset"
              @click="$emit('reset-section', open)"
            >
              <RotateCcw style="width:12px;height:12px;vertical-align:-1px;margin-right:3px" />
              Reset
            </button>

            <!-- Docked Live Preview Switcher (STU-03) -->
            <button
              type="button"
              :class="['modal-mode-btn', { active: isDocked }]"
              :title="isDocked ? 'Beralih ke Mode Tengah (Fokus)' : 'Beralih ke Mode Samping (Live Preview)'"
              @click="isDocked = !isDocked"
            >
              <Columns2 style="width:13px;height:13px;vertical-align:-1px;margin-right:3px" />
              <span>{{ isDocked ? 'Tengah' : 'Live' }}</span>
            </button>

            <button class="modal-close" title="Tutup modal" @click="$emit('close')"><X /></button>
          </div>
        </div>

        <div class="modal-body">
          <!-- Share & WhatsApp Generator Modal (FTR-02) -->
          <template v-if="open === 'share'">
            <div class="modal-section-group">
              <h3 class="modal-group-title">Bagikan &amp; Generator Link Tamu (WhatsApp)</h3>
              <p style="font-size:.84rem;color:#64748b;line-height:1.5;margin-bottom:1rem">
                Kirimkan undangan dengan tautan personalisasi untuk setiap tamu. Saat tautan dibuka, nama tamu langsung menyapa di Cover Undangan dan pesan personal.
              </p>

              <label for="share-guest">Nama Tamu Undangan</label>
              <input
                id="share-guest"
                :value="shareGuestName"
                placeholder="Contoh: Bpk. Joko Widodo & Rekan"
                @input="$emit('update:shareGuestName', $event.target.value)"
              >

              <label for="share-wa">Nomor WhatsApp Penerima (opsional)</label>
              <input
                id="share-wa"
                :value="shareWaNumber"
                placeholder="Contoh: 08123456789 atau 628123456789"
                @input="$emit('update:shareWaNumber', $event.target.value)"
              >

              <label>Tautan Undangan Khusus Tamu</label>
              <div style="display:flex;gap:.5rem;margin-bottom:1rem">
                <input readonly :value="generatedShareLink" style="background:#f8fafc;font-size:.85rem;flex:1">
                <button class="copy-acc-btn" @click="$emit('copy-link')">
                  <Copy style="width:14px;height:14px;vertical-align:-2px;margin-right:4px" /> Salin Link
                </button>
              </div>

              <button class="share-wa-submit-btn" @click="$emit('send-share-wa')">
                <Share2 style="width:16px;height:16px;vertical-align:-2px;margin-right:6px" /> Kirim Undangan via WhatsApp
              </button>
            </div>
          </template>

          <!-- General Settings (Preset, Title, Theme, Background, Particles, Music, Cover) -->
          <template v-if="open === 'general'">
            <div class="modal-section-group">
              <h3 class="modal-group-title">Cover Amplop "Buka Undangan" (FTR-01)</h3>
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.75rem">
                <input
                  id="enable-cover"
                  v-model="state.meta.enable_cover"
                  type="checkbox"
                  style="width:18px;height:18px;accent-color:#a85270"
                >
                <label for="enable-cover" style="margin:0;cursor:pointer;font-weight:600">
                  Aktifkan Layar Pembuka / Amplop "Buka Undangan"
                </label>
              </div>

              <template v-if="state.meta.enable_cover">
                <label for="cover-kicker">Teks Pengantar / Kicker Cover</label>
                <input id="cover-kicker" v-model="state.meta.cover_kicker" placeholder="Kepada Yth. Tamu Undangan:">

                <label for="cover-sub">Pesan Singkat Cover</label>
                <input id="cover-sub" v-model="state.meta.cover_subtitle" placeholder="Kami mengundang Anda untuk merayakan momen bahagia kami.">

                <label for="cover-sim">Simulasi Nama Tamu di Editor Preview</label>
                <input id="cover-sim" v-model="state.meta.simulated_guest" placeholder="Contoh: Sahabat Tercinta">
              </template>
            </div>

            <div class="modal-section-group">
              <h3 class="modal-group-title">Preset &amp; Judul</h3>
              <label for="preset">Mulai dari preset</label>
              <select id="preset" v-model="state.meta.preset" @change="$emit('change-preset')">
                <option value="invitation">Undangan digital (Pernikahan)</option>
                <option value="ramadhan">Hari Raya &amp; Idul Fitri (Ramadhan)</option>
                <option value="birthday">Ulang Tahun &amp; Milestones (Sweet 17)</option>
                <option value="greeting">Kartu ucapan personal</option>
                <option value="landing">Landing page kreatif</option>
              </select>

              <label for="site-title">Judul / nama utama</label>
              <input id="site-title" v-model="state.sections.hero.title">
            </div>

            <div class="modal-section-group">
              <h3 class="modal-group-title">Tema &amp; Tampilan</h3>
              <label for="theme-select">Tema Desain</label>
              <select id="theme-select" v-model="state.meta.theme_id" @change="$emit('theme-change')">
                <option v-for="(label, key) in themes" :key="key" :value="key">{{ label }}</option>
              </select>

              <label for="accent">Warna brand / aksen</label>
              <input id="accent" v-model="state.meta.primary_color" type="color">

              <label for="font-select">Font</label>
              <select id="font-select" v-model="state.meta.font_family">
                <option v-for="f in fonts" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
              </select>

              <label for="bg-color">Warna background</label>
              <input id="bg-color" v-model="state.meta.bg_color" type="color">

              <label class="upload" for="bg-upload">
                <Upload /> {{ state.meta.bg_image_name || 'Upload background image' }}
              </label>
              <input id="bg-upload" class="sr" type="file" accept="image/*" @change="$emit('set-bg-image', $event)">
              <div v-if="state.meta.bg_image_name" class="bg-preview">
                <img v-if="bgImageUrl" :src="bgImageUrl" alt="Background preview">
                <button class="remove-bg" @click="$emit('remove-bg-image')"><Trash2 /> Hapus background</button>
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
              <input id="music" class="sr" type="file" accept="audio/*" @change="$emit('set-music', $event)">
              <div v-if="state.music.file_name" class="music-controls">
                <button class="music-btn" :title="musicPlaying ? 'Pause' : 'Play'" @click="$emit('toggle-music')">
                  <Pause v-if="musicPlaying" />
                  <Play v-else />
                  {{ musicPlaying ? 'Pause' : 'Preview' }}
                </button>
                <button class="remove-bg" @click="$emit('remove-music')"><Trash2 /> Hapus musik</button>
              </div>
            </div>
          </template>

          <!-- Hero Section -->
          <template v-if="open === 'hero'">
            <label>Gaya Tampilan Hero (Cover Style)</label>
            <select v-model="state.sections.hero.style">
              <option value="classic">Klasik Center</option>
              <option value="monogram">Monogram Inisial Mewah</option>
              <option value="split">Modern Split / Badge</option>
              <option value="minimal">Minimalis Editorial</option>
            </select>

            <template v-if="state.sections.hero.style === 'monogram'">
              <label>Inisial Monogram (opsional, kosongkan untuk otomatis dari judul)</label>
              <input v-model="state.sections.hero.monogram" placeholder="Contoh: N & A atau AY">
            </template>

            <label>Eyebrow / Kicker</label><input v-model="state.sections.hero.kicker">
            <label>Judul</label><input v-model="state.sections.hero.title">
            <label>Subjudul</label><textarea v-model="state.sections.hero.subtitle" rows="3"></textarea>
            <label>Label Tombol CTA</label><input v-model="state.sections.hero.cta">
          </template>

          <!-- Event Section -->
          <template v-if="open === 'event'">
            <label>Label section</label><input v-model="state.sections.event.label">
            <label>Tanggal &amp; waktu</label><input v-model="state.sections.event.date" type="datetime-local">
            <label>Venue</label><input v-model="state.sections.event.venue">
            <label>Alamat</label><textarea v-model="state.sections.event.address" rows="2"></textarea>
            <div style="display:flex;align-items:center;gap:.6rem;margin-top:.75rem">
              <input
                id="event-cal-toggle"
                v-model="state.sections.event.enable_calendar"
                type="checkbox"
                style="width:18px;height:18px;accent-color:#a85270"
              >
              <label for="event-cal-toggle" style="margin:0;cursor:pointer;font-weight:600">
                Tampilkan tombol 'Simpan ke Google Calendar' (FTR-04)
              </label>
            </div>
          </template>

          <!-- Countdown Section -->
          <template v-if="open === 'countdown'">
            <label>Label</label><input v-model="state.sections.countdown.label">
          </template>

          <!-- Story Section (with STU-04 duplicate item) -->
          <template v-if="open === 'story'">
            <label>Judul Section</label><input v-model="state.sections.story.title">

            <label>Format Tampilan Cerita</label>
            <select v-model="state.sections.story.mode">
              <option value="text">Paragraf Narasi</option>
              <option value="timeline">Timeline Milestone (Garis Waktu)</option>
            </select>

            <template v-if="state.sections.story.mode !== 'timeline'">
              <label>Isi Cerita</label><textarea v-model="state.sections.story.body" rows="5"></textarea>
            </template>

            <template v-else>
              <label>Daftar Momen &amp; Perjalanan Milestone</label>
              <div v-for="(item, i) in state.sections.story.items" :key="i" class="timeline-editor-item">
                <div class="timeline-editor-header">
                  <span class="timeline-step-badge">Momen {{ i + 1 }}</span>
                  <div style="display:flex;gap:.35rem">
                    <button class="remove-bg" style="color:#0284c7" title="Duplikat momen ini (STU-04)" @click="duplicateStoryItem(i)">
                      <CopyPlus style="width:13px;height:13px;vertical-align:-2px" /> Duplikat
                    </button>
                    <button
                      v-if="state.sections.story.items.length > 1"
                      class="remove-bg"
                      @click="state.sections.story.items.splice(i, 1)"
                    >
                      <Trash2 /> Hapus
                    </button>
                  </div>
                </div>
                <div class="timeline-row">
                  <div>
                    <label>Tahun / Waktu</label>
                    <input v-model="item.year" placeholder="Contoh: 2021">
                  </div>
                  <div>
                    <label>Judul Momen</label>
                    <input v-model="item.title" placeholder="Contoh: Pertama Kali Bertemu">
                  </div>
                </div>
                <label>Keterangan / Kisah Singkat</label>
                <textarea v-model="item.desc" rows="2" placeholder="Ceritakan kisah momen ini..."></textarea>
              </div>
              <button
                class="add-btn"
                @click="state.sections.story.items.push({ year: '', title: '', desc: '' })"
              >
                <Plus /> Tambah Momen Milestone
              </button>
            </template>
          </template>

          <!-- Gallery Section -->
          <template v-if="open === 'gallery'">
            <label class="upload" for="photos"><ImagePlus /> Tambah foto</label>
            <input id="photos" class="sr" type="file" accept="image/*" multiple @change="$emit('add-images', $event)">
            <div v-for="(p, i) in state.gallery" :key="p.id" class="asset">
              <img v-if="urls[p.id]" :src="urls[p.id]" alt="">
              <input v-model="p.caption" placeholder="Caption">
              <button @click="$emit('remove-image', i)"><Trash2 /></button>
            </div>
          </template>

          <!-- RSVP Section (FTR-05) -->
          <template v-if="open === 'rsvp'">
            <label>Judul</label><input v-model="state.sections.rsvp.title">
            <label>Catatan</label><textarea v-model="state.sections.rsvp.note" rows="3"></textarea>
            <label>Nomor WhatsApp Panitia / Penerima Konfirmasi (format internasional)</label>
            <input v-model="state.sections.rsvp.wa_number" placeholder="Contoh: 6281234567890">
            <div style="display:flex;align-items:center;gap:.6rem;margin-top:.75rem">
              <input
                id="rsvp-wa-toggle"
                v-model="state.sections.rsvp.enable_wa"
                type="checkbox"
                style="width:18px;height:18px;accent-color:#a85270"
              >
              <label for="rsvp-wa-toggle" style="margin:0;cursor:pointer;font-weight:600">
                Aktifkan tombol Konfirmasi via WhatsApp
              </label>
            </div>
          </template>

          <!-- Guestbook Section (FTR-07 with STU-04 duplicate item) -->
          <template v-if="open === 'guestbook'">
            <label>Judul Section</label><input v-model="state.sections.guestbook.title">
            <label>Catatan / Subjudul</label><textarea v-model="state.sections.guestbook.note" rows="2"></textarea>
            <div class="modal-section-group" style="margin-top:1rem">
              <h3 class="modal-group-title">Daftar Doa &amp; Ucapan Tamu ({{ state.sections.guestbook.items?.length || 0 }})</h3>
              <div v-for="(w, i) in (state.sections.guestbook.items || [])" :key="i" class="timeline-editor-item" style="padding:.75rem">
                <div class="timeline-editor-header">
                  <strong>{{ w.name }}</strong>
                  <div style="display:flex;gap:.35rem">
                    <button class="remove-bg" style="color:#0284c7" title="Duplikat ucapan ini (STU-04)" @click="duplicateWishItem(i)">
                      <CopyPlus style="width:13px;height:13px;vertical-align:-2px" /> Duplikat
                    </button>
                    <button class="remove-bg" @click="state.sections.guestbook.items.splice(i, 1)"><Trash2 /> Hapus</button>
                  </div>
                </div>
                <p style="margin:.25rem 0;font-size:.88rem;color:#475569">{{ w.message }}</p>
                <small style="color:#94a3b8;font-size:.75rem">{{ w.date }}</small>
              </div>
              <p v-if="!state.sections.guestbook.items?.length" class="muted">
                Belum ada ucapan. Tamu dapat mengirim doa lewat preview atau website hasil export.
              </p>
            </div>
          </template>

          <!-- Gift Section (FTR-03) -->
          <template v-if="open === 'gift'">
            <label>Judul</label><input v-model="state.sections.gift.title">
            <label>Catatan</label><textarea v-model="state.sections.gift.note" rows="3"></textarea>
            <label>Nomor Rekening &amp; Bank</label><input v-model="state.sections.gift.bank" placeholder="BCA - 1234567890">
            <label>Nama Pemilik Rekening</label><input v-model="state.sections.gift.holder">

            <div class="modal-section-group" style="margin-top:1.25rem">
              <h3 class="modal-group-title">Foto / QR Code QRIS (Opsional)</h3>
              <label class="upload" for="qris-upload">
                <Upload /> {{ state.sections.gift.qris_image_name || 'Upload Gambar QRIS' }}
              </label>
              <input id="qris-upload" class="sr" type="file" accept="image/*" @change="$emit('set-qris-image', $event)">
              <div v-if="state.sections.gift.qris_image_name" class="bg-preview" style="margin-top:.75rem">
                <img v-if="qrisUrl" :src="qrisUrl" alt="QRIS preview" style="max-height:140px;object-fit:contain;background:#fff;padding:6px;border-radius:8px">
                <button class="remove-bg" @click="$emit('remove-qris-image')"><Trash2 /> Hapus QRIS</button>
              </div>
            </div>
          </template>

          <!-- FAQ Section (with STU-04 duplicate item) -->
          <template v-if="open === 'faq'">
            <label>Judul</label><input v-model="state.sections.faq.title">
            <label>Dress code</label><input v-model="state.sections.faq.dress">
            <div v-for="(item, i) in state.sections.faq.items" :key="i" class="faq-item">
              <label>Pertanyaan {{ i + 1 }}</label>
              <input v-model="item.q">
              <label>Jawaban</label>
              <textarea v-model="item.a" rows="2"></textarea>
              <div style="display:flex;gap:.35rem;margin-top:.5rem">
                <button class="remove-bg" style="color:#0284c7" title="Duplikat pertanyaan ini (STU-04)" @click="duplicateFaqItem(i)">
                  <CopyPlus style="width:13px;height:13px;vertical-align:-2px" /> Duplikat
                </button>
                <button
                  v-if="state.sections.faq.items.length > 1"
                  class="remove-bg"
                  @click="state.sections.faq.items.splice(i, 1)"
                >
                  <Trash2 /> Hapus
                </button>
              </div>
            </div>
            <button class="add-btn" @click="state.sections.faq.items.push({ q: '', a: '' })">
              <Plus /> Tambah pertanyaan
            </button>
          </template>

          <!-- Map Section -->
          <template v-if="open === 'map'">
            <label>Judul</label><input v-model="state.sections.map.title">
            <label>URL Google Maps</label><input v-model="state.sections.map.url" type="url">
            <label>Label tombol</label><input v-model="state.sections.map.label">
          </template>
        </div>

        <div class="modal-footer">
          <button class="modal-done-btn" @click="$emit('close')">Selesai &amp; Tinjau Preview</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-title-text {
  font-size: 1rem;
  font-weight: 700;
  color: #2e2026;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.modal-action-pill {
  background: #fdf2f4;
  color: #a85270;
  border: 1px solid #ebdbe0;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}

.modal-action-pill:hover {
  background: #fbe5ea;
  border-color: #d8b8c2;
}

.modal-mode-btn {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}

.modal-mode-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-mode-btn.active {
  background: #e0f2fe;
  color: #0284c7;
  border-color: #bae6fd;
}

/* Docked Live Preview Mode (STU-03) */
.modal-overlay-docked {
  background: rgba(15, 23, 42, 0.05) !important;
  pointer-events: none !important;
  justify-content: flex-end !important;
  padding: 1.25rem 1.75rem !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.modal-box-docked {
  pointer-events: auto !important;
  width: 480px !important;
  max-width: 90vw !important;
  height: 94vh !important;
  max-height: 94vh !important;
  margin: 0 !important;
  box-shadow: -12px 0 35px rgba(0, 0, 0, 0.16) !important;
}
</style>
