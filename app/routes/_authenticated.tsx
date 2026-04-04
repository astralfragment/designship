import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { AppShell } from '../components/app-shell'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ds-surface-0">
        <p className="animate-pulse text-ds-text-secondary">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
