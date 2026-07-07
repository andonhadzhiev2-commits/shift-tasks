'use client'

import { useEffect } from 'react'

export default function PushSetup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return

    async function setup() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          // Re-send to server in case role changed
          await saveSubscription(existing)
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        })
        await saveSubscription(sub)
      } catch (e) {
        console.error('Push setup failed', e)
      }
    }

    setup()
  }, [])

  return null
}

async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON()
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
  })
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
  return arr.buffer as ArrayBuffer
}
