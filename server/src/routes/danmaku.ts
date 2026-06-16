import { Router } from 'express'
import { danmakuController } from '../controllers/index.js'
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/index.js'

const router = Router()

router.get('/videos/:videoId/danmaku', optionalAuthMiddleware, danmakuController.getDanmaku)
router.get('/videos/:videoId/danmaku/by-time', optionalAuthMiddleware, danmakuController.getDanmakuByTime)
router.post('/videos/:videoId/danmaku', authMiddleware, danmakuController.sendDanmaku)
router.delete('/danmaku/:id', authMiddleware, danmakuController.deleteDanmaku)

export default router