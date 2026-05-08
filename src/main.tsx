import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Link,
  useRouterState,
} from '@tanstack/react-router'
import { Inbox, Layers, FileText, Settings as SettingsIcon } from 'lucide-react'
import { useAppStore } from './stores/app'
import { useProjects } from './hooks/useProjects'
import { useConfig, useSetCurrentProject } from './hooks/useConfig'
import { useFragments } from './hooks/useFragments'
import { CapturePage } from './pages/capture'
import { FragmentsPage } from './pages/fragments'
import { SpecsPage } from './pages/specs'
import { SettingsPage } from './pages/settings'
import { FragmentMark } from './components/FragmentMark'
import './styles/globals.css'

const rootRoute = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ProjectBootstrap>
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-8 py-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ProjectBootstrap>
  )
}

/** Hydrates currentProjectId from config + projects on first load. */
function ProjectBootstrap({ children }: { children: React.ReactNode }) {
  const config = useConfig()
  const projects = useProjects()
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const persistCurrent = useSetCurrentProject()

  useEffect(() => {
    if (!projects.data) return
    if (currentProjectId) {
      const stillExists = projects.data.some((p) => p.id === currentProjectId)
      if (!stillExists) {
        const fallback = projects.data[0]?.id ?? null
        setCurrentProjectId(fallback)
        if (fallback) persistCurrent.mutate(fallback)
      }
      return
    }
    const fromConfig = config.data?.currentProjectId
    if (fromConfig && projects.data.some((p) => p.id === fromConfig)) {
      setCurrentProjectId(fromConfig)
      return
    }
    const first = projects.data[0]?.id ?? null
    if (first) {
      setCurrentProjectId(first)
      persistCurrent.mutate(first)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.data, config.data])

  return <>{children}</>
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const projects = useProjects()
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const persistCurrent = useSetCurrentProject()
  const fragments = useFragments({ project_id: currentProjectId ?? undefined })

  const fragmentCount = fragments.data?.length ?? 0
  const currentProject = projects.data?.find((p) => p.id === currentProjectId)

  const navItems: {
    to: '/' | '/fragments' | '/specs' | '/settings'
    icon: typeof Inbox
    label: string
    badge?: string
  }[] = [
    { to: '/', icon: Inbox, label: 'Capture' },
    {
      to: '/fragments',
      icon: Layers,
      label: 'Fragments',
      badge: fragmentCount > 0 ? String(fragmentCount) : undefined,
    },
    { to: '/specs', icon: FileText, label: 'Specs' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ]

  return (
    <nav className="flex w-60 shrink-0 flex-col border-r border-border-subtle bg-bg-glass backdrop-blur">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <FragmentMark size={26} />
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">
            Fragment
          </span>
          <span className="text-[10px] tracking-wide text-text-muted">
            by Lilac Fragment
          </span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <label className="block">
          <span className="sr-only">Workspace</span>
          {projects.data && projects.data.length > 0 ? (
            <select
              className="input w-full text-[13px]"
              value={currentProjectId ?? ''}
              onChange={(e) => {
                setCurrentProjectId(e.target.value)
                persistCurrent.mutate(e.target.value)
              }}
            >
              {projects.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-[10px] border border-border-subtle bg-bg-elevated px-3 py-2 text-[12px] text-text-muted">
              No workspace yet
            </div>
          )}
        </label>
      </div>

      <div className="flex flex-col gap-0.5 p-2 pt-2">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-ink text-bg-primary'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active
                      ? 'bg-bg-primary/20 text-bg-primary'
                      : 'bg-bg-secondary text-text-muted'
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="mt-auto px-4 pb-4 pt-3 text-[11px] text-text-muted">
        {currentProject ? (
          <>
            <div className="font-medium text-text-secondary">
              {currentProject.name}
            </div>
            <div>Local-first · everything stays on your machine.</div>
          </>
        ) : (
          <div>Local-first · everything stays on your machine.</div>
        )}
      </div>
    </nav>
  )
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CapturePage,
})

const fragmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fragments',
  component: FragmentsPage,
})

const specsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/specs',
  component: SpecsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    draft: typeof search.draft === 'string' ? search.draft : undefined,
  }),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  fragmentsRoute,
  specsRoute,
  settingsRoute,
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5_000 },
  },
})

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
