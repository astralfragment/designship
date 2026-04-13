import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useAppStore } from './stores/app'
import { useEventCount } from './hooks/useEvents'
import { useProjects } from './hooks/useProjects'
import { TimelinePage } from './pages/timeline'
import { SummariesPage } from './pages/summaries'
import { SettingsPage } from './pages/settings'
import { Clock, Settings, FileText } from 'lucide-react'
import './styles/globals.css'

// --- Root layout ---
const rootRoute = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-primary">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: eventCount = 0 } = useEventCount()
  const { data: projects = [] } = useProjects()

  const figmaCount = (projects as Array<{ type: string }>).filter((p) => p.type === 'figma_file').length
  const gitCount = (projects as Array<{ type: string }>).filter((p) => p.type === 'git_repo').length

  const navItems = [
    { to: '/', icon: Clock, label: 'Timeline', badge: eventCount > 0 ? String(eventCount) : undefined },
    { to: '/summaries', icon: FileText, label: 'Summaries' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ] as const

  return (
    <nav className="flex w-52 shrink-0 flex-col border-r border-white/[0.04] bg-bg-secondary/80">
      {/* Branding */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.04] px-4 py-3">
        <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-accent-figma to-accent-git">
          <span className="text-[10px] font-bold text-white">DS</span>
        </div>
        <span className="font-display text-sm font-semibold tracking-tight text-text-primary">
          DesignShip
        </span>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-0.5 p-2 pt-3">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-white/[0.08] text-text-primary'
                  : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
              }`}
            >
              <Icon className={`size-4 ${active ? 'text-accent-figma' : 'text-text-muted group-hover:text-text-secondary'}`} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-text-muted">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Status */}
      <div className="mt-auto border-t border-white/[0.04] p-3">
        <StatusDot color="#a259ff" label="Figma" count={figmaCount} />
        <StatusDot color="#58d68d" label="Git repos" count={gitCount} />
      </div>
    </nav>
  )
}

function StatusDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <div
        className="size-1.5 rounded-full"
        style={{ backgroundColor: count > 0 ? color : '#555570' }}
      />
      <span className="flex-1 text-[11px] text-text-muted">{label}</span>
      <span className="text-[10px] tabular-nums text-text-muted">{count}</span>
    </div>
  )
}

// --- Routes ---
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TimelinePage,
})

const summariesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/summaries',
  component: SummariesPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([indexRoute, summariesRoute, settingsRoute])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 10_000 },
  },
})

const router = createRouter({ routeTree })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
