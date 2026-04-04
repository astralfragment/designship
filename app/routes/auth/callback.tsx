import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GITHUB_TOKEN_KEY } from '@/lib/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        navigate({ to: '/login' })
        return
      }
      // Capture GitHub provider token for API calls
      if (session.provider_token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token)
      }
      navigate({ to: '/' })
    })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-ds-text-secondary">Signing you in...</p>
    </div>
  )
}
