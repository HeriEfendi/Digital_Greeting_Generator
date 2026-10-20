<script setup>
import { ChevronDown, ChevronUp, Layers, Settings2, Share2 } from 'lucide-vue-next'

defineProps({
  sections: { type: Array, required: true },
  state: { type: Object, required: true },
})

defineEmits(['open-modal', 'move-section'])
</script>

<template>
  <aside>
    <p class="eyebrow">SITE BUILDER</p>
    <h1>One editor.<br><em>Many moments.</em></h1>
    <p class="intro">Atur dan sesuaikan setiap section melalui modal editor.</p>

    <!-- ===== Sections List ===== -->
    <fieldset class="sections">
      <legend><Layers style="width:14px;height:14px;vertical-align:-2px" /> Sections</legend>

      <!-- Preset, Tema & Musik (Pengaturan Utama) -->
      <div class="section-row section-row-preset" @click="$emit('open-modal', 'general')">
        <span class="section-preset-icon"><Settings2 /></span>
        <span class="section-preset-label">Pengaturan Utama &amp; Musik</span>
        <span></span>
        <span></span>
        <button class="edit" @click.stop="$emit('open-modal', 'general')">Edit</button>
      </div>

      <!-- Bagikan Undangan & Generator Link Tamu (FTR-02) -->
      <div class="section-row section-row-share" @click="$emit('open-modal', 'share')">
        <span class="section-preset-icon" style="background:#e0f2fe;color:#0284c7"><Share2 /></span>
        <span class="section-preset-label">Bagikan &amp; Link WhatsApp Tamu</span>
        <span></span>
        <span></span>
        <button class="edit" @click.stop="$emit('open-modal', 'share')">Buka</button>
      </div>

      <!-- Reorderable content sections -->
      <div v-for="([id, label], i) in sections" :key="id" class="section-row">
        <input :id="`section-${id}`" v-model="state.sections[id].on" type="checkbox">
        <label :for="`section-${id}`">{{ label }}</label>
        <button :disabled="!i" :aria-label="`Naikkan ${label}`" @click="$emit('move-section', id, -1)">
          <ChevronUp />
        </button>
        <button :disabled="i === sections.length - 1" :aria-label="`Turunkan ${label}`" @click="$emit('move-section', id, 1)">
          <ChevronDown />
        </button>
        <button class="edit" @click="$emit('open-modal', id)">Edit</button>
      </div>
    </fieldset>
  </aside>
</template>
