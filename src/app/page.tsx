'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [stores, setStores] = useState<{ id: number; name: string }[]>([])
  const [storeId, setStoreId] = useState<number | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores)
    fetch('/api/auth/me').then(r => {
      if (r.ok) router.push('/dashboard')
    })
  }, [router])

  function appendPin(digit: string) {
    if (pin.length < 6) setPin(p => p + digit)
  }

  async function handleLogin() {
    if (!storeId) { setError('Изберете магазин'); return }
    if (pin.length < 4) { setError('PIN кодът е твърде кратък'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, pin }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Грешка'); setPin(''); return }
    router.push(data.role === 'MANAGER' ? '/manager' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Смени & Задачи</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Въведете вашия PIN код</p>

        {/* Store selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Магазин</label>
          <div className="grid grid-cols-3 gap-2">
            {stores.map(s => (
              <button
                key={s.id}
                onClick={() => setStoreId(s.id)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  storeId === s.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* PIN display */}
        <div className="mb-4">
          <div className="flex justify-center gap-2 py-3">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all ${
                  pin.length > i ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-transparent'
                }`}
              >
                •
              </div>
            ))}
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => {
                if (d === '⌫') setPin(p => p.slice(0, -1))
                else if (d) appendPin(d)
              }}
              disabled={!d}
              className={`h-14 rounded-xl text-xl font-semibold transition-all ${
                !d ? 'invisible' :
                d === '⌫' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300' :
                'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading || !pin || !storeId}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Влизане...' : 'Вход'}
        </button>
      </div>
    </div>
  )
}
