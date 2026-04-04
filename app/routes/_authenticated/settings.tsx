import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import {
  getFigmaOAuthUrl,
  hasFigmaToken,
  clearFigmaToken,
} from '@/lib/figma'
import { useToast } from '../../components/toast'
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
import { GitHubIcon } from '../../components/icons'

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

function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [figmaConnected, setFigmaConnected] = useState(hasFigmaToken)

  const handleConnectFigma = () => {
    window.location.href = getFigmaOAuthUrl()
  }

  const handleDisconnectFigma = () => {
    clearFigmaToken()
    setFigmaConnected(false)
    toast('Figma disconnected', 'success')
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
