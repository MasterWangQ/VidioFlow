# VideoFlow 核心代码附录

---

## 附录 2：后端核心接口代码（Node.js + Express + TypeScript）

### 2.1 JWT 身份认证中间件（权限拦截核心）

**文件路径：** `server/src/middlewares/auth.ts`

```typescript
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { config } from '../config/index.js'
import { User } from '../models/index.js'

export interface AuthRequest extends Request {
  userId?: string
}

// 普通用户认证中间件
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwtSecret as string) as { userId: string; role?: string }
    req.userId = decoded.userId
    ;(req as any).isAdmin = decoded.role === 'admin'
    
    const user = await User.findByPk(decoded.userId)
    if (user) {
      ;(req as any).user = user.toJSON()
    }
    
    next()
  } catch {
    return res.status(401).json({ code: 401, message: 'token无效' })
  }
}

// 管理员权限中间件
export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwtSecret as string) as { userId: string }
    
    // 从数据库查询用户角色，确保权限验证准确
    const user = await User.findByPk(decoded.userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限' })
    }
    
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ code: 401, message: 'token无效' })
  }
}
```

**核心逻辑说明：**
- 从请求头提取 Bearer Token
- 使用 JWT 验证 token 有效性和签名
- 从数据库查询用户信息，确保用户真实存在
- 管理员中间件额外校验 `role === 'admin'`

---

### 2.2 用户登录注册控制器（bcrypt 密码加密逻辑）

**文件路径：** `server/src/controllers/authController.ts`

```typescript
import { Request, Response } from 'express'
import { User } from '../models/index.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateToken } from '../utils/jwt.js'
import { Op } from 'sequelize'

export const authController = {
  // 用户注册
  async register(req: Request, res: Response) {
    const { username, email, password } = req.body

    // 检查用户/邮箱是否已存在
    const existingUser = await User.findOne({ 
      where: { [Op.or]: [{ email }, { username }] } 
    })
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户或邮箱已存在' })
    }

    // bcrypt 加密密码（加盐哈希）
    const hashedPassword = await hashPassword(password)
    const user = await User.create({ username, email, password: hashedPassword })

    // 生成 JWT Token
    const token = generateToken(user.id.toString(), user.role)
    const userData = user.toJSON()
    delete userData.password  // 返回时移除密码字段

    res.json({ code: 0, message: '注册成功', data: { token, user: userData } })
  },

  // 用户登录
  async login(req: Request, res: Response) {
    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ code: 401, message: '邮箱或密码错误' })
    }

    // bcrypt 验证密码
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return res.status(401).json({ code: 401, message: '邮箱或密码错误' })
    }

    const token = generateToken(user.id.toString(), user.role)
    const userData = user.toJSON()
    delete userData.password

    res.json({ code: 0, message: '登录成功', data: { token, user: userData } })
  }
}
```

---

### 2.3 视频审核接口核心代码（状态修改逻辑）

**文件路径：** `server/src/controllers/videoController.ts`

```typescript
import { Request, Response } from 'express'
import { Video, User, Subscription } from '../models/index.js'
import { notificationController } from './notificationController.js'

export const videoController = {
  // 获取待审核视频列表
  async getPendingVideos(req: Request, res: Response) {
    const authReq = req as any
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    const where: any = { status: 0 }  // status: 0 表示待审核
    
    // 非管理员只能查看自己的待审核视频
    if (!authReq.isAdmin) {
      where.userId = authReq.userId
    }

    const { count, rows } = await Video.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    res.json({ code: 0, message: 'success', data: { items: rows, total: count, page, limit } })
  },

  // 审核通过
  async approveVideo(req: Request, res: Response) {
    const { id } = req.params

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    // 状态修改：status = 1 表示通过
    await video.update({ status: 1 })

    // 发送审核通过通知给视频作者
    notificationController.createNotification(
      video.userId,
      'approval',
      '你的视频已通过审核',
      `/video/${id}`
    ).catch(console.error)

    // 通知订阅者新视频发布
    const subscribers = await Subscription.findAll({ where: { creatorId: video.userId } })
    subscribers.forEach(sub => {
      notificationController.createNotification(
        sub.subscriberId,
        'upload',
        '你关注的UP主发布了新视频',
        `/video/${id}`
      ).catch(console.error)
    })

    res.json({ code: 0, message: '审核通过', data: video })
  },

  // 审核拒绝
  async rejectVideo(req: Request, res: Response) {
    const { id } = req.params
    const { reason } = req.body

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    // 状态修改：status = -1 表示拒绝，并记录拒绝原因
    await video.update({ status: -1, rejectReason: reason || '' })

    res.json({ code: 0, message: '已拒绝', data: null })
  },

  // 重新提交审核
  async resubmitVideo(req: Request, res: Response) {
    const { id } = req.params

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    // 状态修改：status = 0 表示重新进入待审核状态
    await video.update({ status: 0, rejectReason: '' })

    res.json({ code: 0, message: '已重新提交审核', data: null })
  }
}
```

**视频审核状态说明：**
| 状态值 | 含义 |
|--------|------|
| `0` | 待审核 |
| `1` | 已通过 |
| `-1` | 已拒绝 |

---

### 2.4 创新反馈模块完整接口（举报审核系统）

**文件路径：** `server/src/controllers/reportController.ts`

```typescript
import { Request, Response } from 'express'
import { Report, Video, Comment, User } from '../models/index.js'
import { notificationController } from './notificationController.js'

export const reportController = {
  // 提交举报
  async createReport(req: Request, res: Response) {
    const authReq = req as any
    const reporterId = parseInt(authReq.userId) || 0
    const { targetId, targetType, reason } = req.body

    if (!['video', 'comment'].includes(targetType)) {
      return res.status(400).json({ code: 400, message: '举报类型无效' })
    }

    // 获取被举报内容的作者ID
    let targetUserId: number
    if (targetType === 'video') {
      const video = await Video.findByPk(targetId)
      if (!video) return res.status(404).json({ code: 404, message: '视频不存在' })
      targetUserId = video.userId
    } else {
      const comment = await Comment.findByPk(targetId)
      if (!comment) return res.status(404).json({ code: 404, message: '评论不存在' })
      targetUserId = comment.userId
    }

    // 禁止举报自己
    if (reporterId === targetUserId) {
      return res.status(400).json({ code: 400, message: '不能举报自己' })
    }

    // 防止重复举报
    const existingReport = await Report.findOne({
      where: { reporterId, targetId, targetType }
    })
    if (existingReport) {
      return res.status(400).json({ code: 400, message: '您已举报过该内容' })
    }

    const report = await Report.create({
      reporterId, targetId, targetType, targetUserId, reason
    })

    res.json({ code: 0, message: '举报成功，管理员将尽快审核', data: report })
  },

  // 处理举报（管理员）
  async handleReport(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0
    const { id } = req.params
    const { status } = req.body  // 'approved' 或 'rejected'

    // 管理员权限校验
    const user = await User.findByPk(userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限操作' })
    }

    const report = await Report.findByPk(id)
    if (!report || report.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '举报不存在或已处理' })
    }

    // 更新举报状态
    await report.update({ status, handledAt: new Date(), handledBy: userId })

    // 如果举报通过，处理违规内容
    if (status === 'approved') {
      if (report.targetType === 'video') {
        await Video.update({ status: 'rejected' }, { where: { id: report.targetId } })
      } else {
        await Comment.destroy({ where: { id: report.targetId } })
      }
    }

    // 发送通知给举报人和被举报人
    const targetTypeName = report.targetType === 'video' ? '视频' : '评论'
    const statusText = status === 'approved' ? '已通过' : '未通过'

    await notificationController.createNotification(
      report.reporterId, 'report',
      `您举报的${targetTypeName}审核${statusText}`, `/video/${report.targetId}`
    )

    if (status === 'approved') {
      await notificationController.createNotification(
        report.targetUserId, 'report',
        `您的${targetTypeName}因举报被处理`, `/video/${report.targetId}`
      )
    }

    res.json({ code: 0, message: '处理成功', data: report })
  }
}
```

---

## 附录 3：前端核心页面组件代码（Vue3 + TypeScript）

### 3.1 路由守卫代码（页面权限控制）

**文件路径：** `client/src/router/index.ts`

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('../pages/Upload.vue'),
    meta: { requiresAuth: true }  // 需要登录
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../pages/Admin.vue'),
    meta: { requiresAuth: true }  // 需要登录（管理员角色在页面内校验）
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../pages/Notification.vue'),
    meta: { requiresAuth: true }
  }
  // ... 其他路由
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  
  // 需要登录的页面，未登录则跳转登录页
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // 管理员用户强制跳转管理后台
  if (userRole === 'admin') {
    if (to.path === '/admin') {
      next()
    } else if (to.path === '/login' || to.path === '/register') {
      next()
    } else {
      next('/admin')
    }
    return
  }
  
  next()
})

export default router
```

**权限控制逻辑说明：**
- `meta.requiresAuth` 标记需要登录的页面
- 未登录用户访问需登录页面 → 跳转 `/login`
- 管理员用户访问普通页面 → 强制跳转 `/admin`

---

### 3.2 视频播放核心组件（进度记忆逻辑）

**文件路径：** `client/src/pages/VideoDetail.vue`

```typescript
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useVideoStore } from '../stores/video'
import { useUserStore } from '../stores/user'
import { watchHistoryApi } from '../api'

const route = useRoute()
const videoStore = useVideoStore()
const userStore = useUserStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const savedProgress = ref(0)
let progressTimer: number | null = null

// 组件挂载时获取历史播放进度
onMounted(async () => {
  const id = route.params.id as string
  await videoStore.fetchVideo(id)
  
  if (userStore.isLoggedIn) {
    try {
      const historyRes = await watchHistoryApi.getHistory(1, 100)
      const history = historyRes.data?.items || []
      const videoHistory = history.find((h: any) => h.videoId === parseInt(id))
      if (videoHistory) {
        savedProgress.value = videoHistory.progress  // 获取上次播放进度
      }
    } catch (err) {
      console.error('获取观看历史失败', err)
    }
  }
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
})

// 视频加载完成后恢复播放进度
const handleLoadedMetadata = () => {
  if (videoRef.value && savedProgress.value > 0) {
    videoRef.value.currentTime = savedProgress.value  // 恢复进度
  }
}

// 播放过程中定时保存进度
const handleTimeUpdate = () => {
  if (!videoRef.value || !userStore.isLoggedIn) return
  
  if (!progressTimer) {
    const videoId = parseInt(route.params.id as string)
    
    // 每秒保存一次播放进度
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
    
    // 记录开始观看
    watchHistoryApi.addHistory(videoId, 0).catch(console.error)
  }
}
```

**进度记忆核心逻辑：**
1. 组件挂载时从历史记录获取上次播放进度
2. 视频元数据加载完成后设置 `currentTime` 恢复进度
3. 播放过程中每秒定时保存当前进度到数据库

---

### 3.3 视频上传表单组件（文件校验、上传进度）

**文件路径：** `client/src/pages/Upload.vue`

```typescript
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore } from '../stores/video'
import { uploadApi } from '../api'

const router = useRouter()
const videoStore = useVideoStore()

const form = reactive({
  title: '',
  description: '',
  url: '',
  cover: '',
  duration: 0,
  category: ''
})

const uploadingVideo = ref(false)
const uploadProgress = ref(0)
const videoFile = ref<File | null>(null)
const error = ref('')

// 文件大小格式化
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

// 获取视频时长
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      resolve(0)
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

// 视频文件选择处理
const handleVideoChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  videoFile.value = file
  uploadingVideo.value = true
  uploadProgress.value = 0
  error.value = ''

  try {
    // 获取视频时长
    const duration = await getVideoDuration(file)
    form.duration = Math.floor(duration)

    // 上传视频文件
    const res = await uploadApi.uploadVideo(file)
    form.url = res.data!.url
    uploadProgress.value = 100

    // 自动截取视频帧作为封面
    if (!form.cover) {
      const frameDataUrl = await captureVideoFrame(file)
      const frameBlob = dataUrlToBlob(frameDataUrl)
      const frameFile = new File([frameBlob], 'cover.jpg', { type: 'image/jpeg' })
      
      const coverRes = await uploadApi.uploadCover(frameFile)
      form.cover = coverRes.data!.url
    }
  } catch (err: any) {
    error.value = err.message || '视频上传失败'
    videoFile.value = null
  } finally {
    uploadingVideo.value = false
  }
}

// 提交上传
const handleSubmit = async () => {
  if (!form.title || !form.url) {
    error.value = '请填写必填项'
    return
  }

  loading.value = true
  try {
    await videoStore.uploadVideo({ ...form, tags: selectedTags.value })
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '发布失败'
  } finally {
    loading.value = false
  }
}
```

---

### 3.4 审核后台页面核心逻辑（视频审核通过/拒绝弹窗）

**文件路径：** `client/src/pages/Admin.vue`

```typescript
import { ref, computed, onMounted } from 'vue'
import { videoApi, reportApi } from '../api'
import type { Video } from '../types'

const currentTab = ref<'videos' | 'reports'>('videos')
const pendingVideos = ref<Video[]>([])
const reports = ref<any[]>([])

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

// 获取待审核视频
const fetchPendingVideos = async () => {
  loading.value = true
  try {
    const res = await videoApi.getPending(page.value, limit)
    pendingVideos.value = res.data?.items || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

// 审核通过
const approveVideo = async (id: number) => {
  try {
    await videoApi.approve(id)
    pendingVideos.value = pendingVideos.value.filter(v => v.id !== id)
  } catch (err) {
    console.error('审核失败', err)
  }
}

// 打开拒绝弹窗
const openRejectModal = (video: Video) => {
  rejectVideoData.value = video
  selectedRejectReason.value = ''
  customRejectReason.value = ''
  showRejectModal.value = true
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectVideoData.value) return
  
  let reason = ''
  if (selectedRejectReason.value === 'other') {
    reason = customRejectReason.value.trim()
  } else {
    const reasonOption = rejectReasons.find(r => r.value === selectedRejectReason.value)
    reason = reasonOption?.label || ''
  }

  try {
    await videoApi.reject(rejectVideoData.value.id, reason)
    pendingVideos.value = pendingVideos.value.filter(v => v.id !== rejectVideoData.value?.id)
    closeRejectModal()
  } catch (err) {
    console.error('拒绝失败', err)
  }
}

// 处理举报
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
```

---

### 3.5 用户反馈页面组件（举报功能前端完整代码）

**文件路径：** `client/src/components/ReportModal.vue`

```typescript
import { reactive, computed } from 'vue'
import { reportApi } from '../api'
import { useUserStore } from '../stores/user'

interface Props {
  visible: boolean
  targetId: number
  targetType: 'video' | 'comment'
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'success'])

const userStore = useUserStore()

const form = reactive({
  reason: '',
  description: '',
  confirm: false
})

const targetTypeName = computed(() => props.targetType === 'video' ? '视频' : '评论')

// 提交举报
const handleSubmit = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }

  if (!form.reason) {
    alert('请选择举报原因')
    return
  }

  if (!form.confirm) {
    alert('请确认该内容违反社区规范')
    return
  }

  try {
    const reason = form.description ? `${form.reason}: ${form.description}` : form.reason
    await reportApi.createReport(props.targetId, props.targetType, reason)
    alert('举报成功，管理员将尽快审核')
    handleClose()
    emit('success')
  } catch (error: any) {
    alert(error.message || '举报失败')
  }
}

// 关闭弹窗并清空表单
const handleClose = () => {
  form.reason = ''
  form.description = ''
  form.confirm = false
  emit('close')
}
```

---

## 附录 4：安全防护工具类完整代码

### 4.1 密码加盐加密工具（bcrypt 封装函数）

**文件路径：** `server/src/utils/password.ts`

```typescript
import bcrypt from 'bcryptjs'

// 密码加密（自动加盐，cost factor = 10）
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

// 密码验证
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}
```

**安全说明：**
- bcrypt 自动生成随机盐值（salt）
- cost factor = 10 表示 2^10 次哈希迭代，增加破解难度
- 每次加密结果不同（盐值嵌入哈希结果中）

---

### 4.2 文件上传校验工具（后缀、MIME、大小校验）

**文件路径：** `server/src/config/upload.ts`

```typescript
import multer, { type FileFilterCallback } from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'

// 文件类型白名单校验
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true)  // 允许上传
  } else if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true)  // 允许上传
  } else {
    cb(new Error('不支持的文件类型'))  // 拒绝上传
  }
}

// 视频上传配置（大小限制 500MB）
export const uploadVideo = multer({
  storage: createStorage('videos'),
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
})

// 封面上传配置（大小限制 10MB）
export const uploadCover = multer({
  storage: createStorage('covers'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})
```

**安全校验说明：**
| 校验项 | 视频文件 | 图片文件 |
|--------|----------|----------|
| MIME类型白名单 | mp4, webm, ogg, mov | jpeg, png, gif, webp |
| 大小限制 | 500MB | 10MB |
| 文件名处理 | UUID随机命名，防止路径遍历 |

---

### 4.3 JWT Token 生成工具

**文件路径：** `server/src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

// 生成 JWT Token
export const generateToken = (userId: string, role: string = 'user'): string => {
  return jwt.sign(
    { userId, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  )
}
```

---

### 4.4 接口统一错误处理中间件

**文件路径：** `server/src/middlewares/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express'

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message)

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({ code: 400, message: err.message })
  }

  // ID格式错误
  if (err.name === 'CastError') {
    return res.status(400).json({ code: 400, message: 'ID格式错误' })
  }

  // 其他错误统一返回500
  res.status(500).json({ code: 500, message: '服务器内部错误' })
}
```

**错误处理策略：**
- 捕获所有未处理的异常
- 根据错误类型返回对应状态码
- 验证错误 → 400
- 格式错误 → 400
- 其他错误 → 500（隐藏内部细节）

---

## 附录 5：数据库模型定义

### 5.1 举报模型（Report）

**文件路径：** `server/src/models/Report.ts`

```typescript
import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Report extends Model {
  declare id: number
  declare reporterId: number      // 举报人ID
  declare targetId: number        // 被举报内容ID
  declare targetType: 'video' | 'comment'  // 举报类型
  declare targetUserId: number    // 被举报人ID
  declare reason: string          // 举报原因
  declare status: 'pending' | 'approved' | 'rejected'  // 处理状态
  declare handledAt: Date | null  // 处理时间
  declare handledBy: number | null  // 处理人ID
}

Report.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reporterId: { type: DataTypes.INTEGER, allowNull: false },
  targetId: { type: DataTypes.INTEGER, allowNull: false },
  targetType: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: { isIn: [['video', 'comment']] }
  },
  targetUserId: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { 
    type: DataTypes.STRING, 
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'approved', 'rejected']] }
  },
  handledAt: { type: DataTypes.DATE, allowNull: true },
  handledBy: { type: DataTypes.INTEGER, allowNull: true }
}, {
  sequelize,
  modelName: 'Report',
  tableName: 'reports',
  timestamps: true
})
```

---

## 附录 6：API 接口汇总表

### 6.1 后端 API 接口列表

| 模块 | 接口路径 | 方法 | 权限 | 功能说明 |
|------|----------|------|------|----------|
| **认证** | `/api/auth/login` | POST | 公开 | 用户登录 |
| | `/api/auth/register` | POST | 公开 | 用户注册 |
| | `/api/auth/me` | GET | 登录 | 获取当前用户信息 |
| **视频** | `/api/videos` | GET | 公开 | 获取视频列表 |
| | `/api/videos` | POST | 登录 | 上传视频 |
| | `/api/videos/:id` | GET | 公开 | 获取视频详情 |
| | `/api/videos/:id/approve` | PUT | 管理员 | 审核通过 |
| | `/api/videos/:id/reject` | PUT | 管理员 | 审核拒绝 |
| | `/api/videos/pending/list` | GET | 管理员 | 获取待审核列表 |
| **举报** | `/api/reports` | POST | 登录 | 提交举报 |
| | `/api/reports` | GET | 管理员 | 获取举报列表 |
| | `/api/reports/:id/handle` | PUT | 管理员 | 处理举报 |
| | `/api/reports/my` | GET | 登录 | 获取我的举报记录 |
| **通知** | `/api/notifications` | GET | 登录 | 获取通知列表 |
| | `/api/notifications/unread-count` | GET | 登录 | 获取未读数量 |
| | `/api/notifications/read/:id` | PUT | 登录 | 标记已读 |

---

**文档生成时间：** 2026-06-17

**项目技术栈：**
- 后端：Node.js + Express + TypeScript + Sequelize + MySQL
- 前端：Vue3 + TypeScript + Vite + Pinia
- 安全：bcrypt + JWT + Multer 文件校验