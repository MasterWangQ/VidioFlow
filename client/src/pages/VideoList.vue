<template>
  <div class="video-list">
    <div class="container">
      <h1 class="page-title">视频列表</h1>
      
      <!-- 标签分类 -->
      <div class="tags-section">
        <h3 class="tags-title">热门标签</h3>
        <div class="tags-container">
          <button
            @click="clearTag"
            :class="['tag-item', { active: !videoStore.tag }]"
          >
            全部
          </button>
          <button
            v-for="tag in tags"
            :key="tag.name"
            @click="selectTag(tag.name)"
            :class="['tag-item', { active: videoStore.tag === tag.name }]"
          >
            {{ tag.name }}
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索视频标题、描述或标签..."
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch">搜索</button>
      </div>
      <div v-if="videoStore.loading" class="loading">加载中...</div>
      <div v-else-if="videoStore.videos.length === 0" class="empty">
        <template v-if="videoStore.tag">
          「{{ videoStore.tag }}」标签下暂无视频，<button @click="clearTag" class="empty-btn">查看全部视频</button>
        </template>
        <template v-else-if="searchQuery">
          未找到匹配的视频
        </template>
        <template v-else>
          暂无视频
        </template>
      </div>
      <div v-else class="video-grid">
        <div v-for="video in videoStore.videos" :key="video.id" class="video-card card">
          <router-link :to="`/video/${video.id}`">
            <div class="cover">
              <img :src="video.cover || '/default-cover.jpg'" :alt="video.title" />
              <span v-if="video.duration" class="duration">{{ formatDuration(video.duration) }}</span>
            </div>
            <div class="info">
              <h3 class="title">{{ video.title }}</h3>
              <p class="author">{{ video.user?.nickname || video.user?.username }}</p>
              <p class="meta">{{ video.viewCount }} 次播放</p>
            </div>
          </router-link>
        </div>
      </div>
      <div v-if="videoStore.total > videoStore.limit" class="pagination">
        <button
          :disabled="videoStore.page <= 1"
          @click="changePage(videoStore.page - 1)"
        >
          上一页
        </button>
        <span>{{ videoStore.page }} / {{ totalPages }}</span>
        <button
          :disabled="videoStore.page >= totalPages"
          @click="changePage(videoStore.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useVideoStore } from '../stores/video'
import { videoApi } from '../api'
import { useRoute } from 'vue-router'

const videoStore = useVideoStore()
const route = useRoute()
const searchQuery = ref('')
const tagCounts = ref<{ [key: string]: number }>({})

const totalPages = computed(() => Math.ceil(videoStore.total / videoStore.limit))

const presetTags = [
  '番剧', '国创', '综艺', '动画', '鬼畜', '舞蹈', '娱乐', '科技数码',
  '美食', '汽车', '体育运动', '电影', '电视剧', '纪录片', '游戏', '音乐',
  '影视', '知识', '资讯', '小剧场', '时尚美妆', 'Vlog', '搞笑', '手工',
  '教育', '挑战', '时尚', '科技', '运动', '音乐', '纪录片'
]

const tags = computed(() => {
  return presetTags.map(name => ({
    name,
    count: tagCounts.value[name] || 0
  }))
})

const fetchTags = async () => {
  try {
    const res = await videoApi.getTags()
    const tagData = res.data || []
    tagData.forEach(tag => {
      tagCounts.value[tag.name] = tag.count
    })
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

const selectTag = (tagName: string) => {
  videoStore.setTag(tagName)
  videoStore.setSearch('')
  searchQuery.value = ''
  videoStore.fetchVideos()
}

const clearTag = () => {
  videoStore.setTag('')
  videoStore.setSearch('')
  searchQuery.value = ''
  videoStore.fetchVideos()
}

watch(() => route.query.tag, (newTag) => {
  if (newTag) {
    videoStore.setTag(newTag as string)
    videoStore.fetchVideos()
  }
})

watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    searchQuery.value = newSearch as string
    videoStore.setSearch(newSearch as string)
    videoStore.fetchVideos()
  }
})

onMounted(() => {
  const tag = route.query.tag as string
  if (tag) {
    videoStore.setTag(tag)
  }
  const search = route.query.search as string
  if (search) {
    searchQuery.value = search
    videoStore.setSearch(search)
  }
  videoStore.fetchVideos()
  fetchTags()
})

const handleSearch = () => {
  videoStore.setSearch(searchQuery.value.trim())
  videoStore.fetchVideos()
}

const changePage = (page: number) => {
  videoStore.setPage(page)
  videoStore.fetchVideos()
  window.scrollTo(0, 0)
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* 标签分类样式 */
.tags-section {
  margin-bottom: 1.5rem;
}

.tags-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.tag-item:hover {
  border-color: #007bff;
  color: #007bff;
}

.tag-item.active {
  background: #007bff;
  border-color: #007bff;
  color: #fff;
}

.tag-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
}

.tag-item.active .tag-count {
  background: rgba(255, 255, 255, 0.2);
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.search-bar input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}

.search-bar button {
  padding: 0.5rem 1.5rem;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

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

.author {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
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

.empty-btn {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
}

.empty-btn:hover {
  color: #0056b3;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
