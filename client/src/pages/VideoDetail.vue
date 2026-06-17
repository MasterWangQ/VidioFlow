<template>
  <div class="video-detail">
    <div class="container">
      <div v-if="videoStore.loading" class="loading">加载中...</div>
      <div v-else-if="!videoStore.currentVideo" class="empty">视频不存在</div>
      <div v-else class="content">
        <div class="player">
          <video 
            ref="videoRef"
            :src="video.url" 
            controls 
            @timeupdate="handleTimeUpdate"
            @loadedmetadata="handleLoadedMetadata"
          ></video>
        </div>
        <div class="info">
          <h1 class="title">{{ video.title }}</h1>
          <div class="meta">
            <span>{{ video.viewCount }} 次播放</span>
            <span>{{ formatDate(video.createdAt) }}</span>
          </div>
          <div class="actions">
            <button @click="handleLike" :class="{ active: isLiked }">
              {{ isLiked ? '已点赞' : '点赞' }} {{ video.likeCount }}
            </button>
            <button @click="handleFavorite" :class="{ active: isFavorited }">
              {{ isFavorited ? '已收藏' : '收藏' }}
            </button>
            <button @click="handleSubscribe" :class="{ active: isSubscribed }">
              {{ isSubscribed ? '已订阅' : '订阅' }}
            </button>
            <button @click="handleReportVideo" class="report-btn">
              举报
            </button>
          </div>
          <div class="author">
            <router-link :to="`/user/${video.user?.id}`">
              <img :src="video.user?.avatar || '/default-avatar.png'" class="avatar" />
              <span class="name">{{ video.user?.nickname || video.user?.username }}</span>
            </router-link>
          </div>
          <div v-if="video.tags && video.tags.length > 0" class="tags">
            <span class="tags-label">标签：</span>
            <span v-for="tag in video.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <p class="description">{{ video.description || '暂无简介' }}</p>
        </div>
        <div class="comments">
          <h2>评论</h2>
          <div v-if="userStore.isLoggedIn" class="comment-form">
            <textarea v-model="commentContent" placeholder="写下你的评论..."></textarea>
            <button @click="submitComment" class="btn btn-primary">发表评论</button>
          </div>
          <div v-else class="login-tip">
            <router-link to="/login">登录</router-link>后参与评论
          </div>
          <div class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <router-link :to="`/user/${comment.user?.id}`">
                <img :src="comment.user?.avatar || '/default-avatar.png'" class="avatar" />
              </router-link>
              <div class="comment-content">
                <p class="comment-user">{{ comment.user?.nickname || comment.user?.username }}</p>
                <p class="comment-text">{{ comment.content }}</p>
                <p class="comment-time">{{ formatDate(comment.createdAt) }}</p>
              </div>
              <button @click="handleReportComment(comment.id)" class="comment-report-btn">
                举报
              </button>
            </div>
          </div>
          <div v-if="totalComments > limit" class="pagination">
            <button @click="page--; fetchComments()" :disabled="page <= 1" class="btn btn-secondary">
              上一页
            </button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="page++; fetchComments()" :disabled="page >= totalPages" class="btn btn-secondary">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <ReportModal 
    :visible="showReportModal" 
    :target-id="reportTargetId" 
    :target-type="reportTargetType"
    @close="handleReportClose"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useVideoStore } from '../stores/video'
import { useUserStore } from '../stores/user'
import { commentApi, interactionApi, watchHistoryApi } from '../api'
import type { Comment } from '../types'
import ReportModal from '../components/ReportModal.vue'

const route = useRoute()
const videoStore = useVideoStore()
const userStore = useUserStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const comments = ref<Comment[]>([])
const commentContent = ref('')
const isLiked = ref(false)
const isFavorited = ref(false)
const isSubscribed = ref(false)
const page = ref(1)
const limit = 10
const totalComments = ref(0)
const savedProgress = ref(0)
let progressTimer: number | null = null

const totalPages = computed(() => Math.ceil(totalComments.value / limit))

const video = computed(() => videoStore.currentVideo!)

const showReportModal = ref(false)
const reportTargetId = ref(0)
const reportTargetType = ref<'video' | 'comment'>('video')

const handleReportVideo = () => {
  reportTargetId.value = parseInt(route.params.id as string)
  reportTargetType.value = 'video'
  showReportModal.value = true
}

const handleReportComment = (commentId: number) => {
  reportTargetId.value = commentId
  reportTargetType.value = 'comment'
  showReportModal.value = true
}

const handleReportClose = () => {
  showReportModal.value = false
}

onMounted(async () => {
  const id = route.params.id as string
  await videoStore.fetchVideo(id)
  await fetchComments()
  
  // 获取播放进度
  if (userStore.isLoggedIn) {
    try {
      const historyRes = await watchHistoryApi.getHistory(1, 100)
      const history = historyRes.data?.items || []
      const videoHistory = history.find((h: any) => h.videoId === parseInt(id))
      if (videoHistory) {
        savedProgress.value = videoHistory.progress
      }
    } catch (err) {
      console.error('获取观看历史失败', err)
    }
  }
})

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
})

const handleLoadedMetadata = () => {
  if (videoRef.value && savedProgress.value > 0) {
    videoRef.value.currentTime = savedProgress.value
  }
}

const handleTimeUpdate = () => {
  if (!videoRef.value || !userStore.isLoggedIn) return
  
  if (!progressTimer) {
    const videoId = parseInt(route.params.id as string)
    
    progressTimer = window.setInterval(async () => {
      const currentTime = videoRef.value?.currentTime || 0
      if (currentTime > savedProgress.value + 1) {
        savedProgress.value = Math.floor(currentTime)
        try {
          await watchHistoryApi.addHistory(videoId, savedProgress.value)
        } catch (err) {
          console.error('保存播放进度失败', err)
        }
      }
    }, 1000)
    
    try {
      watchHistoryApi.addHistory(videoId, 0).catch(err => {
        console.error('记录播放历史失败', err)
      })
    } catch (err) {
      console.error('记录播放历史失败', err)
    }
  }
}

const fetchComments = async () => {
  const res = await commentApi.getComments(route.params.id as string, page.value, limit)
  const data = res.data
  comments.value = data?.items || []
  totalComments.value = data?.total || 0
}

const submitComment = async () => {
  if (!commentContent.value.trim()) return
  await commentApi.addComment(route.params.id as string, commentContent.value)
  commentContent.value = ''
  page.value = 1
  await fetchComments()
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  try {
    if (isLiked.value) {
      await interactionApi.unlike(route.params.id as string)
      video.value.likeCount--
    } else {
      await interactionApi.like(route.params.id as string)
      video.value.likeCount++
    }
    isLiked.value = !isLiked.value
  } catch (error: any) {
    console.error('点赞失败', error)
    alert(error.message || '操作失败')
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  try {
    if (isFavorited.value) {
      await interactionApi.unfavorite(route.params.id as string)
    } else {
      await interactionApi.favorite(route.params.id as string)
    }
    isFavorited.value = !isFavorited.value
  } catch (error: any) {
    console.error('收藏失败', error)
    alert(error.response?.data?.message || '操作失败')
  }
}

const handleSubscribe = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  if (!video.value.userId) return
  try {
    if (isSubscribed.value) {
      await interactionApi.unsubscribe(String(video.value.userId))
    } else {
      await interactionApi.subscribe(String(video.value.userId))
    }
    isSubscribed.value = !isSubscribed.value
  } catch (error: any) {
    console.error('订阅失败', error)
    alert(error.response?.data?.message || '操作失败')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.player {
  background: #000;
  margin-bottom: 1.5rem;
}

.player video {
  width: 100%;
  max-height: 70vh;
}

.info {
  margin-bottom: 2rem;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.meta {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.actions button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.actions button.active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.report-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ff6b6b;
  background: #fff;
  color: #ff6b6b;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.report-btn:hover {
  background: #fff5f5;
}

.author {
  margin-bottom: 1rem;
}

.author a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.name {
  font-weight: 500;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;
}

.tags-label {
  color: #666;
  font-size: 0.875rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #333;
}

.description {
  color: #666;
  line-height: 1.6;
}

.comments h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.comment-form {
  margin-bottom: 1.5rem;
}

.comment-form textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  resize: vertical;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.comment-report-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: #999;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
}

.comment-report-btn:hover {
  color: #ff6b6b;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.comment-text {
  margin-bottom: 0.25rem;
}

.comment-time {
  color: #999;
  font-size: 0.75rem;
}

.login-tip {
  text-align: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.page-info {
  color: #666;
}
</style>
