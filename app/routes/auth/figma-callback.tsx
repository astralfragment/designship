import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  exchangeFigmaCode,
  setFigmaToken,
  validateOAuthState,
} from '@/lib/figma'

export const Route = createFileRoute('/auth/figma-callback')({
  component: FigmaCallback,
})

function FigmaCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    const redirectUri = `${window.location.origin}/auth/figma-callback`
    exchangeFigmaCode({ data: { code, redirectUri } })
      .then(({ access_token }) => {
        setFigmaToken(access_token)
        navigate({ to: '/settings' })
      })
      .catch(() => {
        setError('Failed to connect Figma. Please try again.')
      })
  }, [navigate])

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
