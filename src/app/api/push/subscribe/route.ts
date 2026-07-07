import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { prisma } from '@/lib/prisma'
import { sessionOptions } from '@/lib/session'
import type { SessionData } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.storeId || !session.role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, role: session.role, storeId: session.storeId },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, role: session.role, storeId: session.storeId },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json()
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
