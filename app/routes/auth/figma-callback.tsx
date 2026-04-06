import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  exchangeFigmaCode,
  setFigmaToken,
  validateOAuthState,
} from '@/lib/figma'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/auth/figma-callback')({
  component: FigmaCallback,
})

function FigmaCallback() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const exchanged = useRef(false)

  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const errorParam = params.get('error')

    if (errorParam) {
      setError('Figma authorization was denied.')
      return
    }

    if (!code || !state) {
      setError('Missing authorization code.')
      return
    }

    if (!validateOAuthState(state)) {
      setError('Invalid OAuth state. Please try again.')
      return
    }

    if (!session?.access_token) {
      setError('Not authenticated. Please sign in first.')
      exchanged.current = false
      return
    }

    exchangeFigmaCode({ data: { code, accessToken: session.access_token } })
      .then(({ access_token }) => {
        setFigmaToken(access_token)
        navigate({ to: '/settings' })
      })
      .catch(() => {
        exchanged.current = false
        setError('Failed to connect Figma. Please try again.')
      })
  }, [navigate, session?.access_token])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ds-surface-0">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => navigate({ to: '/settings' })}
          className="text-sm text-ds-text-secondary underline hover:text-ds-text-primary"
        >
          Back to settings
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-surface-0">
      <p className="animate-pulse text-ds-text-secondary">
        Connecting Figma...
      </p>
    </div>
  )
}
