export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят' }, { status: 403 })

  const { orderedIds } = await req.json() as { orderedIds: number[] }

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.task.update({ where: { id }, data: { order: index } })
    )
  )

  return NextResponse.json({ ok: true })
}
