<script setup>
import { onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
  gallery: { type: Array, default: () => [] },
  urls: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'next', 'prev'])

function onKeydown(e) {
  if (!props.open) return
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') emit('next')
  if (e.key === 'ArrowLeft') emit('prev')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && gallery.length"
      class="lightbox-overlay"
      @click.self="$emit('close')"
    >
      <button class="lightbox-close" title="Tutup (Esc)" @click="$emit('close')">
        <X />
      </button>

      <button
        v-if="gallery.length > 1"
        class="lightbox-nav lightbox-prev"
        title="Sebelumnya (←)"
        @click="$emit('prev')"
      >
        <ChevronLeft />
      </button>

      <div class="lightbox-content">
        <img
          :src="urls[gallery[index]?.id]"
          :alt="gallery[index]?.caption || 'Foto Galeri'"
        >
        <p v-if="gallery[index]?.caption" class="lightbox-caption">
          {{ gallery[index]?.caption }}
        </p>
        <span class="lightbox-counter">{{ index + 1 }} / {{ gallery.length }}</span>
      </div>

      <button
        v-if="gallery.length > 1"
        class="lightbox-nav lightbox-next"
        title="Selanjutnya (→)"
        @click="$emit('next')"
      >
        <ChevronRight />
      </button>
    </div>
  </Teleport>
</template>
