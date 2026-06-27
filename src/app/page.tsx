'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) setTimeout(() => handleLoginWithPin(newPin), 100)
    }
  }

  async function handleLoginWithPin(p: string) {
    if (!storeId) { setError('Изберете магазин'); setPin(''); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, pin: p }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Невалиден PIN'); setPin(''); return }
    router.push(data.role === 'MANAGER' ? '/manager' : '/dashboard')
  }

  async function handleLogin() {
    if (!storeId) { setError('Изберете магазин'); return }
    if (pin.length < 4) { setError('Въведете 4-цифрен PIN'); return }
    handleLoginWithPin(pin)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-xs sm:max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/download.png" alt="Рай Супермаркети" className="h-14 sm:h-16 object-contain" />
        </div>
        <p className="text-center text-gray-500 text-sm mb-5">Въведете вашия PIN код</p>

        {/* Store selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Магазин</label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {stores.map(s => (
              <button
                key={s.id}
                onClick={() => { setStoreId(s.id); setError('') }}
                className={`py-2 px-1 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                  storeId === s.id
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-400'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 sm:gap-4 py-3 mb-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all ${
                pin.length > i ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300'
              }`}
            >
              {pin.length > i ? '•' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => {
                if (d === '⌫') setPin(p => p.slice(0, -1))
                else if (d) appendPin(d)
              }}
              disabled={!d}
              className={`h-14 sm:h-16 rounded-xl text-xl sm:text-2xl font-semibold transition-all select-none ${
                !d ? 'invisible' :
                d === '⌫' ? 'bg-gray-100 text-gray-600 active:bg-gray-300' :
                'bg-gray-100 text-gray-800 active:bg-gray-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || pin.length < 4 || !storeId}
          className="w-full py-3.5 bg-red-600 text-white rounded-xl font-semibold text-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Влизане...' : 'Вход'}
        </button>
      </div>
    </div>
  )
}
