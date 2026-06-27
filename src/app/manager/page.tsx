'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS, SHIFT_LABELS } from '@/lib/types'
import type { RoleType, Shift } from '@/lib/types'

interface Task {
  id: number
  title: string
  role: RoleType
  shift: Shift
  active: boolean
  completions: { id: number }[]
}

interface Notification {
  id: number
  message: string
  read: boolean
  createdAt: string
}

interface Session {
  storeId: number
  storeName: string
}

const ROLES: RoleType[] = ['CASHIER', 'WEIGHER', 'WAREHOUSE']
const SHIFTS: Shift[] = ['FIRST', 'SECOND']

type Tab = 'tasks' | 'notifications' | 'pins'

export default function ManagerPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [tab, setTab] = useState<Tab>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filterRole, setFilterRole] = useState<RoleType>('CASHIER')
  const [filterShift, setFilterShift] = useState<Shift>('FIRST')
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [pins, setPins] = useState<{ role: RoleType; pin: string }[]>([])
  const [editPin, setEditPin] = useState<{ role: RoleType; pin: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(async r => {
      if (!r.ok) { router.push('/'); return }
      const data = await r.json()
      if (data.role !== 'MANAGER') { router.push('/dashboard'); return }
      setSession(data)
    })
  }, [router])

  const loadTasks = useCallback(async () => {
    const res = await fetch(`/api/tasks?role=${filterRole}&shift=${filterShift}`)
    if (res.ok) setTasks(await res.json())
  }, [filterRole, filterShift])

  const loadNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.read).length)
    }
  }, [])

  const loadPins = useCallback(async () => {
    const res = await fetch('/api/pins')
    if (res.ok) setPins(await res.json())
  }, [])

  useEffect(() => { if (session) { loadTasks(); loadNotifications(); loadPins() } }, [session, loadTasks, loadNotifications, loadPins])

  // Poll notifications every 15 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  async function addTask() {
    if (!newTitle.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: session!.storeId, role: filterRole, shift: filterShift, title: newTitle.trim() }),
    })
    setNewTitle('')
    loadTasks()
  }

  async function updateTask(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle }),
    })
    setEditingId(null)
    loadTasks()
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    loadTasks()
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    loadNotifications()
  }

  async function updatePin() {
    if (!editPin) return
    await fetch('/api/pins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPin),
    })
    setEditPin(null)
    loadPins()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (!session) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold border bg-purple-100 text-purple-800 border-purple-200">Управител</span>
            <p className="text-xs text-gray-500 mt-0.5">{session.storeName}</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100">Изход</button>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-0">
          {([['tasks', 'Задачи'], ['notifications', `Уведомления${unreadCount > 0 ? ` (${unreadCount})` : ''}`], ['pins', 'PIN кодове']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                tab === key ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* TASKS TAB */}
        {tab === 'tasks' && (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="flex gap-1 bg-gray-200 p-1 rounded-xl">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setFilterRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterRole === r ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-gray-200 p-1 rounded-xl">
                {SHIFTS.map(s => (
                  <button key={s} onClick={() => setFilterShift(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterShift === s ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                    {SHIFT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Today's progress */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-1">Днешен прогрес</p>
              <p className="text-lg font-bold text-gray-800">
                {tasks.filter(t => t.completions.length > 0).length} / {tasks.length} задачи изпълнени
              </p>
            </div>

            {/* Add task */}
            <div className="flex gap-2 mb-4">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Добавете нова задача..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 bg-white"
              />
              <button onClick={addTask} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
                Добави
              </button>
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className={`bg-white rounded-xl border-2 p-4 flex items-center gap-3 ${task.completions.length > 0 ? 'border-green-200' : 'border-gray-100'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${task.completions.length > 0 ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                  {editingId === task.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && updateTask(task.id)}
                        className="flex-1 px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => updateTask(task.id)} className="text-purple-600 text-xs font-semibold hover:text-purple-800">Запази</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs hover:text-gray-600">Отказ</button>
                    </div>
                  ) : (
                    <>
                      <span className={`flex-1 text-sm ${task.completions.length > 0 ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                      <button onClick={() => { setEditingId(task.id); setEditTitle(task.title) }} className="text-xs text-gray-400 hover:text-purple-600 px-2">Редакция</button>
                      <button onClick={() => deleteTask(task.id)} className="text-xs text-gray-400 hover:text-red-500 px-2">Изтрий</button>
                    </>
                  )}
                </div>
              ))}
              {tasks.length === 0 && <div className="text-center py-8 text-gray-400">Няма задачи</div>}
            </div>
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">Уведомления</h2>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                  Маркирай всички като прочетени
                </button>
              )}
            </div>
            <div className="space-y-2">
              {notifications.length === 0 && <div className="text-center py-8 text-gray-400">Няма уведомления</div>}
              {notifications.map(n => (
                <div key={n.id} className={`p-4 rounded-xl border ${n.read ? 'bg-white border-gray-100 text-gray-600' : 'bg-purple-50 border-purple-200 text-gray-800 font-medium'}`}>
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('bg-BG')}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PINS TAB */}
        {tab === 'pins' && (
          <>
            <h2 className="font-semibold text-gray-800 mb-4">PIN кодове за {session.storeName}</h2>
            <div className="space-y-3">
              {pins.map(p => (
                <div key={p.role} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{ROLE_LABELS[p.role]}</p>
                    {editPin?.role === p.role ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={editPin.pin}
                          onChange={e => setEditPin({ ...editPin, pin: e.target.value })}
                          className="w-24 px-3 py-1.5 border border-purple-300 rounded-lg text-sm font-mono focus:outline-none"
                          maxLength={6}
                        />
                        <button onClick={updatePin} className="text-purple-600 text-sm font-semibold hover:text-purple-800">Запази</button>
                        <button onClick={() => setEditPin(null)} className="text-gray-400 text-sm hover:text-gray-600">Отказ</button>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm font-mono mt-1">{'•'.repeat(p.pin.length)}</p>
                    )}
                  </div>
                  {editPin?.role !== p.role && (
                    <button onClick={() => setEditPin({ role: p.role, pin: p.pin })} className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                      Промени
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
