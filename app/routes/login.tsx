import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { GitHubIcon } from '../components/icons'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { user, loading, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: '/' })
    }
  }, [user, loading, navigate])

  const handleSignIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      await signInWithGitHub()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start sign in')
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ds-surface-0">
        <div className="ds-iridescent-text text-lg font-medium">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ds-surface-0 px-4">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '600px',
          height: '600px',
          background:
            'radial-gradient(circle, oklch(0.70 0.18 340 / 0.12) 0%, oklch(0.60 0.15 310 / 0.06) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="pointer-events-none absolute right-1/4 bottom-1/4"
        style={{
          width: '400px',
          height: '400px',
          background:
            'radial-gradient(circle, oklch(0.60 0.15 280 / 0.08) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm animate-ds-fade-in">
        {/* Logo + tagline */}
        <div className="mb-10 text-center">
          <h1 className="ds-iridescent-text text-3xl font-bold tracking-tight">
            DesignShip
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ds-text-secondary">
            Design it. Ship it.
            <br />
            The tool that connects the two.
          </p>
        </div>

        {/* Glassmorphism card with iridescent border */}
        <div className="relative animate-ds-slide-up">
          {/* Iridescent border glow */}
          <div
            className="ds-iridescent absolute -inset-px rounded-2xl opacity-60"
            style={{ padding: '1px' }}
          />

          {/* Card body */}
          <div
            className="relative rounded-2xl px-8 py-10"
            style={{
              background: 'oklch(0.17 0.008 280 / 0.85)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid oklch(0.35 0.02 330 / 0.3)',
            }}
          >
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-ds-text-primary">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-ds-text-secondary">
                Connect GitHub to sync your repos, PRs, and commits.
              </p>
            </div>

            {/* Divider with glow */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full"
                  style={{
                    height: '1px',
                    background:
                      'linear-gradient(90deg, transparent, oklch(0.70 0.18 340 / 0.4), transparent)',
                  }}
                />
              </div>
            </div>

            {/* Sign in button */}
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.65 0.22 340), oklch(0.55 0.18 310))',
                boxShadow:
                  '0 0 24px oklch(0.65 0.22 340 / 0.3), 0 4px 12px oklch(0 0 0 / 0.3)',
              }}
            >
              {signingIn ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <GitHubIcon className="size-4.5 transition-transform duration-300 group-hover:-rotate-12" />
              )}
              {signingIn ? 'Redirecting...' : 'Continue with GitHub'}
            </button>

            {error && (
              <p className="mt-3 text-center text-xs text-red-400">{error}</p>
            )}

            <p className="mt-5 text-center text-xs text-ds-text-tertiary">
              Read-only access to your repos and profile.
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="mt-8 text-center text-xs leading-relaxed text-ds-text-tertiary">
          Zero input, maximum output. DesignShip watches
          <br />
          your activity and generates every update your team needs.
        </p>
      </div>
    </div>
  )
}
