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
import { GitHubIcon } from '../components/icons'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

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
