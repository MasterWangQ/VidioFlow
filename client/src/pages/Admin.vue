<template>
  <div class="admin">
    <div class="container">
      <div class="page-header">
        <h1>管理后台</h1>
        <div class="admin-tabs">
          <button 
            @click="currentTab = 'videos'; fetchPendingVideos()" 
            :class="{ active: currentTab === 'videos' }"
            class="tab-btn"
          >
            视频审核
          </button>
          <button 
            @click="currentTab = 'reports'; fetchReports()" 
            :class="{ active: currentTab === 'reports' }"
            class="tab-btn"
          >
            举报审核
          </button>
        </div>
      </div>

      <div v-if="currentTab === 'videos'">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="pendingVideos.length === 0" class="empty">
          <p>暂无待审核视频</p>
        </div>
        <div v-else class="video-grid">
        <div v-for="video in pendingVideos" :key="video.id" class="video-card">
          <div class="video-cover-wrapper" @click="openVideoModal(video)">
            <img :src="video.cover || '/default-cover.png'" :alt="video.title" class="video-cover-img" />
            <span v-if="video.duration" class="duration">
              {{ formatDuration(video.duration) }}
            </span>
            <div class="play-overlay">
              <span class="play-icon">▶</span>
            </div>
          </div>
          <div class="video-info">
            <span class="video-title">{{ video.title }}</span>
            <div class="video-meta">
              <span v-if="video.user" class="author">
                {{ video.user.nickname || video.user.username }}
              </span>
              <span v-else class="author">未知用户</span>
              <span class="upload-time">上传于 {{ formatTime(video.createdAt) }}</span>
            </div>
          </div>
          <div class="actions">
            <button @click="approveVideo(video.id)" class="btn btn-primary btn-sm">
              通过
            </button>
            <button @click="openRejectModal(video)" class="btn btn-danger btn-sm">
              拒绝
            </button>
          </div>
        </div>
      </div>

      <div v-if="total > limit" class="pagination">
        <button
          @click="page = 1; fetchPendingVideos()"
          :disabled="page <= 1"
          class="btn btn-secondary"
        >
          首页
        </button>
        <button
          @click="page--; fetchPendingVideos()"
          :disabled="page <= 1"
          class="btn btn-secondary"
        >
          上一页
        </button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button
          @click="page++; fetchPendingVideos()"
          :disabled="page >= totalPages"
          class="btn btn-secondary"
        >
          下一页
        </button>
        <button
          @click="page = totalPages; fetchPendingVideos()"
          :disabled="page >= totalPages"
          class="btn btn-secondary"
        >
          末页
        </button>
        </div>
      </div>

      <div v-if="currentTab === 'reports'">
        <div v-if="reportLoading" class="loading">加载中...</div>
        <div v-else-if="reports.length === 0" class="empty">
          <p>暂无举报</p>
        </div>
        <div v-else class="report-list">
          <div v-for="report in reports" :key="report.id" class="report-card">
            <div class="report-header">
              <span class="report-type">{{ report.targetType === 'video' ? '视频举报' : '评论举报' }}</span>
              <span :class="['report-status', report.status]">
                {{ report.status === 'pending' ? '待处理' : report.status === 'approved' ? '已通过' : '已驳回' }}
              </span>
            </div>
            <div class="report-content">
              <p class="report-reason"><strong>举报原因：</strong>{{ report.reason }}</p>
              <div class="report-info">
                <span><strong>举报人：</strong>{{ report.reporter?.nickname || report.reporter?.username }}</span>
                <span><strong>被举报人：</strong>{{ report.targetUser?.nickname || report.targetUser?.username }}</span>
              </div>
              <div v-if="report.targetInfo" class="target-info">
                <p v-if="report.targetType === 'video'" class="target-title">
                  <strong>目标视频：</strong>{{ report.targetInfo.title }}
                </p>
                <p v-else class="target-content">
                  <strong>目标评论：</strong>{{ report.targetInfo.content }}
                </p>
              </div>
              <p class="report-time">举报时间：{{ formatTime(report.createdAt) }}</p>
            </div>
            <div v-if="report.status === 'pending'" class="report-actions">
              <button @click="handleReport(report.id, 'approved')" class="btn btn-primary btn-sm">
                确认违规
              </button>
              <button @click="handleReport(report.id, 'rejected')" class="btn btn-secondary btn-sm">
                驳回举报
              </button>
            </div>
          </div>
        </div>
        <div v-if="reportTotal > reportLimit" class="pagination">
          <button
            @click="reportPage = 1; fetchReports()"
            :disabled="reportPage <= 1"
            class="btn btn-secondary"
          >
            首页
          </button>
          <button
            @click="reportPage--; fetchReports()"
            :disabled="reportPage <= 1"
            class="btn btn-secondary"
          >
            上一页
          </button>
          <span class="page-info">第 {{ reportPage }} / {{ reportTotalPages }} 页</span>
          <button
            @click="reportPage++; fetchReports()"
            :disabled="reportPage >= reportTotalPages"
            class="btn btn-secondary"
          >
            下一页
          </button>
          <button
            @click="reportPage = reportTotalPages; fetchReports()"
            :disabled="reportPage >= reportTotalPages"
            class="btn btn-secondary"
          >
            末页
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showVideoModal" class="video-modal" @click.self="closeVideoModal">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title">{{ currentVideo?.title }}</span>
        <button @click="closeVideoModal" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <video ref="videoRef" controls class="modal-video">
          <source :src="currentVideo?.url" type="video/mp4" />
          您的浏览器不支持视频播放
        </video>
        <div class="video-details">
          <p><strong>标题：</strong>{{ currentVideo?.title }}</p>
          <p><strong>描述：</strong>{{ currentVideo?.description }}</p>
          <p><strong>标签：</strong>{{ currentVideo?.tags?.join(', ') }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showRejectModal" class="video-modal" @click.self="closeRejectModal">
    <div class="modal-content reject-modal">
      <div class="modal-header">
        <span class="modal-title">拒绝视频</span>
        <button @click="closeRejectModal" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <p class="reject-title">请选择拒绝原因：</p>
        <div class="reject-reasons">
          <label v-for="reason in rejectReasons" :key="reason.value" class="reason-option">
            <input type="radio" v-model="selectedRejectReason" :value="reason.value" />
            <span>{{ reason.label }}</span>
          </label>
        </div>
        <textarea 
          v-model="customRejectReason" 
          placeholder="其他原因请在此输入..." 
          class="custom-reason-input"
          :disabled="selectedRejectReason !== 'other'"
        ></textarea>
        <div class="modal-actions">
          <button @click="closeRejectModal" class="btn btn-secondary">取消</button>
          <button @click="confirmReject" class="btn btn-danger">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { videoApi, reportApi } from '../api'
import type { Video } from '../types'

const currentTab = ref<'videos' | 'reports'>('videos')

const pendingVideos = ref<Video[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const total = ref(0)

const reports = ref<any[]>([])
const reportLoading = ref(false)
const reportPage = ref(1)
const reportLimit = 20
const reportTotal = ref(0)
const showVideoModal = ref(false)
const currentVideo = ref<Video | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const showRejectModal = ref(false)
const rejectVideoData = ref<Video | null>(null)
const selectedRejectReason = ref('')
const customRejectReason = ref('')

const rejectReasons = [
  { value: 'violation', label: '内容违规' },
  { value: 'copyright', label: '版权问题' },
  { value: 'quality', label: '画质/音质太差' },
  { value: 'spam', label: '垃圾内容/广告' },
  { value: 'other', label: '其他原因' }
]

const totalPages = computed(() => Math.ceil(total.value / limit))
const reportTotalPages = computed(() => Math.ceil(reportTotal.value / reportLimit))

const fetchPendingVideos = async () => {
  loading.value = true
  try {
    const res = await videoApi.getPending(page.value, limit)
    const data = res.data
    pendingVideos.value = (data?.items as Video[]) || []
    total.value = data?.total || 0
  } catch (err) {
    console.error('获取待审核视频失败', err)
  } finally {
    loading.value = false
  }
}

const approveVideo = async (id: number) => {
  try {
    await videoApi.approve(id)
    pendingVideos.value = pendingVideos.value.filter(v => v.id !== id)
  } catch (err) {
    console.error('审核失败', err)
  }
}

const openRejectModal = (video: Video) => {
  rejectVideoData.value = video
  selectedRejectReason.value = ''
  customRejectReason.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  rejectVideoData.value = null
  selectedRejectReason.value = ''
  customRejectReason.value = ''
}

const confirmReject = async () => {
  if (!rejectVideoData.value) return
  
  let reason = ''
  if (selectedRejectReason.value === 'other') {
    if (!customRejectReason.value.trim()) {
      alert('请输入拒绝原因')
      return
    }
    reason = customRejectReason.value.trim()
  } else if (selectedRejectReason.value) {
    const reasonOption = rejectReasons.find(r => r.value === selectedRejectReason.value)
    reason = reasonOption?.label || ''
  } else {
    alert('请选择拒绝原因')
    return
  }

  try {
    await videoApi.reject(rejectVideoData.value.id, reason)
    pendingVideos.value = pendingVideos.value.filter(v => v.id !== rejectVideoData.value?.id)
    closeRejectModal()
  } catch (err) {
    console.error('拒绝失败', err)
  }
}

const openVideoModal = (video: Video) => {
  currentVideo.value = video
  showVideoModal.value = true
}

const closeVideoModal = () => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
  showVideoModal.value = false
  currentVideo.value = null
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const fetchReports = async () => {
  reportLoading.value = true
  try {
    const res = await reportApi.getReports(reportPage.value, reportLimit)
    const data = res.data
    reports.value = data?.items || []
    reportTotal.value = data?.total || 0
  } catch (err) {
    console.error('获取举报失败', err)
  } finally {
    reportLoading.value = false
  }
}

const handleReport = async (id: number, status: 'approved' | 'rejected') => {
  try {
    await reportApi.handleReport(id, status)
    reports.value = reports.value.filter(r => r.id !== id)
  } catch (err) {
    console.error('处理举报失败', err)
  }
}

onMounted(() => {
  fetchPendingVideos()
})
</script>

<style scoped>

.page-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tab-btn.active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
}

.empty p {
  color: #666;
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

.upload-time {
  color: #999;
  font-size: 0.75rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid #eee;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.video-cover-wrapper {
  position: relative;
  cursor: pointer;
}

.video-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-cover-wrapper .video-cover-img {
  display: block;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-cover-wrapper:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  color: white;
  font-size: 18px;
  margin-left: 4px;
}

.video-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 1rem;
}

.modal-video {
  width: 100%;
  max-height: 500px;
  border-radius: 8px;
}

.video-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.video-details p {
  margin-bottom: 0.5rem;
  color: #333;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
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

.reject-modal {
  max-width: 500px;
}

.reject-title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.reject-reasons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.reason-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.reason-option input[type="radio"] {
  width: 16px;
  height: 16px;
}

.custom-reason-input {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
}

.custom-reason-input:disabled {
  background: #f8f9fa;
  color: #999;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.report-type {
  font-weight: 600;
  color: #333;
}

.report-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.report-status.pending {
  background: #fff3cd;
  color: #856404;
}

.report-status.approved {
  background: #d4edda;
  color: #155724;
}

.report-status.rejected {
  background: #f8d7da;
  color: #721c24;
}

.report-content {
  padding: 1rem;
}

.report-reason {
  margin-bottom: 0.75rem;
  color: #333;
}

.report-info {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #666;
}

.target-info {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.target-title {
  margin: 0;
  color: #333;
  font-size: 0.875rem;
}

.target-content {
  margin: 0;
  color: #333;
  font-size: 0.875rem;
  word-break: break-all;
}

.report-time {
  margin: 0;
  font-size: 0.75rem;
  color: #999;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}
</style>