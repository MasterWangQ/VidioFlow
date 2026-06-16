import { Router } from 'express'
import { userController } from '../controllers/index.js'
import { authMiddleware } from '../middlewares/index.js'

const router = Router()

router.get('/:id', userController.getUser)
router.put('/:id', authMiddleware, userController.updateUser)
router.put('/:id/avatar', authMiddleware, userController.updateAvatar)
router.get('/:id/videos', authMiddleware, userController.getUserVideos)
router.get('/:id/favorites', authMiddleware, userController.getUserFavorites)
router.get('/:id/subscriptions', authMiddleware, userController.getUserSubscriptions)

export default router
