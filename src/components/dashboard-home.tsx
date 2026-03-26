import { PRTimeline } from '@/components/pr-timeline'
import { WeeklySummary } from '@/components/weekly-summary'

export function DashboardHome() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-w-6xl">
      <PRTimeline />
      <div className="space-y-6">
        <WeeklySummary />
      </div>
    </div>
  )
}
