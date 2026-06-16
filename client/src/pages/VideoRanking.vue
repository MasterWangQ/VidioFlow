<template>
  <div class="ranking">
    <div class="container">
      <div class="page-header">
        <h1>排行榜</h1>
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.value"
            :class="['tab', { active: activeTab === tab.value }]"
            @click="activeTab = tab.value; page = 1; fetchTopVideos()"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="videos.length === 0" class="empty">
        <p>暂无视频</p>
      </div>
      <div v-else class="video-list">
        <div v-for="(video, index) in videos" :key="video.id" class="video-item">
          <div class="rank" :class="getRankClass(index)">
            {{ index + 1 }}
          </div>
          <router-link :to="`/video/${video.id}`" class="video-cover">
            <img :src="video.cover || '/default-cover.png'" :alt="video.title" />
            <span v-if="video.duration" class="duration">
              {{ formatDuration(video.duration) }}
            </span>
          </router-link>
          <div class="video-info">
            <router-link :to="`/video/${video.id}`" class="video-title">
              {{ video.title }}
            </router-link>
            <div class="video-meta">
              <router-link v-if="video.user" :to="`/user/${video.user.id}`" class="author">
                {{ video.user.nickname || video.user.username }}
              </router-link>
              <span class="stats">
                <span class="view-count">{{ formatNumber(video.viewCount) }} 播放</span>
                <span class="like-count">{{ formatNumber(video.likeCount) }} 点赞</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > limit" class="pagination">
        <button
          @click="page = 1; fetchTopVideos()"
          :disabled="page === 1"
          class="btn btn-outline"
        >
          首页
        </button>
        <button
          @click="page--; fetchTopVideos()"
          :disabled="page === 1"
          class="btn btn-outline"
        >
          上一页
        </button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button
          @click="page++; fetchTopVideos()"
          :disabled="page >= totalPages"
          class="btn btn-outline"
        >
          下一页
        </button>
        <button
          @click="page = totalPages; fetchTopVideos()"
          :disabled="page >= totalPages"
          class="btn btn-outline"
        >
          末页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { videoApi } from '../api'
import type { Video } from '../types'

const tabs = [
  { label: '综合排行', value: 'view' as const },
  { label: '最多点赞', value: 'like' as const },
  { label: '最新发布', value: 'new' as const }
]

const activeTab = ref<'view' | 'like' | 'new'>('view')
const videos = ref<Video[]>([])
const page = ref(1)
const limit = 20
const total = ref(0)
const loading = ref(false)

const totalPages = computed(() => Math.ceil(total.value / limit))

const fetchTopVideos = async () => {
  loading.value = true
  try {
    const res = await videoApi.getTopVideos(page.value, limit, activeTab.value)
    const data = res.data
    videos.value = (data?.items as Video[]) || []
    total.value = data?.total || 0
  } catch (err) {
    console.error('获取排行榜失败', err)
  } finally {
    loading.value = false
  }
}

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

onMounted(() => {
  fetchTopVideos()
})
</script>

<style scoped>
.ranking {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.tabs {
  display: flex;
  gap: 1rem;
}

.tab {
  padding: 0.5rem 1.5rem;
  border: none;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: #f0f0f0;
}

.tab.active {
  background: var(--primary-color);
  color: #fff;
}

.video-list {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
}

.video-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  gap: 1rem;
}

.video-item:last-child {
  border-bottom: none;
}

.rank {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: #eee;
  border-radius: 4px;
  font-weight: bold;
  font-size: 1rem;
}

.rank-1 {
  background: #ff6b6b;
  color: #fff;
}

.rank-2 {
  background: #ffa502;
  color: #fff;
}

.rank-3 {
  background: #ffd700;
  color: #333;
}

.video-cover {
  position: relative;
  width: 200px;
  height: 112px;
  flex-shrink: 0;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 2px;
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #999;
  font-size: 0.875rem;
}

.author {
  color: #666;
}

.stats {
  display: flex;
  gap: 1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-outline {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

.loading, .empty {
  text-align: center;
  padding: 2rem;
}
</style>