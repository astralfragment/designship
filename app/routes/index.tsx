import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">DesignShip</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Design it. Ship it. The tool that connects the two.
        </p>
      </div>
    </div>
  )
}
