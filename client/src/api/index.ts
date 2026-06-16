import axios from 'axios'
import type {
  ApiResponse,
  User,
  Video,
  Comment,
  LoginParams,
  RegisterParams,
  UpdateUserParams,
  UploadVideoParams,
  PaginatedResponse,
  Danmaku,
  Notification
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export const authApi = {
  login: (data: LoginParams) => api.post<any, ApiResponse<{ token: string; user: User }>>('/auth/login', data),
  register: (data: RegisterParams) => api.post<any, ApiResponse<{ token: string; user: User }>>('/auth/register', data),
  getMe: () => api.get<any, ApiResponse<User>>('/auth/me')
}

export const userApi = {
  getUser: (id: string) => api.get<any, ApiResponse<User>>(`/users/${id}`),
  updateUser: (id: string, data: UpdateUserParams) => api.put<any, ApiResponse<User>>(`/users/${id}`, data),
  updateAvatar: (id: string, avatar: string) => api.put<any, ApiResponse<User>>(`/users/${id}/avatar`, { avatar }),
  getUserVideos: (id: string, page = 1, limit = 10) =>
    api.get<any, ApiResponse<PaginatedResponse<Video>>>(`/users/${id}/videos`, { params: { page, limit } })
}

export const videoApi = {
  getTopVideos: (page = 1, limit = 20, type: 'view' | 'like' | 'new' = 'view') =>
    api.get<any, ApiResponse<PaginatedResponse<Video>>>('/videos/top', { params: { page, limit, type } }),
  getVideos: (page = 1, limit = 10, category?: string, search?: string, tag?: string) =>
    api.get<any, ApiResponse<PaginatedResponse<Video>>>('/videos', { params: { page, limit, category, search, tag } }),
  getVideo: (id: string) => api.get<any, ApiResponse<Video>>(`/videos/${id}`),
  uploadVideo: (data: UploadVideoParams) => api.post<any, ApiResponse<Video>>('/videos', data),
  updateVideo: (id: string, data: Partial<Pick<Video, 'title' | 'description' | 'category' | 'tags'>>) =>
    api.put<any, ApiResponse<Video>>(`/videos/${id}`, data),
  deleteVideo: (id: string) => api.delete<any, ApiResponse<null>>(`/videos/${id}`),
  getCategories: () => api.get<any, ApiResponse<PaginatedResponse<{ id: number; name: string }>>>('/categories'),
  getTags: () => api.get<any, ApiResponse<{ name: string; count: number }[]>>('/videos/tags/list'),
  getPending: (page = 1, limit = 20) =>
    api.get<any, ApiResponse<PaginatedResponse<Video>>>('/videos/pending/list', { params: { page, limit } }),
  approve: (id: number) => api.put<any, ApiResponse<Video>>(`/videos/${id}/approve`),
  reject: (id: number, reason?: string) => api.put<any, ApiResponse<null>>(`/videos/${id}/reject`, { reason }),
  resubmit: (id: number) => api.put<any, ApiResponse<null>>(`/videos/${id}/resubmit`)
}

export const commentApi = {
  getComments: (videoId: string, page = 1, limit = 20) =>
    api.get<any, ApiResponse<PaginatedResponse<Comment>>>(`/videos/${videoId}/comments`, { params: { page, limit } }),
  addComment: (videoId: string, content: string, parentId?: string) =>
    api.post<any, ApiResponse<Comment>>(`/videos/${videoId}/comments`, { content, parentId }),
  deleteComment: (id: string) => api.delete<any, ApiResponse<null>>(`/comments/${id}`)
}

export const interactionApi = {
  like: (videoId: string) => api.post<any, ApiResponse<null>>(`/videos/${videoId}/like`),
  unlike: (videoId: string) => api.delete<any, ApiResponse<null>>(`/videos/${videoId}/like`),
  favorite: (videoId: string) => api.post<any, ApiResponse<null>>(`/videos/${videoId}/favorite`),
  unfavorite: (videoId: string) => api.delete<any, ApiResponse<null>>(`/videos/${videoId}/favorite`),
  subscribe: (userId: string) => api.post<any, ApiResponse<null>>(`/users/${userId}/subscribe`),
  unsubscribe: (userId: string) => api.delete<any, ApiResponse<null>>(`/users/${userId}/subscribe`)
}

export const uploadApi = {
  uploadVideo: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<any, ApiResponse<{ url: string; filename: string }>>('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadCover: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<any, ApiResponse<{ url: string; filename: string }>>('/upload/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const danmakuApi = {
  getDanmaku: (videoId: string, page = 1, limit = 100) =>
    api.get<any, ApiResponse<PaginatedResponse<Danmaku>>>(`/videos/${videoId}/danmaku`, { params: { page, limit } }),
  getDanmakuByTime: (videoId: string, startTime = 0, endTime = 1800) =>
    api.get<any, ApiResponse<Danmaku[]>>(`/videos/${videoId}/danmaku/by-time`, { params: { startTime, endTime } }),
  sendDanmaku: (videoId: string, content: string, time: number, color = '#ffffff', type = 1) =>
    api.post<any, ApiResponse<Danmaku>>(`/videos/${videoId}/danmaku`, { content, time, color, type }),
  deleteDanmaku: (id: number) => api.delete<any, ApiResponse<null>>(`/danmaku/${id}`)
}

export const watchHistoryApi = {
  getHistory: (page = 1, limit = 20) =>
    api.get<any, ApiResponse<PaginatedResponse<{ id: number; videoId: number; watchedAt: string; progress: number; video: Video }>>>(
      '/watch-history',
      { params: { page, limit } }
    ),
  addHistory: (videoId: number, progress?: number) =>
    api.post<any, ApiResponse<{ id: number; videoId: number; watchedAt: string; progress: number }>>(
      '/watch-history',
      { videoId, progress }
    ),
  deleteHistory: (id: number) => api.delete<any, ApiResponse<null>>(`/watch-history/${id}`),
  clearHistory: () => api.delete<any, ApiResponse<null>>('/watch-history')
}

export const notificationApi = {
  getNotifications: (page = 1, limit = 20) =>
    api.get<any, ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params: { page, limit } }),
  getUnreadCount: () => api.get<any, ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markAsRead: (id?: number) => api.put<any, ApiResponse<null>>(`/notifications/read/${id || ''}`),
  deleteNotification: (id: number) => api.delete<any, ApiResponse<null>>(`/notifications/${id}`)
}

export default api
