import { Router } from 'express'
import { getRates, convert } from '../controllers/currency'

const router = Router()

router.get('/rates', getRates)
router.get('/convert', convert)

export default router