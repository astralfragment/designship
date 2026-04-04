import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ds-text-primary">
          Timeline
        </h1>
        <p className="mt-1 text-sm text-ds-text-secondary">
          Your recent development activity at a glance.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="animate-ds-slide-up">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>Connect a repo to see your activity.</CardDescription>
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
    </div>
  )
}
