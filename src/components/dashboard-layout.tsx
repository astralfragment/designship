import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { fetchUser, getLogoutUrl } from '@/lib/github'
import { Ship, LayoutDashboard, LogOut } from 'lucide-react'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Ship className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-mono text-sidebar-foreground tracking-widest uppercase">
                DesignShip
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => navigate({ to: '/dashboard' })}
                      isActive
                      className="gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            {user && (
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url} alt={user.name || user.login} />
                  <AvatarFallback>{(user.login || '?')[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name || user.login}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    @{user.login}
                  </p>
                </div>
              </div>
            )}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2 text-muted-foreground hover:text-foreground">
                  <a href={getLogoutUrl()}>
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex items-center gap-2 border-b border-border px-6 py-3">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="h-4" />
            <h1
              className="text-lg font-semibold text-foreground"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Dashboard
            </h1>
          </header>
          <main className="p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
