import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  if (isConnected) {
    console.log('MongoDB: using existing connection')
    return
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env')
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
    })
    isConnected = true
    console.log('MongoDB: connected successfully')
  } catch (error) {
    console.error('MongoDB: connection failed', error)
    process.exit(1)
  }
}