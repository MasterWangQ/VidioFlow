<template>
  <div class="user-videos">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="videos.length === 0" class="empty">暂无视频</div>
    <div v-else class="video-grid">
      <div v-for="video in videos" :key="video.id" class="video-card card">
        <router-link :to="`/video/${video.id}`">
          <div class="cover">
            <img :src="video.cover || '/default-cover.jpg'" :alt="video.title" />
            <span v-if="video.duration" class="duration">{{ formatDuration(video.duration) }}</span>
            <span :class="['status-badge', getStatusClass(video.status)]">{{ getStatusText(video.status) }}</span>
          </div>
          <div class="info">
            <h3 class="title">{{ video.title }}</h3>
            <p class="meta">{{ video.viewCount }} 次播放</p>
            <p v-if="video.status === -1 && video.rejectReason" class="reject-reason">
              <span class="reject-label">拒绝原因：</span>{{ video.rejectReason }}
            </p>
          </div>
        </router-link>
        <div v-if="isOwnVideos" class="actions">
          <button @click="openEditModal(video)" class="btn btn-edit">编辑</button>
          <button v-if="video.status === -1" @click="handleResubmit(video.id)" class="btn btn-resubmit">重新提交</button>
          <button @click="handleDelete(video.id)" class="btn btn-delete">删除</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <h2>编辑视频</h2>
        <div class="form-group">
          <label>标题</label>
          <input v-model="editForm.title" type="text" />
        </div>
        <div class="form-group">
          <label>简介</label>
          <textarea v-model="editForm.description"></textarea>
        </div>
        <div class="form-group">
          <label>分类</label>
          <select v-model="editForm.category">
            <option value="">选择分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>标签（最多选择8个）</label>
          <div class="tags-selector">
            <button
              v-for="tag in presetTags"
              :key="tag"
              type="button"
              @click="toggleEditTag(tag)"
              :class="['tag-btn', editForm.tags.includes(tag) ? 'active' : '']"
            >
              {{ tag }}
            </button>
            <button type="button" class="tag-btn custom-tag-btn" @click="showAddEditTag = true">
              + 自定义标签
            </button>
          </div>
          <p v-if="editForm.tags.length > 0" class="selected-count">
            已选择 {{ editForm.tags.length }} / 8 个标签
          </p>
          <div v-if="showAddEditTag" class="custom-tag-input">
            <input
              v-model="newEditTag"
              type="text"
              placeholder="输入自定义标签名称"
              @keyup.enter="addCustomEditTag"
            />
            <button type="button" @click="addCustomEditTag" class="btn btn-primary btn-sm">确定</button>
            <button type="button" @click="cancelAddEditTag" class="btn btn-secondary btn-sm">取消</button>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeEditModal" class="btn btn-secondary">取消</button>
          <button @click="submitEdit" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { userApi, videoApi } from '../api'
import { useUserStore } from '../stores/user'
import type { Video, Category } from '../types'

const route = useRoute()
const videos = ref<Video[]>([])
const loading = ref(false)
const categories = ref<Category[]>([])

const showEditModal = ref(false)
const editingVideoId = ref<number | null>(null)
const showAddEditTag = ref(false)
const newEditTag = ref('')

const presetTags = [
  '搞笑', '音乐', '美食', '科技', '教育', '游戏', '旅行', '运动',
  '电影', '动画', '萌宠', '时尚', '汽车', '手工', '摄影', '舞蹈',
  '翻唱', '脱口秀', '纪录片', 'Vlog', '教程', '评测', '直播', '挑战'
]

const editForm = reactive({
  title: '',
  description: '',
  category: '',
  tags: [] as string[]
})

const userStore = useUserStore()

const isOwnVideos = computed(() => {
  return userStore.user?.id?.toString() === route.params.id
})

const fetchVideos = async () => {
  loading.value = true
  try {
    const res = await userApi.getUserVideos(route.params.id as string)
    videos.value = res.data?.items || []
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await videoApi.getCategories()
    categories.value = res.data?.items || []
  } catch (err) {
    console.error('获取分类失败:', err)
  }
}

onMounted(() => {
  fetchVideos()
  fetchCategories()
})
watch(() => route.params.id, fetchVideos)

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const openEditModal = (video: Video) => {
  editingVideoId.value = video.id
  editForm.title = video.title || ''
  editForm.description = video.description || ''
  editForm.category = video.category || ''
  editForm.tags = video.tags ? [...video.tags] : []
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingVideoId.value = null
  showAddEditTag.value = false
  newEditTag.value = ''
}

const toggleEditTag = (tag: string) => {
  const index = editForm.tags.indexOf(tag)
  if (index > -1) {
    editForm.tags.splice(index, 1)
  } else if (editForm.tags.length < 8) {
    editForm.tags.push(tag)
  }
}

const addCustomEditTag = () => {
  const tag = newEditTag.value.trim()
  if (!tag) {
    showAddEditTag.value = false
    return
  }
  if (editForm.tags.includes(tag)) {
    return
  }
  if (editForm.tags.length >= 8) {
    return
  }
  editForm.tags.push(tag)
  newEditTag.value = ''
  showAddEditTag.value = false
}

const cancelAddEditTag = () => {
  newEditTag.value = ''
  showAddEditTag.value = false
}

const submitEdit = async () => {
  if (!editingVideoId.value) return
  
  try {
    await videoApi.updateVideo(editingVideoId.value.toString(), {
      title: editForm.title,
      description: editForm.description,
      category: editForm.category,
      tags: editForm.tags
    })
    closeEditModal()
    await fetchVideos()
  } catch (err) {
    console.error('更新视频失败:', err)
  }
}

const handleDelete = async (videoId: number) => {
  if (!confirm('确定要删除这个视频吗？')) return
  
  try {
    await videoApi.deleteVideo(videoId.toString())
    await fetchVideos()
  } catch (err) {
    console.error('删除视频失败:', err)
  }
}

const handleResubmit = async (videoId: number) => {
  if (!confirm('确定要重新提交审核吗？')) return
  
  try {
    await videoApi.resubmit(videoId)
    await fetchVideos()
  } catch (err) {
    console.error('重新提交失败:', err)
  }
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '审核中'
    case 1: return '已发布'
    case -1: return '已拒绝'
    default: return '未知'
  }
}

const getStatusClass = (status: number) => {
  switch (status) {
    case 0: return 'status-pending'
    case 1: return 'status-approved'
    case -1: return 'status-rejected'
    default: return 'status-unknown'
  }
}
</script>

<style scoped>
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.video-card a {
  display: block;
  color: inherit;
  text-decoration: none;
}

.cover {
  position: relative;
  aspect-ratio: 16/9;
  background: #000;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.info {
  padding: 1rem;
}

.title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  color: #999;
  font-size: 0.75rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.video-card {
  position: relative;
}

.actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem 1rem;
  border-top: 1px solid #eee;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-edit {
  background: var(--primary-color);
  color: #fff;
}

.btn-delete {
  background: #dc3545;
  color: #fff;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--primary-color);
  color: #fff;
}

.btn-secondary {
  background: #6c757d;
  color: #fff;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.tag-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tag-btn.active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.custom-tag-btn {
  border-style: dashed;
  color: #666;
}

.custom-tag-btn:hover {
  background: #f5f5f5;
}

.selected-count {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.custom-tag-input {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  align-items: center;
}

.custom-tag-input input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending {
  background: #ffc107;
  color: #333;
}

.status-approved {
  background: #28a745;
  color: #fff;
}

.status-rejected {
  background: #dc3545;
  color: #fff;
}

.status-unknown {
  background: #6c757d;
  color: #fff;
}

.reject-reason {
  font-size: 0.75rem;
  color: #dc3545;
  margin-top: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.reject-label {
  font-weight: 500;
}

.btn-resubmit {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  background: #ffc107;
  color: #333;
}

.btn-resubmit:hover {
  background: #e0a800;
}
</style>
