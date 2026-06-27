import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят може да редактира задачи' }, { status: 403 })

  const { title, active } = await req.json()
  const task = await prisma.task.update({
    where: { id: Number(params.id) },
    data: { ...(title !== undefined ? { title } : {}), ...(active !== undefined ? { active } : {}) },
  })

  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (session.role !== 'MANAGER') return NextResponse.json({ error: 'Само управителят може да изтрива задачи' }, { status: 403 })

  await prisma.task.update({ where: { id: Number(params.id) }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
