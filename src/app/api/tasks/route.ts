import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, type SessionData } from '@/lib/session'
import { Shift, RoleType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.storeId) return NextResponse.json({ error: 'Неоторизиран' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const shift = searchParams.get('shift') as Shift | null
  const role = searchParams.get('role') as RoleType | null
  const storeId = searchParams.get('storeId')

  const targetStoreId = session.role === 'MANAGER' && storeId
    ? Number(storeId)
    : session.storeId

  const today = new Date().toISOString().split('T')[0]

  const tasks = await prisma.task.findMany({
    where: {
      storeId: targetStoreId,
      active: true,
      ...(shift ? { shift } : {}),
      ...(role ? { role } : {}),
    },
    include: {
      completions: { where: { date: today } },
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят може да добавя задачи' }, { status: 403 })

  const { storeId, role, shift, title } = await req.json()
  const count = await prisma.task.count({ where: { storeId: Number(storeId), role, shift } })

  const task = await prisma.task.create({
    data: { storeId: Number(storeId), role, shift, title, order: count },
  })

  return NextResponse.json(task)
}
