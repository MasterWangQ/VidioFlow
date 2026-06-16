<template>
  <div class="user-favorites">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="favorites.length === 0" class="empty">暂无收藏</div>
    <div v-else class="video-grid">
      <div v-for="item in favorites" :key="item.id" class="video-card card">
        <router-link :to="`/video/${item.video?.id}`">
          <div class="cover">
            <img :src="item.video?.cover || '/default-cover.jpg'" :alt="item.video?.title" />
            <span v-if="item.video?.duration" class="duration">{{ formatDuration(item.video.duration) }}</span>
          </div>
          <div class="info">
            <h3 class="title">{{ item.video?.title }}</h3>
            <p class="meta">{{ item.video?.viewCount }} 次播放</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'
import type { Favorite } from '../types'

const route = useRoute()
const favorites = ref<Favorite[]>([])
const loading = ref(false)

const fetchFavorites = async () => {
  loading.value = true
  try {
    const res = await api.get<any, any>(`/users/${route.params.id}/favorites`)
    favorites.value = res.data?.items || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchFavorites)
watch(() => route.params.id, fetchFavorites)

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
</style>
