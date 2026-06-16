<template>
  <div class="history">
    <div class="container">
      <div class="page-header">
      <h1>播放历史</h1>
      <div class="header-right">
        <span class="total-info">共 {{ total }} 条记录</span>
        <button v-if="history.length > 0" @click="clearAll" class="btn btn-secondary">
          清空全部
        </button>
      </div>
    </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="empty error">
        <p>{{ error }}</p>
        <router-link to="/login" class="btn btn-primary">去登录</router-link>
      </div>
      <div v-else-if="history.length === 0" class="empty">
        <p>暂无播放记录</p>
        <router-link to="/videos" class="btn btn-primary">去逛逛</router-link>
      </div>
      <div v-else class="video-grid">
        <div v-for="item in history" :key="item.id" class="video-card">
          <router-link :to="`/video/${item.video.id}`" class="video-cover">
            <img :src="item.video.cover || '/default-cover.png'" :alt="item.video.title" />
            <span v-if="item.video.duration" class="duration">
              {{ formatDuration(item.video.duration) }}
            </span>
          </router-link>
          <div class="video-info">
            <router-link :to="`/video/${item.video.id}`" class="video-title">
              {{ item.video.title }}
            </router-link>
            <div class="video-meta">
              <router-link :to="`/user/${item.video.user.id}`" class="author">
                {{ item.video.user.nickname || item.video.user.username }}
              </router-link>
              <span class="watch-time">观看于 {{ formatTime(item.watchedAt) }}</span>
            </div>
          </div>
          <button @click="removeHistory(item.id)" class="remove-btn" title="删除记录">
            ×
          </button>
        </div>
      </div>

      <div v-if="total > limit" class="pagination">
        <button
          @click="page = 1; fetchHistory()"
          :disabled="page <= 1"
          class="btn btn-secondary"
        >
          首页
        </button>
        <button
          @click="page--; fetchHistory()"
          :disabled="page <= 1"
          class="btn btn-secondary"
        >
          上一页
        </button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <div class="page-jump">
          <input
            type="number"
            v-model.number="jumpPage"
            min="1"
            :max="totalPages"
            class="page-input"
          />
          <button @click="goToPage" class="btn btn-primary btn-sm">跳转</button>
        </div>
        <button
          @click="page++; fetchHistory()"
          :disabled="page >= totalPages"
          class="btn btn-secondary"
        >
          下一页
        </button>
        <button
          @click="page = totalPages; fetchHistory()"
          :disabled="page >= totalPages"
          class="btn btn-secondary"
        >
          末页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { watchHistoryApi } from '../api'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

interface WatchHistoryItem {
  id: number
  videoId: number
  watchedAt: string
  progress: number
  video: {
    id: number
    title: string
    cover: string | undefined
    duration: number
    user: {
      id: number
      username: string
      nickname: string | undefined
      avatar: string | undefined
    }
  }
}

const userStore = useUserStore()
const router = useRouter()
const history = ref<WatchHistoryItem[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const total = ref(0)
const jumpPage = ref(1)
const error = ref('')

const totalPages = computed(() => Math.ceil(total.value / limit))

const fetchHistory = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    const res = await watchHistoryApi.getHistory(page.value, limit)
    const data = res.data
    history.value = (data?.items as WatchHistoryItem[]) || []
    total.value = data?.total || 0
  } catch (err: any) {
    console.error('获取播放记录失败', err)
    error.value = err.message || '获取播放记录失败'
    if (err.message === '未登录') {
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
  } finally {
    loading.value = false
  }
}

const removeHistory = async (id: number) => {
  try {
    await watchHistoryApi.deleteHistory(id)
    history.value = history.value.filter(item => item.id !== id)
  } catch (err) {
    console.error('删除失败', err)
  }
}

const clearAll = async () => {
  if (!confirm('确定要清空所有播放记录吗？')) return
  try {
    await watchHistoryApi.clearHistory()
    history.value = []
    total.value = 0
    page.value = 1
  } catch (err) {
    console.error('清空失败', err)
  }
}

const goToPage = () => {
  const targetPage = Math.max(1, Math.min(jumpPage.value, totalPages.value))
  if (targetPage !== page.value) {
    page.value = targetPage
    fetchHistory()
  }
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.total-info {
  color: #666;
  font-size: 0.875rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
}

.empty p {
  color: #666;
  margin-bottom: 1rem;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.video-card {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-cover {
  position: relative;
  display: block;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.video-info {
  padding: 0.75rem;
}

.video-title {
  display: block;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-title:hover {
  color: var(--primary-color);
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.author {
  color: #666;
  text-decoration: none;
}

.author:hover {
  color: var(--primary-color);
}

.watch-time {
  color: #999;
  font-size: 0.75rem;
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.video-card:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.8);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.page-info {
  color: #666;
  min-width: 100px;
  text-align: center;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-input {
  width: 60px;
  padding: 0.375rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  text-align: center;
}

.page-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>
