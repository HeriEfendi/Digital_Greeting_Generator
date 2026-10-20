<script setup>
import { ref } from 'vue'
import {
  CheckCircle2,
  Copy,
  Edit3,
  FolderKanban,
  PlusCircle,
  Trash2,
  X
} from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
  activeId: { type: String, default: '' },
})

const emit = defineEmits([
  'close',
  'select-project',
  'create-project',
  'duplicate-project',
  'rename-project',
  'delete-project'
])

const showCreateForm = ref(false)
const newTitle = ref('')
const newPreset = ref('invitation')

const editingId = ref('')
const editTitle = ref('')

function startCreate() {
  newTitle.value = ''
  newPreset.value = 'invitation'
  showCreateForm.value = true
}

function submitCreate() {
  emit('create-project', {
    preset: newPreset.value,
    title: newTitle.value.trim() || 'Undangan Baru'
  })
  showCreateForm.value = false
}

function startRename(proj) {
  editingId.value = proj.id
  editTitle.value = proj.name || 'Proyek Tanpa Judul'
}

function submitRename(id) {
  if (editTitle.value.trim()) {
    emit('rename-project', id, editTitle.value.trim())
  }
  editingId.value = ''
}

function formatDate(timestamp) {
  if (!timestamp) return 'Baru saja'
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return 'Baru saja'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box project-modal-box">
        <div class="modal-header">
          <h2>
            <FolderKanban style="width:20px;height:20px;color:#a85270" />
            Kelola Draft &amp; Proyek Undangan (Dexie)
          </h2>
          <button class="modal-close" title="Tutup" @click="$emit('close')"><X /></button>
        </div>

        <div class="modal-body project-modal-body">
          <div class="project-header-actions">
            <p class="project-intro-text">
              Semua draft disimpan otomatis di browser (IndexedDB). Anda dapat membuat beberapa undangan berbeda dan beralih kapan saja.
            </p>
            <button v-if="!showCreateForm" class="add-project-btn" @click="startCreate">
              <PlusCircle style="width:16px;height:16px;vertical-align:-2px;margin-right:6px" /> Buat Undangan Baru
            </button>
          </div>

          <!-- Create New Project Form -->
          <div v-if="showCreateForm" class="create-project-card">
            <h4 style="margin:0 0 .75rem;font-size:.95rem;color:#a85270">Buat Undangan / Kartu Baru</h4>
            <label>Judul Proyek</label>
            <input v-model="newTitle" placeholder="Contoh: Undangan Pernikahan Rian & Sinta" autofocus>

            <label>Pilih Preset Desain Awal</label>
            <select v-model="newPreset">
              <option value="invitation">Undangan Pernikahan (Romantic)</option>
              <option value="ramadhan">Hari Raya &amp; Idul Fitri (Botanical)</option>
              <option value="birthday">Ulang Tahun &amp; Milestones (Playful)</option>
              <option value="greeting">Kartu Ucapan Personal (Minimalist)</option>
              <option value="landing">Landing Page Kreatif (Minimalist)</option>
            </select>

            <div style="display:flex;gap:.5rem;margin-top:1rem;justify-content:flex-end">
              <button class="remove-bg" @click="showCreateForm = false">Batal</button>
              <button class="primary-btn" @click="submitCreate">Buat &amp; Buka Editor</button>
            </div>
          </div>

          <!-- List of Projects -->
          <div class="projects-list">
            <div
              v-for="p in projects"
              :key="p.id"
              :class="['project-item-card', { active: p.id === activeId }]"
            >
              <div class="project-item-info">
                <!-- Inline Rename Form -->
                <div v-if="editingId === p.id" style="display:flex;gap:.5rem;align-items:center;margin-bottom:.35rem">
                  <input v-model="editTitle" style="padding:.35rem .6rem;font-size:.9rem;flex:1" @keyup.enter="submitRename(p.id)">
                  <button class="save-sm-btn" @click="submitRename(p.id)">Simpan</button>
                  <button class="remove-bg" style="padding:.35rem .6rem" @click="editingId = ''">Batal</button>
                </div>
                <div v-else class="project-title-row">
                  <strong class="project-name">{{ p.name || 'Undangan Tanpa Judul' }}</strong>
                  <span v-if="p.id === activeId" class="project-active-badge">
                    <CheckCircle2 style="width:12px;height:12px;vertical-align:-1px;margin-right:3px" /> Aktif
                  </span>
                </div>
                <div class="project-meta-row">
                  <span>Diedit: {{ formatDate(p.updatedAt) }}</span>
                  <span v-if="p.state?.meta?.theme_id" class="project-theme-tag">{{ p.state.meta.theme_id }}</span>
                </div>
              </div>

              <!-- Project Action Buttons -->
              <div class="project-item-actions">
                <button
                  v-if="p.id !== activeId"
                  class="project-action-btn btn-open"
                  title="Buka proyek ini"
                  @click="$emit('select-project', p.id)"
                >
                  Buka
                </button>
                <button
                  class="project-action-btn"
                  title="Ganti nama proyek"
                  @click="startRename(p)"
                >
                  <Edit3 style="width:14px;height:14px" />
                </button>
                <button
                  class="project-action-btn"
                  title="Duplikat proyek ini"
                  @click="$emit('duplicate-project', p.id)"
                >
                  <Copy style="width:14px;height:14px" />
                </button>
                <button
                  v-if="projects.length > 1"
                  class="project-action-btn btn-delete"
                  title="Hapus proyek ini"
                  @click="$emit('delete-project', p.id)"
                >
                  <Trash2 style="width:14px;height:14px" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-done-btn" @click="$emit('close')">Tutup</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.project-modal-box {
  max-width: 620px;
}

.project-modal-body {
  padding: 1.4rem;
  max-height: 75vh;
}

.project-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.project-intro-text {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
  flex: 1;
  min-width: 220px;
  line-height: 1.45;
}

.add-project-btn {
  background: linear-gradient(135deg, #a85270, #c0637e);
  color: #ffffff;
  border: 0;
  border-radius: 999px;
  padding: 0.55rem 1.15rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(168, 82, 112, 0.25);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.add-project-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(168, 82, 112, 0.35);
}

.create-project-card {
  background: #fdf5f7;
  border: 1px solid #ebdbe0;
  border-radius: 0.85rem;
  padding: 1.15rem;
  margin-bottom: 1.25rem;
  animation: modalFadeIn 0.2s ease-out;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.project-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.15rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  transition: all 0.15s ease;
}

.project-item-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.project-item-card.active {
  border-color: #a85270;
  background: #fffafb;
  box-shadow: 0 4px 16px rgba(168, 82, 112, 0.12);
}

.project-item-info {
  flex: 1;
  min-width: 0;
}

.project-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.25rem;
}

.project-name {
  font-size: 0.95rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-active-badge {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.project-meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.project-theme-tag {
  background: #f1f5f9;
  color: #475569;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-weight: 600;
  text-transform: capitalize;
}

.project-item-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.project-action-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  width: 32px;
  height: 32px;
  display: grid;
  place-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-action-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.project-action-btn.btn-open {
  width: auto;
  padding: 0 0.85rem;
  background: #a85270;
  color: #ffffff;
  border-color: #a85270;
  font-weight: 700;
  font-size: 0.8rem;
}

.project-action-btn.btn-open:hover {
  background: #8e435d;
}

.project-action-btn.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

.save-sm-btn {
  background: #a85270;
  color: #ffffff;
  border: 0;
  padding: 0.35rem 0.75rem;
  border-radius: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
