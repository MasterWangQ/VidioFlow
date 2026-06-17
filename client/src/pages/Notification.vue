<template>
  <div class="notification-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="title">消息通知</h1>
        <button 
          v-if="unreadCount > 0" 
          class="mark-all-read"
          @click="handleMarkAllRead"
        >
          全部已读
        </button>
      </div>
    </div>

    <div class="notification-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon">🔔</div>
        <p>暂无通知</p>
      </div>

      <div v-else class="list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
          @click="handleClick(notification)"
        >
          <div class="notification-icon">
            <span v-if="notification.type === 'like'">👍</span>
            <span v-else-if="notification.type === 'comment'">💬</span>
            <span v-else-if="notification.type === 'subscribe'">👤</span>
            <span v-else-if="notification.type === 'upload'">📹</span>
            <span v-else-if="notification.type === 'approval'">✅</span>
            <span v-else>🔔</span>
          </div>
          
          <div class="notification-content">
            <p class="content-text">{{ notification.content }}</p>
            <span class="time">{{ formatTime(notification.createdAt) }}</span>
          </div>

          <button class="delete-btn" @click.stop="handleDelete(notification.id)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification'

const router = useRouter()
const store = useNotificationStore()
const { notifications, unreadCount, loading, fetchNotifications, markAsRead, deleteNotification } = store

onMounted(() => {
  fetchNotifications()
})

function handleMarkAllRead() {
  markAsRead()
}

function handleClick(notification: any) {
  if (!notification.read) {
    markAsRead(notification.id)
  }
  if (notification.link) {
    router.push(notification.link)
  }
}

function handleDelete(id: number) {
  if (confirm('确定删除这条通知吗？')) {
    deleteNotification(id)
  }
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.notification-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  background: #fff;
  padding: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.mark-all-read {
  padding: 8px 16px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.mark-all-read:hover {
  background: #0056b3;
}

.notification-list {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 24px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: #999;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.notification-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.notification-item.unread {
  background: #f8fafc;
  border-left-color: #007bff;
}

.notification-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.content-text {
  font-size: 15px;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.time {
  font-size: 13px;
  color: #999;
}

.delete-btn {
  padding: 8px;
  border: none;
  background: transparent;
  color: #ccc;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #f5f5f5;
  color: #ff4d4f;
}

.delete-btn svg {
  width: 18px;
  height: 18px;
}
</style>
