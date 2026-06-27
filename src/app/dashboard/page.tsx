'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS, SHIFT_LABELS, ROLE_COLORS } from '@/lib/types'
import type { RoleType, Shift } from '@/lib/types'

interface Task {
  id: number
  title: string
  shift: Shift
  timeFrom: string | null
  timeTo: string | null
  completions: { id: number }[]
}

function isOverdue(task: Task): boolean {
  if (!task.timeTo || task.completions.length > 0) return false
  const now = new Date()
  const [h, m] = task.timeTo.split(':').map(Number)
  const deadline = new Date()
  deadline.setHours(h, m, 0, 0)
  return now > deadline
}

interface Session {
  role: RoleType
  storeName: string
  storeId: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [shift, setShift] = useState<Shift>('FIRST')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(async r => {
      if (!r.ok) { router.push('/'); return }
      const data = await r.json()
      if (data.role === 'MANAGER') { router.push('/manager'); return }
      setSession(data)
    })
  }, [router])

  const loadTasks = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const res = await fetch(`/api/tasks?shift=${shift}&role=${session.role}`)
    if (res.ok) setTasks(await res.json())
    setLoading(false)
  }, [session, shift])

  useEffect(() => { loadTasks() }, [loadTasks])

  async function toggleTask(taskId: number, done: boolean) {
    await fetch('/api/completions', {
      method: done ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    })
    loadTasks()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const completedCount = tasks.filter(t => t.completions.length > 0).length

  if (!session) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/download.png" alt="Рай" className="h-8 object-contain" />
            <div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border mb-1 ${ROLE_COLORS[session.role]}`}>
                {ROLE_LABELS[session.role]}
              </div>
              <p className="text-xs text-gray-500">{session.storeName}</p>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100">
            Изход
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Shift toggle */}
        <div className="flex gap-2 mb-6 bg-gray-200 p-1 rounded-xl">
          {(['FIRST', 'SECOND'] as Shift[]).map(s => (
            <button
              key={s}
              onClick={() => setShift(s)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                shift === s ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {SHIFT_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Прогрес</span>
            <span className="text-sm font-bold text-gray-800">{completedCount}/{tasks.length}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%' }}
            />
          </div>
          {completedCount === tasks.length && tasks.length > 0 && (
            <p className="text-green-600 text-sm font-semibold mt-2 text-center">Всички задачи изпълнени!</p>
          )}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Няма задачи за тази смяна</div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const done = task.completions.length > 0
              const overdue = isOverdue(task)
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id, done)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    done
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : overdue
                      ? 'bg-red-50 border-red-400 text-red-900 animate-pulse'
                      : 'bg-white border-gray-200 text-gray-800 hover:border-red-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    done ? 'bg-green-500 border-green-500 text-white' : overdue ? 'border-red-400' : 'border-gray-300'
                  }`}>
                    {done && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'line-through text-green-700' : overdue ? 'text-red-800' : ''}`}>{task.title}</p>
                    {(task.timeFrom || task.timeTo) && !done && (
                      <p className={`text-xs mt-0.5 ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {task.timeFrom || '--:--'} – {task.timeTo || '--:--'}{overdue ? ' ⚠ Просрочена' : ''}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
