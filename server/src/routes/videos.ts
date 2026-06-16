import { Router } from 'express'
import { videoController } from '../controllers/index.js'
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../middlewares/index.js'

const router = Router()

router.get('/', optionalAuthMiddleware, videoController.getVideos)
router.get('/top', optionalAuthMiddleware, videoController.getTopVideos)
router.get('/:id', optionalAuthMiddleware, videoController.getVideo)
router.get('/tags/list', optionalAuthMiddleware, videoController.getTags)
router.post('/', authMiddleware, videoController.createVideo)
router.put('/:id', authMiddleware, videoController.updateVideo)
router.delete('/:id', authMiddleware, videoController.deleteVideo)

router.get('/pending/list', authMiddleware, videoController.getPendingVideos)
router.put('/:id/approve', adminMiddleware, videoController.approveVideo)
router.put('/:id/reject', adminMiddleware, videoController.rejectVideo)
router.put('/:id/resubmit', authMiddleware, videoController.resubmitVideo)

export default router
