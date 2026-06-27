export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { storeId, pin } = await req.json()

  if (!storeId || !pin) {
    return NextResponse.json({ error: 'Липсват данни' }, { status: 400 })
  }

  const rolePin = await prisma.rolePin.findFirst({
    where: { storeId: Number(storeId), pin },
    include: { store: true },
  })

  if (!rolePin) {
    return NextResponse.json({ error: 'Невалиден PIN' }, { status: 401 })
  }

  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  session.storeId = rolePin.storeId
  session.storeName = rolePin.store.name
  session.role = rolePin.role as SessionData['role']
  await session.save()

  return NextResponse.json({ role: rolePin.role, storeName: rolePin.store.name })
}
