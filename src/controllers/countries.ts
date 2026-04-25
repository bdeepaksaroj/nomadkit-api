import { Request, Response } from 'express'
import { connectDB } from '../lib/mongodb'
import { redis } from '../lib/redis'
import { Country } from '../models/Country'

const CACHE_TTL = 86400 // 24 hours

export async function getCountries(req: Request, res: Response) {
  try {
    const cacheKey = 'countries:all'
    const cached = await redis.get(cacheKey)
    if (cached) {
      res.json({ data: cached, source: 'cache' })
      return
    }

    await connectDB()
    const countries = await Country.find({}, 'name code flag').lean()
    await redis.set(cacheKey, JSON.stringify(countries), { ex: CACHE_TTL })

    res.json({ data: countries, source: 'db' })
  } catch (error) {
    console.error('getCountries error:', error)
    res.status(500).json({ error: 'Failed to fetch countries' })
  }
}

export async function getCountryByCode(req: Request, res: Response) {
  try {
    const code = req.params.code as string
    const upperCode = code.toUpperCase()
    const cacheKey = `country:${upperCode}`

    const cached = await redis.get(cacheKey)
    if (cached) {
      res.json({ data: cached, source: 'cache' })
      return
    }

    await connectDB()
    const country = await Country.findOne({ code: upperCode }).lean()

    if (!country) {
      res.status(404).json({ error: 'Country not found' })
      return
    }

    await redis.set(cacheKey, JSON.stringify(country), { ex: CACHE_TTL })
    res.json({ data: country, source: 'db' })
  } catch (error) {
    console.error('getCountryByCode error:', error)
    res.status(500).json({ error: 'Failed to fetch country' })
  }
}

export async function searchCountries(req: Request, res: Response) {
  try {
    const q = req.query.q as string
    if (!q || q.trim().length < 1) {
      res.status(400).json({ error: 'Search query required' })
      return
    }

    await connectDB()
    const countries = await Country.find(
      { $text: { $search: q } },
      'name code flag'
    ).limit(20).lean()

    res.json({ data: countries })
  } catch (error) {
    console.error('searchCountries error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}

export async function getCountryFood(req: Request, res: Response) {
  try {
    const code = req.params.code as string
    const upperCode = code.toUpperCase()
    const cacheKey = `country:${upperCode}:food`

    const cached = await redis.get(cacheKey)
    if (cached) { res.json({ data: cached, source: 'cache' }); return }

    await connectDB()
    const country = await Country.findOne({ code: upperCode }, 'name code flag food').lean()
    if (!country) { res.status(404).json({ error: 'Country not found' }); return }

    await redis.set(cacheKey, JSON.stringify(country), { ex: CACHE_TTL })
    res.json({ data: country, source: 'db' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch food data' })
  }
}

export async function getCountryScams(req: Request, res: Response) {
  try {
    const code = req.params.code as string
    const upperCode = code.toUpperCase()
    const cacheKey = `country:${upperCode}:scams`

    const cached = await redis.get(cacheKey)
    if (cached) { res.json({ data: cached, source: 'cache' }); return }

    await connectDB()
    const country = await Country.findOne({ code: upperCode }, 'name code flag scams').lean()
    if (!country) { res.status(404).json({ error: 'Country not found' }); return }

    await redis.set(cacheKey, JSON.stringify(country), { ex: CACHE_TTL })
    res.json({ data: country, source: 'db' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scams data' })
  }
}

export async function getCountryTransport(req: Request, res: Response) {
  try {
    const code = req.params.code as string
    const upperCode = code.toUpperCase()
    const cacheKey = `country:${upperCode}:transport`

    const cached = await redis.get(cacheKey)
    if (cached) { res.json({ data: cached, source: 'cache' }); return }

    await connectDB()
    const country = await Country.findOne({ code: upperCode }, 'name code flag transport').lean()
    if (!country) { res.status(404).json({ error: 'Country not found' }); return }

    await redis.set(cacheKey, JSON.stringify(country), { ex: CACHE_TTL })
    res.json({ data: country, source: 'db' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transport data' })
  }
}

export async function getCountryVisa(req: Request, res: Response) {
  try {
    const code = req.params.code as string
    const upperCode = code.toUpperCase()
    const cacheKey = `country:${upperCode}:visa`

    const cached = await redis.get(cacheKey)
    if (cached) { res.json({ data: cached, source: 'cache' }); return }

    await connectDB()
    const country = await Country.findOne({ code: upperCode }, 'name code flag visa').lean()
    if (!country) { res.status(404).json({ error: 'Country not found' }); return }

    await redis.set(cacheKey, JSON.stringify(country), { ex: CACHE_TTL })
    res.json({ data: country, source: 'db' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visa data' })
  }
}