import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Notification } from '../types'
import { notificationApi } from '../api'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)

  async function fetchNotifications(page = 1, limit = 20) {
    loading.value = true
    try {
      console.log('开始获取通知列表...')
      const res = await notificationApi.getNotifications(page, limit)
      console.log('通知API响应:', JSON.stringify(res))
      notifications.value = res.data?.items || []
      console.log('通知列表:', notifications.value.length, '条')
    } catch (error) {
      console.error('获取通知失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      console.log('开始获取未读数量...')
      const res = await notificationApi.getUnreadCount()
      console.log('未读数量API响应:', JSON.stringify(res))
      unreadCount.value = res.data?.count || 0
      console.log('未读数量:', unreadCount.value)
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  }

  async function markAsRead(id?: number) {
    try {
      await notificationApi.markAsRead(id)
      if (id) {
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
          notification.read = true
        }
      } else {
        notifications.value.forEach(n => n.read = true)
      }
      await fetchUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  async function deleteNotification(id: number) {
    try {
      await notificationApi.deleteNotification(id)
      notifications.value = notifications.value.filter(n => n.id !== id)
      await fetchUnreadCount()
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  }

  async function refresh() {
    await fetchUnreadCount()
    await fetchNotifications()
  }

  function reset() {
    notifications.value = []
    unreadCount.value = 0
    loading.value = false
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    deleteNotification,
    refresh,
    reset
  }
})
