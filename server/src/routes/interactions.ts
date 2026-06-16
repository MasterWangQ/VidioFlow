import { Router } from 'express'
import { interactionController } from '../controllers/index.js'
import { authMiddleware } from '../middlewares/index.js'

const router = Router()

router.post('/videos/:id/like', authMiddleware, interactionController.likeVideo)
router.delete('/videos/:id/like', authMiddleware, interactionController.unlikeVideo)
router.post('/videos/:id/favorite', authMiddleware, interactionController.favoriteVideo)
router.delete('/videos/:id/favorite', authMiddleware, interactionController.unfavoriteVideo)
router.post('/users/:id/subscribe', authMiddleware, interactionController.subscribe)
router.delete('/users/:id/subscribe', authMiddleware, interactionController.unsubscribe)

export default router
