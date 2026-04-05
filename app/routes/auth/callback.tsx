import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { GITHUB_TOKEN_KEY } from '@/lib/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()
  const navigated = useRef(false)

  useEffect(() => {
    function handleSession(session: Session) {
      if (navigated.current) return
      navigated.current = true
      if (session.provider_token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token)
      }
      navigate({ to: '/' })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          handleSession(session)
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!session && !navigated.current) {
            navigated.current = true
            navigate({ to: '/login' })
          }
        }
      },
    )

    // Fallback: if Supabase already processed the URL before the listener was set up
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession(session)
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
