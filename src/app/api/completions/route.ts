export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, type SessionData } from '@/lib/session'
import { ROLE_LABELS, SHIFT_LABELS } from '@/lib/types'

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.storeId || !session.role) return NextResponse.json({ error: 'Неоторизиран' }, { status: 401 })

  const { taskId } = await req.json()
  const today = new Date().toISOString().split('T')[0]

  const task = await prisma.task.findUnique({ where: { id: Number(taskId) } })
  if (!task) return NextResponse.json({ error: 'Задачата не е намерена' }, { status: 404 })

  const completion = await prisma.taskCompletion.upsert({
    where: { taskId_date: { taskId: Number(taskId), date: today } },
    update: {},
    create: { taskId: Number(taskId), date: today },
  })

  await prisma.notification.create({
    data: {
      storeId: task.storeId,
      message: `✓ ${ROLE_LABELS[session.role as keyof typeof ROLE_LABELS]} (${SHIFT_LABELS[task.shift as keyof typeof SHIFT_LABELS]}) изпълни: "${task.title}"`,
    },
  })

  return NextResponse.json(completion)
}

export async function DELETE(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.storeId || !session.role) return NextResponse.json({ error: 'Неоторизиран' }, { status: 401 })

  const { taskId } = await req.json()
  const today = new Date().toISOString().split('T')[0]

  await prisma.taskCompletion.deleteMany({
    where: { taskId: Number(taskId), date: today },
  })

  return NextResponse.json({ ok: true })
}
