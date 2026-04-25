import { Router } from 'express'
import { 
  getCountries, 
  getCountryByCode, 
  searchCountries,
  getCountryFood,
  getCountryScams,
  getCountryTransport,
  getCountryVisa,
} from '../controllers/countries'

const router = Router()

router.get('/', getCountries)
router.get('/search', searchCountries)
router.get('/:code', getCountryByCode)
router.get('/:code/food', getCountryFood)
router.get('/:code/scams', getCountryScams)
router.get('/:code/transport', getCountryTransport)
router.get('/:code/visa', getCountryVisa)

export default router