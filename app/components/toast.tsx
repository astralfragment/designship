import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  InfoIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const icons: Record<ToastVariant, typeof CheckCircle2Icon> = {
  success: CheckCircle2Icon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 text-emerald-400',
  error: 'border-red-500/30 text-red-400',
  warning: 'border-amber-500/30 text-amber-400',
  info: 'border-blue-500/30 text-blue-400',
}

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(t.id), 200)
    }, t.duration)
    return () => clearTimeout(timerRef.current)
  }, [t.id, t.duration, onDismiss])

  const Icon = icons[t.variant]

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex items-center gap-2.5 rounded-lg border bg-ds-surface-1 px-3.5 py-2.5 shadow-lg transition-all duration-200',
        variantStyles[t.variant],
        exiting ? 'translate-y-2 opacity-0' : 'animate-ds-slide-up',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <p className="flex-1 text-sm text-ds-text-primary">{t.message}</p>
      <button
        onClick={() => {
          setExiting(true)
          setTimeout(() => onDismiss(t.id), 200)
        }}
        className="shrink-0 rounded p-0.5 text-ds-text-tertiary transition-colors hover:text-ds-text-secondary"
        aria-label="Dismiss"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idCounter = useRef(0)

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 3000) => {
      const id = `toast-${++idCounter.current}`
      setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }])
    },
    [],
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
