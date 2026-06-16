export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  nickname?: string
  description?: string
  createdAt: string
  updatedAt: string
  videoCount?: number
  subscriberCount?: number
}

export interface Video {
  id: number
  title: string
  description?: string
  url: string
  cover?: string
  duration?: number
  userId: number
  user?: User
  category?: string
  tags?: string[]
  viewCount: number
  likeCount: number
  status: number
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  content: string
  userId: number
  user?: User
  videoId: number
  parentId?: number
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Like {
  id: number
  userId: number
  videoId: number
  createdAt: string
}

export interface Favorite {
  id: number
  userId: number
  videoId: number
  video?: Video
  createdAt: string
}

export interface Subscription {
  id: number
  subscriberId: number
  creatorId: number
  creator?: User
  createdAt: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

export interface UpdateUserParams {
  nickname?: string
  description?: string
}

export interface UploadVideoParams {
  title: string
  description?: string
  url: string
  cover?: string
  duration?: number
  category?: string
  tags?: string[]
}

export interface Category {
  id: number
  name: string
  slug?: string
}

export interface Danmaku {
  id: number
  videoId: number
  userId: number
  user?: User
  content: string
  time: number
  color: string
  type: number
  createdAt: string
}

export interface Notification {
  id: number
  userId: number
  type: string
  content: string
  link: string
  read: boolean
  createdAt: string
}
