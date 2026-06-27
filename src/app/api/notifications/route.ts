import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions } from '@/lib/session'

export async function GET() {
  const session = await getIronSession(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят' }, { status: 403 })

  const notifications = await prisma.notification.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(req: NextRequest) {
  const session = await getIronSession(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят' }, { status: 403 })

  await prisma.notification.updateMany({
    where: { storeId: session.storeId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}
