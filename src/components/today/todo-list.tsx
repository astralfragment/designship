import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, GitPullRequest } from 'lucide-react'

interface Todo {
  id: string
  text: string
  done: boolean
  source: string
}

interface OpenPR {
  id: string
  title: string
  repo: string
}

async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('id, text, done, source')
    .eq('done', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data ?? []
}

async function fetchOpenPRs(): Promise<OpenPR[]> {
  const { data, error } = await supabase
    .from('github_prs')
    .select('id, title, repo')
    .is('merged_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data ?? []
}

async function addTodo(text: string): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert({ text, source: 'manual' })
    .select('id, text, done, source')
    .single()

  if (error) throw error
  return data
}

async function addTodoFromPR(pr: OpenPR): Promise<Todo> {
  const text = `Review: ${pr.title} (${pr.repo})`
  const { data, error } = await supabase
    .from('todos')
    .insert({ text, source: 'github_pr' })
    .select('id, text, done, source')
    .single()

  if (error) throw error
  return data
}

async function toggleTodo(id: string, done: boolean) {
  const { error } = await supabase
    .from('todos')
    .update({ done })
    .eq('id', id)

  if (error) throw error
}

export function TodoList() {
  const [input, setInput] = useState('')
  const queryClient = useQueryClient()

  const { data: todos, isLoading: todosLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const { data: openPRs } = useQuery({
    queryKey: ['open-prs'],
    queryFn: fetchOpenPRs,
  })

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setInput('')
    },
  })

  const addFromPRMutation = useMutation({
    mutationFn: addTodoFromPR,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      toggleTodo(id, done),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const prev = queryClient.getQueryData<Todo[]>(['todos'])
      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.map((t) => (t.id === id ? { ...t, done } : t))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    addMutation.mutate(text)
  }

  // Filter out PRs that already have a matching todo
  const todoTexts = new Set((todos ?? []).map((t) => t.text))
  const suggestedPRs = (openPRs ?? []).filter(
    (pr) => !todoTexts.has(`Review: ${pr.title} (${pr.repo})`)
  )

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-base font-semibold"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Todos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a todo..."
            className="h-8 text-sm bg-background/50"
            disabled={addMutation.isPending}
          />
        </form>

        {todosLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-[280px]">
            <div className="space-y-1">
              {(todos ?? []).slice(0, 10).map((todo) => (
                <label
                  key={todo.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer group"
                >
                  <Checkbox
                    checked={todo.done}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({
                        id: todo.id,
                        done: checked === true,
                      })
                    }
                  />
                  <span
                    className={`text-sm flex-1 ${
                      todo.done
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {todo.text}
                  </span>
                </label>
              ))}

              {(todos ?? []).length === 0 && suggestedPRs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No todos yet — add one above
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        {suggestedPRs.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">
              Open PRs — add as todo?
            </p>
            <div className="space-y-1">
              {suggestedPRs.map((pr) => (
                <button
                  key={pr.id}
                  onClick={() => addFromPRMutation.mutate(pr)}
                  disabled={addFromPRMutation.isPending}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent/50 text-left group"
                >
                  <Plus className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary" />
                  <GitPullRequest className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground truncate flex-1">
                    {pr.title}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {pr.repo}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
