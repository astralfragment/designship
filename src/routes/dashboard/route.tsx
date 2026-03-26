import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/dashboard-layout'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const token = document.cookie.includes('gh_logged_in=1')
    if (!token) {
      throw redirect({ to: '/' })
    }
  },
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
})
