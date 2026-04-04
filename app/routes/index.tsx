import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">DesignShip</h1>
        <p className="mt-3 text-lg text-ds-text-secondary">
          Design it. Ship it. The tool that connects the two.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>

      <Card className="w-full max-w-md animate-ds-slide-up">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Your recent development activity at a glance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex items-center gap-3">
            <div className="size-2.5 rounded-full bg-ds-timeline-dot-pr" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="flex items-center gap-3">
            <div className="size-2.5 rounded-full bg-ds-timeline-dot-commit" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex items-center gap-3">
            <div className="size-2.5 rounded-full bg-ds-timeline-dot-deploy" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <div className="size-2.5 rounded-full bg-ds-timeline-dot-design" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
