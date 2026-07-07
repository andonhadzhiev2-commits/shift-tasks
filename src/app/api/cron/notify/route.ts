import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentTime() {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: object) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    )
  } catch (err: unknown) {
    // Remove expired/invalid subscriptions
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const status = (err as { statusCode: number }).statusCode
      if (status === 410 || status === 404) {
        await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {})
      }
    }
  }
}

export async function GET(req: Request) {
  const diagnostics: Record<string, string> = {}

  try {
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    )
    diagnostics.vapid = 'ok'
  } catch (e: unknown) {
    return NextResponse.json({ step: 'vapid', error: String(e) })
  }

  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  diagnostics.auth = 'ok'

  const today = getToday()
  const now = getCurrentTime()

  try {
    await prisma.$queryRaw`SELECT 1 FROM "PushSubscription" LIMIT 1`
    diagnostics.db = 'ok'
  } catch (e: unknown) {
    return NextResponse.json({ step: 'db_check', error: String(e), diagnostics })
  }

  // Find tasks starting now (timeFrom matches current HH:MM)
  const startingTasks = await prisma.task.findMany({
    where: { timeFrom: now, active: true },
    include: { completions: { where: { date: today } } },
  })

  // Find overdue tasks (timeTo < now, not completed)
  const allTimedTasks = await prisma.task.findMany({
    where: { timeTo: { not: null }, active: true },
    include: { completions: { where: { date: today } } },
  })
  const overdueTasks = allTimedTasks.filter(t => {
    if (t.completions.length > 0 || !t.timeTo) return false
    return t.timeTo < now
  })

  let sent = 0

  // Send "START" notifications
  for (const task of startingTasks) {
    if (task.completions.length > 0) continue
    const alreadySent = await prisma.sentPushNotification.findUnique({
      where: { taskId_date_type: { taskId: task.id, date: today, type: 'START' } },
    })
    if (alreadySent) continue

    const subs = await prisma.pushSubscription.findMany({
      where: { storeId: task.storeId, role: task.role },
    })

    for (const sub of subs) {
      await sendPush(sub, {
        title: '▶ Задача започва',
        body: task.title,
        tag: `start-${task.id}`,
        url: '/dashboard',
      })
      sent++
    }

    await prisma.sentPushNotification.create({
      data: { taskId: task.id, date: today, type: 'START' },
    }).catch(() => {})
  }

  // Send "OVERDUE" notifications
  for (const task of overdueTasks) {
    const alreadySent = await prisma.sentPushNotification.findUnique({
      where: { taskId_date_type: { taskId: task.id, date: today, type: 'OVERDUE' } },
    })
    if (alreadySent) continue

    const subs = await prisma.pushSubscription.findMany({
      where: { storeId: task.storeId, role: task.role },
    })

    for (const sub of subs) {
      await sendPush(sub, {
        title: '⚠ Просрочена задача',
        body: task.title,
        tag: `overdue-${task.id}`,
        url: '/dashboard',
      })
      sent++
    }

    await prisma.sentPushNotification.create({
      data: { taskId: task.id, date: today, type: 'OVERDUE' },
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, sent, time: now })
}
