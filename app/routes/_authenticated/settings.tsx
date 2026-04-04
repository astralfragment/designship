import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import {
  getFigmaOAuthUrl,
  hasFigmaToken,
  clearFigmaToken,
} from '@/lib/figma'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4zm0-20C5.8 4 4 5.8 4 8s1.8 4 4 4h4V4H8zm0-4C5.8 0 4 1.8 4 4s1.8 4 4 4h4V0H8zm8 0h-4v8h4c2.2 0 4-1.8 4-4s-1.8-4-4-4zm0 12c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  )
}

function SettingsPage() {
  const { user } = useAuth()
  const [figmaConnected, setFigmaConnected] = useState(hasFigmaToken)

  const handleConnectFigma = () => {
    window.location.href = getFigmaOAuthUrl()
  }

  const handleDisconnectFigma = () => {
    clearFigmaToken()
    setFigmaConnected(false)
  }

  const githubLogin = user?.user_metadata?.user_name as string | undefined

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-ds-text-primary">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ds-text-secondary">
          Manage your connected accounts and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Accounts</CardTitle>
            <CardDescription>
              Connect your tools so DesignShip can pull activity automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GitHub - always connected via Supabase Auth */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-ds-surface-2">
                  <GitHubIcon className="size-4 text-ds-text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ds-text-primary">GitHub</p>
                  <p className="text-xs text-ds-text-tertiary">
                    {githubLogin ? `@${githubLogin}` : 'Connected via sign-in'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>

            <Separator />

            {/* Figma */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-ds-surface-2">
                  <FigmaIcon className="size-4 text-ds-text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ds-text-primary">Figma</p>
                  <p className="text-xs text-ds-text-tertiary">
                    {figmaConnected
                      ? 'Design screenshots in timeline'
                      : 'Connect to show design screenshots in your timeline'}
                  </p>
                </div>
              </div>
              {figmaConnected ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Connected</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnectFigma}
                    className="text-xs text-ds-text-tertiary hover:text-destructive"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectFigma}
                  className="gap-1.5"
                >
                  <FigmaIcon className="size-3.5" />
                  Connect Figma
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
