import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

const GITHUB_TOKEN_KEY = 'ds-github-token'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  githubToken: string | null
}

interface AuthContextValue extends AuthState {
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    githubToken: typeof window !== 'undefined'
      ? localStorage.getItem(GITHUB_TOKEN_KEY)
      : null,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.provider_token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token)
      }
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        githubToken:
          session?.provider_token ??
          localStorage.getItem(GITHUB_TOKEN_KEY),
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.provider_token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token)
      }
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        githubToken:
          session?.provider_token ??
          localStorage.getItem(GITHUB_TOKEN_KEY),
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGitHub = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user repo',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem(GITHUB_TOKEN_KEY)
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, signInWithGitHub, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
