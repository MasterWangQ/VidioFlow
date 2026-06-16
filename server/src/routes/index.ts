import { Router } from 'express'
import authRoutes from './auth.js'
import userRoutes from './users.js'
import videoRoutes from './videos.js'
import commentRoutes from './comments.js'
import interactionRoutes from './interactions.js'
import uploadRoutes from './upload.js'
import categoryRoutes from './category.js'
import watchHistoryRoutes from './watchHistory.js'
import danmakuRoutes from './danmaku.js'
import notificationRoutes from './notifications.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/videos', videoRoutes)
router.use('/', commentRoutes)
router.use('/', interactionRoutes)
router.use('/upload', uploadRoutes)
router.use('/categories', categoryRoutes)
router.use('/watch-history', watchHistoryRoutes)
router.use('/', danmakuRoutes)
router.use('/', notificationRoutes)

export default router
