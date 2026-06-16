<template>
  <div class="upload">
    <div class="container">
      <h1 class="page-title">上传视频</h1>
      <form @submit.prevent="handleSubmit" class="upload-form">
        <div class="form-group">
          <label>视频标题 *</label>
          <input v-model="form.title" type="text" required />
        </div>
        <div class="form-group">
          <label>视频描述</label>
          <textarea v-model="form.description"></textarea>
        </div>
        <div class="form-group">
          <label>选择视频 *</label>
          <div class="file-input-wrapper">
            <input
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              @change="handleVideoChange"
              ref="videoInputRef"
            />
            <div v-if="videoFile" class="file-info">
            <span>{{ videoFile.name }}</span>
            <span class="file-size">{{ formatFileSize(videoFile.size) }}</span>
            <span v-if="form.duration > 0" class="file-duration">时长: {{ formatDuration(form.duration) }}</span>
          </div>
            <div v-else class="file-tip">点击选择视频文件 (支持 mp4, webm, ogg, mov)</div>
          </div>
          <div v-if="uploadingVideo" class="upload-progress">
            <div class="progress-bar">
              <div class="progress" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <span>上传中... {{ uploadProgress }}%</span>
          </div>
        </div>
        <div class="form-group">
          <label>封面图</label>
          <div class="cover-upload">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              @change="handleCoverChange"
              ref="coverInputRef"
            />
            <div v-if="coverPreview" class="cover-preview">
              <img :src="coverPreview" alt="封面预览" />
            </div>
            <div v-else class="cover-placeholder">
              点击选择封面图片
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>时长（秒）</label>
          <input v-model.number="form.duration" type="number" />
        </div>
        <div class="form-group">
          <label>分类</label>
          <select v-model="form.category">
            <option value="">请选择</option>
            <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
              {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>标签（最多选择8个）</label>
          <div class="tags-selector">
            <button
              v-for="tag in presetTags"
              :key="tag"
              type="button"
              @click="toggleTag(tag)"
              :class="['tag-btn', selectedTags.includes(tag) ? 'active' : '']"
            >
              {{ tag }}
            </button>
            <button type="button" class="tag-btn custom-tag-btn" @click="showAddTag = true">
              + 自定义标签
            </button>
          </div>
          <p v-if="selectedTags.length > 0" class="selected-count">
            已选择 {{ selectedTags.length }} / 8 个标签
          </p>
          <div v-if="showAddTag" class="custom-tag-input">
            <input
              v-model="newTagInput"
              type="text"
              placeholder="输入自定义标签名称"
              @keyup.enter="addCustomTag"
              ref="customTagRef"
            />
            <button type="button" @click="addCustomTag" class="btn btn-primary btn-sm">确定</button>
            <button type="button" @click="cancelAddTag" class="btn btn-secondary btn-sm">取消</button>
          </div>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <button type="submit" class="btn btn-primary" :disabled="loading || !form.url">
          {{ loading ? '提交中...' : '发布' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore } from '../stores/video'
import { uploadApi } from '../api'
import axios from 'axios'

const router = useRouter()
const videoStore = useVideoStore()

interface Category {
  id: number
  name: string
  slug: string
}

const categories = ref<Category[]>([])

// 预设标签列表
const presetTags = [
  '搞笑', '音乐', '美食', '科技', '教育', '游戏', '旅行', '运动',
  '电影', '动画', '萌宠', '时尚', '汽车', '手工', '摄影', '舞蹈',
  '翻唱', '脱口秀', '纪录片', 'Vlog', '教程', '评测', '直播', '挑战'
]

const selectedTags = ref<string[]>([])
const showAddTag = ref(false)
const newTagInput = ref('')
const customTagRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  title: '',
  description: '',
  url: '',
  cover: '',
  duration: 0,
  category: ''
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/categories')
    categories.value = res.data.data
  } catch (err) {
    console.error('获取分类失败', err)
  }
}

const loading = ref(false)
const error = ref('')
const uploadingVideo = ref(false)
const uploadProgress = ref(0)
const videoFile = ref<File | null>(null)
const coverPreview = ref('')
const coverFile = ref<File | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)

// 标签选择逻辑
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else if (selectedTags.value.length < 8) {
    selectedTags.value.push(tag)
  } else {
    error.value = '最多只能选择8个标签'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

const addCustomTag = () => {
  const tag = newTagInput.value.trim()
  if (!tag) {
    showAddTag.value = false
    return
  }
  if (selectedTags.value.includes(tag)) {
    error.value = '该标签已选择'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  if (selectedTags.value.length >= 8) {
    error.value = '最多只能选择8个标签'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  selectedTags.value.push(tag)
  newTagInput.value = ''
  showAddTag.value = false
}

const cancelAddTag = () => {
  newTagInput.value = ''
  showAddTag.value = false
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      resolve(0)
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

const captureVideoFrame = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    
    video.onloadedmetadata = async () => {
      try {
        const randomTime = Math.random() * Math.min(video.duration, 10)
        video.currentTime = randomTime
        
        const seekPromise = new Promise<void>((res) => {
          video.onseeked = () => res()
          video.onerror = () => res()
        })
        
        await seekPromise
        
        const canvas = document.createElement('canvas')
        canvas.width = 1280
        canvas.height = 720
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建画布'))
          return
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(frameDataUrl)
        URL.revokeObjectURL(video.src)
      } catch (err) {
        reject(err)
        URL.revokeObjectURL(video.src)
      }
    }
    
    video.onerror = () => {
      reject(new Error('无法加载视频'))
      URL.revokeObjectURL(video.src)
    }
    
    video.src = URL.createObjectURL(file)
  })
}

const dataUrlToBlob = (dataUrl: string): Blob => {
  const byteString = atob(dataUrl.split(',')[1])
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeString })
}

const handleVideoChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  videoFile.value = file
  uploadingVideo.value = true
  uploadProgress.value = 0
  error.value = ''

  try {
    const duration = await getVideoDuration(file)
    form.duration = Math.floor(duration)

    const res = await uploadApi.uploadVideo(file)
    form.url = res.data!.url
    uploadProgress.value = 100

    if (!form.cover && !coverFile.value) {
      try {
        const frameDataUrl = await captureVideoFrame(file)
        const frameBlob = dataUrlToBlob(frameDataUrl)
        const frameFile = new File([frameBlob], 'cover.jpg', { type: 'image/jpeg' })
        
        coverPreview.value = frameDataUrl
        const coverRes = await uploadApi.uploadCover(frameFile)
        form.cover = coverRes.data!.url
      } catch (coverErr) {
        console.warn('自动生成封面失败:', coverErr)
      }
    }
  } catch (err: any) {
    error.value = err.message || '视频上传失败'
    videoFile.value = null
    form.duration = 0
    if (videoInputRef.value) videoInputRef.value.value = ''
  } finally {
    uploadingVideo.value = false
  }
}

const handleCoverChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
  error.value = ''

  try {
    const res = await uploadApi.uploadCover(file)
    form.cover = res.data!.url
  } catch (err: any) {
    error.value = err.message || '封面上传失败'
    coverPreview.value = ''
    coverFile.value = null
    if (coverInputRef.value) coverInputRef.value.value = ''
  }
}

const handleSubmit = async () => {
  if (!form.title || !form.url) {
    error.value = '请填写必填项'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await videoStore.uploadVideo({
      ...form,
      tags: selectedTags.value
    })

    router.push('/')
  } catch (e: any) {
    error.value = e.message || '发布失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.upload-form {
  max-width: 600px;
}

.file-input-wrapper {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.file-input-wrapper input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file-tip {
  color: #999;
  font-size: 0.875rem;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-size, .file-duration {
  color: #666;
  font-size: 0.75rem;
}

.upload-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.cover-upload {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 16/9;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.cover-upload input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.cover-preview {
  width: 100%;
  height: 100%;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.875rem;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}

.error {
  color: var(--danger-color);
  margin-bottom: 1rem;
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

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
</style>
