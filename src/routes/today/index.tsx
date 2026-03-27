import { createFileRoute } from '@tanstack/react-router'
import { TodayFeed } from '@/components/today/today-feed'
import { PulseCompare } from '@/components/today/pulse-compare'
import { TodoList } from '@/components/today/todo-list'
import { CalendarDays } from 'lucide-react'

export const Route = createFileRoute('/today/')({
  component: TodayView,
})

function TodayView() {
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Today
        </h1>
        <span className="text-sm text-muted-foreground ml-2">{todayStr}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2
              className="text-lg font-semibold text-foreground"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Work Feed
            </h2>
          </div>
          <TodayFeed />
        </div>

        <div className="space-y-6">
          <PulseCompare />
          <TodoList />
        </div>
      </div>
    </div>
  )
}
