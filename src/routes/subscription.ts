import { Router } from 'express'
import { requireAuth } from '../lib/auth'
import {
  createSubscription,
  getSubscriptionStatus,
  cancelUserSubscription,
  webhookHandler,
} from '../controllers/subscription'

const router = Router()

router.post('/webhook', webhookHandler)
router.post('/activate', requireAuth, createSubscription)
router.get('/status', requireAuth, getSubscriptionStatus)
router.post('/cancel', requireAuth, cancelUserSubscription)

export default router