import { Router } from 'express'
import { watchHistoryController } from '../controllers/watchHistoryController.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', watchHistoryController.getHistory)
router.post('/', watchHistoryController.addHistory)
router.delete('/:id', watchHistoryController.deleteHistory)
router.delete('/', watchHistoryController.clearHistory)

export default router
