import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Capture GitHub provider token for API calls
      if (session?.provider_token) {
        localStorage.setItem('ds-github-token', session.provider_token)
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
