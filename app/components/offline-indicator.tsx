import { useState, useEffect, useRef } from 'react'
import { WifiOffIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const [showBanner, setShowBanner] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const goOnline = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setShowBanner(false)
    }
    const goOffline = () => {
      // Wait 3s before showing — avoids false positives from brief blips
      timerRef.current = setTimeout(() => {
        if (!navigator.onLine) setShowBanner(true)
      }, 3000)
    }

    // Check initial state with delay too
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      goOffline()
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground shadow-lg animate-ds-slide-up"
    >
      <WifiOffIcon className="size-3.5 shrink-0" />
      You're offline
    </div>
  )
}
