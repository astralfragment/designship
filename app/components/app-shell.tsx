import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { LogOutIcon, MenuIcon, SettingsIcon, FileTextIcon } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const fullName = (user?.user_metadata?.full_name as string) ?? user?.email ?? ''
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-ds-surface-0">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/40 bg-ds-surface-0/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="sm:hidden" />
              }
            >
              <MenuIcon className="size-4" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>DesignShip</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                <Link
                  to="/"
                  className="rounded-md px-3 py-2 text-sm text-ds-text-secondary hover:bg-accent hover:text-accent-foreground [&.active]:text-ds-text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  Timeline
                </Link>
                <Link
                  to="/summaries"
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-ds-text-secondary hover:bg-accent hover:text-accent-foreground [&.active]:text-ds-text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <FileTextIcon className="size-3.5" />
                  Summaries
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="text-base font-semibold tracking-tight text-ds-text-primary">
            DesignShip
          </Link>

          <nav className="ml-6 hidden items-center gap-1 sm:flex">
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 text-sm text-ds-text-secondary transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:text-ds-text-primary"
            >
              Timeline
            </Link>
            <Link
              to="/summaries"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-ds-text-secondary transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:text-ds-text-primary"
            >
              <FileTextIcon className="size-3.5" />
              Summaries
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
              }
            >
              <Avatar size="sm">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback>{initials || '?'}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuLabel>{fullName || 'Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to="/settings">
                <DropdownMenuItem>
                  <SettingsIcon />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOutIcon />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
