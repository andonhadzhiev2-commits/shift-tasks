export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят' }, { status: 403 })

  const pins = await prisma.rolePin.findMany({
    where: { storeId: session.storeId },
  })

  return NextResponse.json(pins)
}

export async function PATCH(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят' }, { status: 403 })

  const { role, pin } = await req.json()

  const updated = await prisma.rolePin.update({
    where: { storeId_role: { storeId: session.storeId!, role } },
    data: { pin },
  })

  return NextResponse.json(updated)
}
