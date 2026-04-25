import { Request, Response } from 'express'
import { redis } from '../lib/redis'

const CACHE_TTL = 60 * 55 // 55 minutes

export async function getRates(req: Request, res: Response) {
  try {
    const cacheKey = 'currency:rates'
    const cached = await redis.get(cacheKey)
    if (cached) {
      res.json({ data: cached, source: 'cache' })
      return
    }

    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`)
    const data = await response.json() as any

    if (data.result !== 'success') {
      res.status(500).json({ error: 'Failed to fetch exchange rates' })
      return
    }

    const rates = {
      base: 'USD',
      lastUpdated: data.time_last_update_utc,
      rates: data.conversion_rates,
    }

    await redis.set(cacheKey, JSON.stringify(rates), { ex: CACHE_TTL })
    res.json({ data: rates, source: 'api' })
  } catch (error) {
    console.error('getRates error:', error)
    res.status(500).json({ error: 'Currency service unavailable' })
  }
}

export async function convert(req: Request, res: Response) {
  try {
    const { from, to, amount } = req.query

    if (!from || !to || !amount) {
      res.status(400).json({ error: 'from, to, and amount are required' })
      return
    }

    const cacheKey = 'currency:rates'
    let ratesData: any = await redis.get(cacheKey)

    if (!ratesData) {
      const apiKey = process.env.EXCHANGE_RATE_API_KEY
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`)
      const data = await response.json() as any
      ratesData = JSON.stringify({
        base: 'USD',
        lastUpdated: data.time_last_update_utc,
        rates: data.conversion_rates,
      })
      await redis.set(cacheKey, ratesData, { ex: CACHE_TTL })
    }

    const parsed = typeof ratesData === 'string' ? JSON.parse(ratesData) : ratesData
    const rates = parsed.rates

    const fromRate = rates[String(from).toUpperCase()]
    const toRate = rates[String(to).toUpperCase()]

    if (!fromRate || !toRate) {
      res.status(400).json({ error: 'Invalid currency code' })
      return
    }

    const amountNum = parseFloat(String(amount))
    const converted = (amountNum / fromRate) * toRate

    res.json({
      from: String(from).toUpperCase(),
      to: String(to).toUpperCase(),
      amount: amountNum,
      converted: Math.round(converted * 100) / 100,
      rate: Math.round((toRate / fromRate) * 10000) / 10000,
    })
  } catch (error) {
    console.error('convert error:', error)
    res.status(500).json({ error: 'Conversion failed' })
  }
}