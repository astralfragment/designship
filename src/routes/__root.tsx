import { createRootRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useAppStore } from '../stores/app'
import { Minus, Square, X, Clock, Settings, FileText, Figma, GitBranch } from 'lucide-react'

export const Route = createRootRoute({
  component: RootLayout,
})

export const routeTree = Route.addChildren([])

function RootLayout() {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && <Sidebar />}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function TitleBar() {
  return (
    <div className="drag-region flex h-9 items-center justify-between border-b border-border-subtle bg-bg-secondary px-3">
      <span className="font-display text-sm font-semibold text-text-primary">
        DesignShip
      </span>
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={() => window.ds.window.minimize()}
          className="rounded p-1.5 text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          onClick={() => window.ds.window.maximize()}
          className="rounded p-1.5 text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
        >
          <Square className="size-3" />
        </button>
        <button
          onClick={() => window.ds.window.close()}
          className="rounded p-1.5 text-text-muted hover:bg-red-500/80 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const links = [
    { to: '/', icon: Clock, label: 'Timeline' },
    { to: '/summaries', icon: FileText, label: 'Summaries' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ] as const

  return (
    <nav className="flex w-48 flex-col gap-1 border-r border-border-subtle bg-bg-secondary p-2">
      <div className="mb-2 px-2 pt-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Navigation
        </p>
      </div>
      {links.map(({ to, icon: Icon, label }) => {
        const active = pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
              active
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}

      <div className="mt-auto border-t border-border-subtle pt-2">
        <div className="flex items-center gap-2 px-2.5 py-1">
          <div className="size-1.5 rounded-full bg-accent-figma animate-pulse-glow" />
          <span className="text-[11px] text-text-muted">Figma watching</span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1">
          <div className="size-1.5 rounded-full bg-accent-git animate-pulse-glow" />
          <span className="text-[11px] text-text-muted">Git watching</span>
        </div>
      </div>
    </nav>
  )
}
