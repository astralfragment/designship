import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider, useThemeSetup } from '@/hooks/use-theme'
import { ErrorBoundary } from '../components/error-boundary'
import { ToastProvider } from '../components/toast'
import { OfflineIndicator } from '../components/offline-indicator'
import { GitHubRateLimitError } from '@/lib/github'
import { FigmaRateLimitError } from '@/lib/figma'
import appCss from '@/styles/globals.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'DesignShip' },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry auth errors
          if (error instanceof GitHubRateLimitError || error?.name === 'GitHubRateLimitError') return false
          if (error instanceof FigmaRateLimitError || error?.name === 'FigmaRateLimitError') return false
          if (error?.name === 'GitHubAuthError' || error?.name === 'FigmaAuthError') return false
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: (failureCount, error) => {
          if (error instanceof GitHubRateLimitError || error?.name === 'GitHubRateLimitError') return false
          if (error instanceof FigmaRateLimitError || error?.name === 'FigmaRateLimitError') return false
          return failureCount < 1
        },
      },
    },
  }))

  const themeCtx = useThemeSetup()

  return (
    <RootDocument theme={themeCtx.theme}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ThemeProvider value={themeCtx}>
              <AuthProvider>
                <OfflineIndicator />
                <Outlet />
              </AuthProvider>
            </ThemeProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </RootDocument>
  )
}

function RootDocument({ children, theme }: { children: ReactNode; theme: string }) {
  return (
    <html lang="en" className={theme}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
