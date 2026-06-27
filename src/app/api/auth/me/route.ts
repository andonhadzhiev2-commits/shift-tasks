import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'

export async function GET() {
  const session = await getIronSession(cookies(), sessionOptions)
  if (!session.role) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({
    authenticated: true,
    role: session.role,
    storeId: session.storeId,
    storeName: session.storeName,
  })
}
