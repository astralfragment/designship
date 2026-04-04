import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  )
}

function LoginPage() {
  const { user, loading, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: '/' })
    }
  }, [user, loading, navigate])

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGitHub()
    } catch {
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ds-surface-0">
        <p className="text-ds-text-secondary animate-pulse">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ds-surface-0 px-4">
      <div className="w-full max-w-sm animate-ds-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ds-text-primary">
            DesignShip
          </h1>
          <p className="mt-2 text-sm text-ds-text-secondary">
            Design it. Ship it. The tool that connects the two.
          </p>
        </div>

        <Card className="animate-ds-slide-up">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Connect your GitHub to get started. We'll pull your repos,
              PRs, and commits automatically.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Separator className="mb-4" />
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleSignIn}
              disabled={signingIn}
            >
              <GitHubIcon className="size-4" />
              {signingIn ? 'Redirecting to GitHub...' : 'Continue with GitHub'}
            </Button>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-xs text-muted-foreground">
              We request read access to your repos and profile.
            </p>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-ds-text-tertiary">
          Zero input, maximum output. DesignShip watches your activity and
          generates every communication artifact your team needs.
        </p>
      </div>
    </div>
  )
}
