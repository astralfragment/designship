import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { GITHUB_TOKEN_KEY } from '@/lib/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()
  const handled = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function processAuth() {
      if (handled.current) return
      handled.current = true

      try {
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.slice(1))

        // 1. Check for error params from Supabase/GitHub
        const errorParam = params.get('error') || hashParams.get('error')
        if (errorParam) {
          const desc = params.get('error_description') || hashParams.get('error_description') || errorParam
          setError(desc)
          return
        }

        // 2. PKCE flow: exchange the code explicitly
        const code = params.get('code')
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
            return
          }
          if (data.session) {
            persistAndRedirect(data.session)
            return
          }
        }

        // 3. Implicit flow: hash contains access_token + refresh_token
        //    Manually set the session — detectSessionInUrl races with TanStack Router
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken && refreshToken) {
          const { data, error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (setErr) {
            setError(setErr.message)
            return
          }
          if (data.session) {
            // Also grab provider_token from hash since setSession won't include it
            const providerToken = hashParams.get('provider_token')
            if (providerToken) {
              localStorage.setItem(GITHUB_TOKEN_KEY, providerToken)
            }
            navigate({ to: '/' })
            return
          }
        }

        // 4. Maybe session was already established
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          persistAndRedirect(session)
          return
        }

        setError('No auth session found. Please try signing in again.')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Authentication failed')
      }
    }

    function persistAndRedirect(session: Session) {
      if (session.provider_token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token)
      }
      navigate({ to: '/' })
    }

    processAuth()
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ds-surface-0 px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-destructive">Sign in failed</p>
          <p className="mt-1 text-sm text-ds-text-secondary">{error}</p>
        </div>
        <button
          onClick={() => navigate({ to: '/login' })}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ds-surface-0">
      <div className="size-5 animate-spin rounded-full border-2 border-ds-text-tertiary border-t-primary" />
      <p className="text-sm text-ds-text-secondary">Signing you in...</p>
    </div>
  )
}
