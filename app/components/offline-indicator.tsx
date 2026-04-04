import { useState, useEffect } from 'react'
import { WifiOffIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="alert"
      className={cn(
        'fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-600 px-4 py-1.5 text-sm font-medium text-white',
        'animate-ds-slide-down',
      )}
    >
      <WifiOffIcon className="size-3.5" />
      You're offline. Some features may be unavailable.
    </div>
  )
}
