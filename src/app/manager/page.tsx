'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS, SHIFT_LABELS } from '@/lib/types'
import type { RoleType, Shift } from '@/lib/types'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

function SortableTask({
  task,
  editingId,
  editTitle,
  setEditTitle,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  task: Task
  editingId: number | null
  editTitle: string
  setEditTitle: (v: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border-2 p-3 sm:p-4 flex items-center gap-2 sm:gap-3 ${task.completions.length > 0 ? 'border-green-200' : 'border-gray-100'}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1"
        aria-label="Преместете"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${task.completions.length > 0 ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />

      {editingId === task.id ? (
        <div className="flex-1 flex gap-2 flex-wrap">
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSave()}
            className="flex-1 min-w-0 px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:outline-none"
            autoFocus
          />
          <button onClick={onSave} className="text-purple-600 text-xs font-semibold hover:text-purple-800">Запази</button>
          <button onClick={onCancel} className="text-gray-400 text-xs hover:text-gray-600">Отказ</button>
        </div>
      ) : (
        <>
          <span className={`flex-1 text-sm ${task.completions.length > 0 ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
          <button onClick={onEdit} className="text-xs text-gray-400 hover:text-purple-600 px-1">Редакция</button>
          <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-500 px-1">Изтрий</button>
        </>
      )}
    </div>
  )
}

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

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

  useEffect(() => {
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)
    const reordered = arrayMove(tasks, oldIndex, newIndex)
    setTasks(reordered)

    await fetch('/api/tasks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reordered.map(t => t.id) }),
    })
  }

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
          <div className="flex items-center gap-3">
            <img src="/download.png" alt="Рай" className="h-8 object-contain" />
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold border bg-purple-100 text-purple-800 border-purple-200">Управител</span>
              <p className="text-xs text-gray-500 mt-0.5">{session.storeName}</p>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100">Изход</button>
        </div>

        <div className="max-w-3xl mx-auto px-4 flex gap-0 pb-0 overflow-x-auto">
          {([['tasks', 'Задачи'], ['notifications', `Известия${unreadCount > 0 ? ` (${unreadCount})` : ''}`], ['pins', 'PIN']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                tab === key ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {tab === 'tasks' && (
          <>
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-1 bg-gray-200 p-1 rounded-xl">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setFilterRole(r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterRole === r ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-gray-200 p-1 rounded-xl">
                {SHIFTS.map(s => (
                  <button key={s} onClick={() => setFilterShift(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterShift === s ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                    {SHIFT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-1">Днешен прогрес</p>
              <p className="text-lg font-bold text-gray-800">
                {tasks.filter(t => t.completions.length > 0).length} / {tasks.length} задачи изпълнени
              </p>
            </div>

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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      editingId={editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onEdit={() => { setEditingId(task.id); setEditTitle(task.title) }}
                      onSave={() => updateTask(task.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                  {tasks.length === 0 && <div className="text-center py-8 text-gray-400">Няма задачи</div>}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}

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
