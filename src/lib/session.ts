import type { SessionOptions } from 'iron-session'

export interface SessionData {
  storeId?: number
  storeName?: string
  role?: 'CASHIER' | 'WEIGHER' | 'WAREHOUSE' | 'BAR' | 'FLOOR_MANAGER' | 'MANAGER'
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex-password-at-least-32-characters-long-here',
  cookieName: 'shift-tasks-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}
