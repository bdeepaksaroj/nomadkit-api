import { Router } from 'express'
import {
  register,
  verifyEmail,
  login,
  logout,
  refresh,
  resendOTP,
} from '../controllers/auth'

const router = Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.post('/resend-otp', resendOTP)

export default router