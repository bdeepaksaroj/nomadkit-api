import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from '../lib/mongodb'
import { Country } from '../models/Country'
import fs from 'fs'
import path from 'path'

async function seed() {
  await connectDB()
  console.log('Starting seed...')

  const dataDir = path.join(__dirname, '../../data')

  const emergency = JSON.parse(fs.readFileSync(path.join(dataDir, 'emergency.json'), 'utf-8'))
  const food = JSON.parse(fs.readFileSync(path.join(dataDir, 'food.json'), 'utf-8'))
  const scams = JSON.parse(fs.readFileSync(path.join(dataDir, 'scams.json'), 'utf-8'))
  const transport = JSON.parse(fs.readFileSync(path.join(dataDir, 'transport.json'), 'utf-8'))
  const visa = JSON.parse(fs.readFileSync(path.join(dataDir, 'visa.json'), 'utf-8'))

  const foodMap = new Map(food.countries.map((c: any) => [c.code, c]))
  const scamsMap = new Map(scams.countries.map((c: any) => [c.code, c]))
  const transportMap = new Map(transport.countries.map((c: any) => [c.code, c]))
  const visaMap = new Map(visa.countries.map((c: any) => [c.code, c]))

  let inserted = 0
  let updated = 0

  for (const country of emergency.countries) {
    const code = country.code

    await Country.findOneAndUpdate(
      { code },
      {
        name: country.name,
        code: country.code,
        flag: country.flag,
        emergency: {
          police: country.police,
          ambulance: country.ambulance,
          fire: country.fire,
          tourist: country.tourist,
        },
        food: foodMap.get(code) || null,
        scams: scamsMap.get(code) || null,
        transport: transportMap.get(code) || null,
        visa: visaMap.get(code) || null,
      },
      { upsert: true, new: true }
    )

    inserted++
    if (inserted % 20 === 0) console.log(`Processed ${inserted} countries...`)
  }

  console.log(`Seed complete. Total: ${inserted} countries processed.`)
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})