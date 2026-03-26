import { Button } from '@/components/ui/button'
import { getLoginUrl } from '@/lib/github'
import { Ship, Sparkles } from 'lucide-react'

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo area */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Ship className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">DesignShip</span>
        </div>

        {/* Hero */}
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight text-center mb-6 text-foreground"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Ship with
          <br />
          <span className="text-primary">clarity</span>
        </h1>

        <p className="text-lg text-muted-foreground text-center max-w-md mb-10 leading-relaxed">
          Turn your GitHub pull requests into stakeholder-ready updates.
          No more translating code into business speak.
        </p>

        {/* CTA */}
        <Button
          size="lg"
          className="gap-2 text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
          asChild
        >
          <a href={getLoginUrl()}>
            <GitHubIcon className="w-5 h-5" />
            Sign in with GitHub
          </a>
        </Button>

        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Read-only access to your public repos
        </p>

        {/* Feature hints */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl w-full">
          {[
            { title: 'PR Timeline', desc: 'See your merged PRs at a glance' },
            { title: 'Stakeholder View', desc: 'Auto-rewrite titles in plain English' },
            { title: 'Weekly Summary', desc: 'One-click stakeholder updates' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="border border-border/50 rounded-xl p-5 bg-card/50 backdrop-blur-sm"
            >
              <h3 className="text-sm font-medium text-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
