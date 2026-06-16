import { Router } from 'express'
import { commentController } from '../controllers/index.js'
import { authMiddleware } from '../middlewares/index.js'

const router = Router()

router.get('/videos/:videoId/comments', commentController.getComments)
router.post('/videos/:videoId/comments', authMiddleware, commentController.createComment)
router.delete('/comments/:id', authMiddleware, commentController.deleteComment)

export default router
