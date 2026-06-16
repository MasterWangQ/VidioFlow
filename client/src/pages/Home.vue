<template>
  <div class="home">
    <div class="container">
      <!-- 标签区域 - B站风格导航 -->
      <div class="tags-bar">
        <div class="tags-row">
          <button
            @click="goToTag('')"
            class="tag-btn active"
          >
            <span class="tag-icon">🔥</span>
            推荐
          </button>
          <button
            v-for="tag in firstRowTags"
            :key="tag"
            @click="goToTag(tag)"
            class="tag-btn"
            :class="{ active: currentTag === tag }"
          >
            {{ tag }}
          </button>
        </div>
        <div class="tags-row">
          <button
            v-for="tag in secondRowTags"
            :key="tag"
            @click="goToTag(tag)"
            class="tag-btn"
            :class="{ active: currentTag === tag }"
          >
            {{ tag }}
          </button>
          <div class="dropdown">
            <button class="dropdown-btn" @click="showDropdown = !showDropdown">
              更多
              <span class="dropdown-arrow" :class="{ open: showDropdown }">▼</span>
            </button>
            <div v-if="showDropdown" class="dropdown-menu">
              <button
                v-for="tag in hiddenTags"
                :key="tag"
                @click="handleDropdownTagClick(tag)"
                class="dropdown-item"
                :class="{ active: currentTag === tag }"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 轮播区域 -->
        <div v-if="videoStore.videos.length > 0" class="carousel-wrapper">
          <div class="carousel">
            <div class="carousel-container">
              <div
                v-for="(video, index) in featuredVideos"
                :key="video.id"
                class="carousel-item"
                :class="{ active: currentSlide === index }"
              >
                <router-link :to="`/video/${video.id}`" class="carousel-link">
                  <img :src="video.cover || '/default-cover.jpg'" :alt="video.title" class="carousel-image" />
                  <div class="carousel-overlay">
                    <div class="carousel-content">
                      <h2 class="carousel-title">{{ video.title }}</h2>
                      <div class="carousel-meta">
                        <span class="carousel-author">{{ video.user?.nickname || video.user?.username }}</span>
                        <span class="carousel-views">{{ formatViews(video.viewCount) }}播放</span>
                      </div>
                    </div>
                  </div>
                  <div class="carousel-gradient"></div>
                </router-link>
              </div>
            </div>
            <button @click="prevSlide" class="carousel-prev">‹</button>
            <button @click="nextSlide" class="carousel-next">›</button>
            <div class="carousel-indicators">
              <button
                v-for="(_, index) in featuredVideos"
                :key="index"
                @click="goToSlide(index)"
                :class="{ active: currentSlide === index }"
              ></button>
            </div>
          </div>
        </div>

        <!-- 推荐视频区域 -->
        <div class="recommend-wrapper">
          <div class="section-header">
            <h2 class="section-title">
              <span class="title-icon">📺</span>
              推荐视频
            </h2>
            <button @click="shuffleVideos" class="refresh-btn">
              <span class="refresh-icon">↻</span>
              换一批
            </button>
          </div>
          
          <div v-if="videoStore.loading" class="loading">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else-if="displayVideos.length === 0" class="empty">
            <div class="empty-icon">📭</div>
            <p>暂无视频</p>
            <router-link to="/upload" class="empty-link">成为第一个上传者</router-link>
          </div>
          <div v-else class="video-grid">
            <div v-for="video in displayVideos" :key="video.id" class="video-card">
              <router-link :to="`/video/${video.id}`" class="video-link">
                <div class="video-cover">
                  <img :src="video.cover || '/default-cover.jpg'" :alt="video.title" class="cover-image" />
                  <span v-if="video.duration" class="duration">{{ formatDuration(video.duration) }}</span>
                  <div class="cover-overlay"></div>
                </div>
                <div class="video-info">
                  <h3 class="video-title">{{ video.title }}</h3>
                  <div class="video-meta">
                    <span class="video-author">{{ video.user?.nickname || video.user?.username }}</span>
                    <span class="video-stats">
                      {{ formatViews(video.viewCount) }}播放 · {{ formatDate(video.createdAt) }}
                    </span>
                  </div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 更多推荐区域 -->
      <div class="more-section" v-if="videoStore.videos.length > 6">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">✨</span>
            更多精彩
          </h2>
        </div>
        <div class="more-grid">
          <div v-for="video in moreVideos" :key="video.id" class="more-card">
            <router-link :to="`/video/${video.id}`" class="more-link">
              <div class="more-cover">
                <img :src="video.cover || '/default-cover.jpg'" :alt="video.title" />
                <span class="more-duration">{{ formatDuration(video.duration || 0) }}</span>
              </div>
              <div class="more-info">
                <h4 class="more-title">{{ video.title }}</h4>
                <span class="more-author">{{ video.user?.nickname || video.user?.username }}</span>
                <span class="more-stats">{{ formatViews(video.viewCount) }}播放</span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useVideoStore } from '../stores/video'
import { videoApi } from '../api'
import { useRouter } from 'vue-router'

const videoStore = useVideoStore()
const router = useRouter()
const currentSlide = ref(0)
const tags = ref<{ name: string; count: number }[]>([])
const shuffledIndices = ref<number[]>([])
const currentTag = ref('')
const showDropdown = ref(false)
let autoPlayTimer: number | null = null

const presetTags = [
  '番剧', '国创', '综艺', '动画', '鬼畜', '舞蹈', '娱乐', '科技数码',
  '美食', '汽车', '体育运动', '电影', '电视剧', '纪录片', '游戏', '音乐',
  '影视', '知识', '资讯', '小剧场', '时尚美妆'
]

const firstRowTags = computed(() => presetTags.slice(0, 7))
const secondRowTags = computed(() => presetTags.slice(7, 14))
const hiddenTags = computed(() => presetTags.slice(14))

const handleDropdownTagClick = (tag: string) => {
  currentTag.value = tag
  showDropdown.value = false
  goToTag(tag)
}

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown')) {
    showDropdown.value = false
  }
}

const featuredVideos = computed(() => videoStore.videos.slice(0, 5))

const displayVideos = computed(() => {
  let videos = videoStore.videos.slice(0, 6)
  if (shuffledIndices.value.length > 0) {
    videos = shuffledIndices.value.map(i => videoStore.videos[i]).filter(Boolean)
  }
  return videos.slice(0, 6)
})

const moreVideos = computed(() => videoStore.videos.slice(11, 20))

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % featuredVideos.value.length
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + featuredVideos.value.length) % featuredVideos.value.length
}

const goToSlide = (index: number) => {
  currentSlide.value = index
}

const startAutoPlay = () => {
  autoPlayTimer = window.setInterval(() => {
    nextSlide()
  }, 5000)
}

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

const fetchTags = async () => {
  try {
    const res = await videoApi.getTags()
    tags.value = res.data || []
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

const goToTag = (tagName: string) => {
  router.push({ path: '/videos', query: { tag: tagName } })
}

const shuffleVideos = () => {
  const allVideos = videoStore.videos.slice(5)
  if (allVideos.length <= 6) {
    shuffledIndices.value = []
    return
  }
  
  const indices = Array.from({ length: allVideos.length }, (_, i) => i + 5)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  shuffledIndices.value = indices.slice(0, 6)
}

onMounted(() => {
  videoStore.setSearch('')
  videoStore.setTag('')
  videoStore.fetchVideos()
  fetchTags()
  startAutoPlay()
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  stopAutoPlay()
  document.removeEventListener('click', closeDropdown)
})

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatViews = (count: number) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toString()
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* 标签栏样式 */
.tags-bar {
  padding: 0.75rem 0;
  background: rgba(13, 13, 13, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  margin: 0 -1.5rem 1rem;
  padding: 0.75rem 1.5rem;
  position: sticky;
  top: 65px;
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: calc(100% + 3rem);
  border-radius: 16px;
  padding: 1rem 1.5rem;
}

.tags-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  justify-content: center;
}

.tags-row:last-child {
  margin-bottom: 0;
}

.tag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.4375rem 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 20px;
  color: #e0e0e0;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.25s ease;
  flex: 0 1 auto;
  min-width: 70px;
  max-width: 100px;
}

.tag-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: translateY(-1px);
}

.tag-btn.active {
  background: linear-gradient(135deg, #ff6b6b, #fa5252);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.tag-icon {
  font-size: 0.875rem;
}

/* 下拉框样式 */
.dropdown {
  position: relative;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;
  padding: 0.4375rem 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 20px;
  color: #e0e0e0;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.25s ease;
  flex: 0 1 auto;
  min-width: 70px;
  max-width: 100px;
}

.dropdown-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.dropdown-arrow {
  font-size: 0.625rem;
  transition: transform 0.25s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  padding: 0.25rem;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  min-width: 140px;
  z-index: 1000;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #ccc;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.dropdown-item.active {
  background: rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
}

/* 轮播区域 */
.carousel-wrapper {
  flex: 0 0 40%;
  min-width: 450px;
}

.carousel {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.carousel-container {
  position: relative;
  width: 100%;
  height: 380px;
  overflow: hidden;
}

.carousel-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: scale(0.95);
  transition: all 0.5s ease;
}

.carousel-item.active {
  opacity: 1;
  transform: scale(1);
}

.carousel-link {
  display: block;
  width: 100%;
  height: 100%;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  z-index: 10;
}

.carousel-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.3), transparent);
  pointer-events: none;
}

.carousel-content {
  position: relative;
  z-index: 1;
}

.carousel-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  line-height: 1.4;
}

.carousel-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.carousel-author {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9375rem;
}

.carousel-views {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

.carousel-prev,
.carousel-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 20;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-prev:hover,
.carousel-next:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-50%) scale(1.1);
}

.carousel-prev {
  left: 1rem;
}

.carousel-next {
  right: 1rem;
}

.carousel-indicators {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 20;
}

.carousel-indicators button {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-indicators button.active {
  background: #ff6b6b;
  border-color: #ff6b6b;
  transform: scale(1.2);
}

/* 推荐视频区域 */
.recommend-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 380px;
  min-width: 500px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.375rem;
  font-weight: 600;
  color: #212529;
}

.title-icon {
  font-size: 1.25rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  color: #6c757d;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: #f8f9fa;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.refresh-icon {
  font-size: 0.875rem;
}

.refresh-btn:hover .refresh-icon {
  animation: spin 0.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b6b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  gap: 1rem;
}

.empty-icon {
  font-size: 4rem;
}

.empty p {
  color: #6c757d;
  font-size: 1rem;
}

.empty-link {
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #ff6b6b, #fa5252);
  color: #fff;
  text-decoration: none;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.empty-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

/* 视频网格 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 0.625rem;
  flex: 1;
  min-height: 0;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
}

.video-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.video-link {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.video-cover {
  position: relative;
  height: 90px;
  overflow: hidden;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .cover-image {
  transform: scale(1.05);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  transition: background 0.3s ease;
}

.video-card:hover .cover-overlay {
  background: rgba(0, 0, 0, 0.1);
}

.duration {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.video-info {
  padding: 0.875rem;
}

.video-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.video-author {
  color: #6c757d;
  font-size: 0.8125rem;
}

.video-stats {
  color: #adb5bd;
  font-size: 0.75rem;
}

/* 更多推荐区域 */
.more-section {
  margin-top: 2rem;
}

.more-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

@media (max-width: 1200px) {
  .more-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .more-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.more-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.more-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.more-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.more-cover {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.more-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.more-card:hover .more-cover img {
  transform: scale(1.05);
}

.more-duration {
  position: absolute;
  bottom: 0.375rem;
  right: 0.375rem;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.more-info {
  padding: 0.75rem;
}

.more-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.375rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.more-author {
  display: block;
  color: #6c757d;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.more-stats {
  color: #adb5bd;
  font-size: 0.7rem;
}
</style>
