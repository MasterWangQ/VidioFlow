import { Router } from 'express'
import { notificationController } from '../controllers/index.js'
import { authMiddleware } from '../middlewares/index.js'

const router = Router()

router.get('/notifications', authMiddleware, notificationController.getNotifications)
router.get('/notifications/unread-count', authMiddleware, notificationController.getUnreadCount)
router.put('/notifications/read/:id?', authMiddleware, notificationController.markAsRead)
router.delete('/notifications/:id', authMiddleware, notificationController.deleteNotification)

export default router