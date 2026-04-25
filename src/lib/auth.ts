import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Request, Response, NextFunction } from 'express'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export const hashPassword = (password: string) => bcrypt.hash(password, 12)
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash)

export function signAccessToken(userId: string) {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '30d' })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as { userId: string }
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const payload = verifyAccessToken(token)
    ;(req as any).userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' })
  }
}