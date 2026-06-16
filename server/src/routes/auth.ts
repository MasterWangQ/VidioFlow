import { Router } from 'express'
import { authController } from '../controllers/index.js'
import { authMiddleware } from '../middlewares/index.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authMiddleware, authController.getMe)

export default router
