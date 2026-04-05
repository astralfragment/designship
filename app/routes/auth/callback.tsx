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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          if (session.provider_token) {
            localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token)
          }
          navigate({ to: '/' })
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          // TOKEN_REFRESHED without session means auth failed
          if (!session) {
            navigate({ to: '/login' })
          }
        }
      },
    )

    // Fallback: if Supabase already processed the URL before the listener was set up
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (session.provider_token) {
          localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token)
        }
        navigate({ to: '/' })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-ds-text-secondary">Signing you in...</p>
    </div>
  )
}
