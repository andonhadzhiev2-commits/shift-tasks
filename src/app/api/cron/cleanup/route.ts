export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffDate = cutoff.toISOString().split('T')[0]

  const deleted = await prisma.taskCompletion.deleteMany({
    where: { date: { lt: cutoffDate } },
  })

  return NextResponse.json({ deleted: deleted.count, cutoffDate })
}
