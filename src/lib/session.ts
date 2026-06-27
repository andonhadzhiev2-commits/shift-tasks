import { IronSessionOptions } from 'iron-session'

export interface SessionData {
  storeId?: number
  storeName?: string
  role?: 'CASHIER' | 'WEIGHER' | 'WAREHOUSE' | 'MANAGER'
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET || 'complex-password-at-least-32-characters-long-here',
  cookieName: 'shift-tasks-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

declare module 'iron-session' {
  interface IronSessionData extends SessionData {}
}
