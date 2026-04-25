import { Router } from 'express'
import { getCountries, getCountryByCode, searchCountries } from '../controllers/countries'

const router = Router()

router.get('/', getCountries)
router.get('/search', searchCountries)
router.get('/:code', getCountryByCode)

export default router