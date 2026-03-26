import { useQuery } from '@tanstack/react-query'
import { fetchMergedPRs } from '@/lib/github'
import { generateWeeklySummary } from '@/lib/rewrite'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Copy, Check, Sparkles } from 'lucide-react'
import { useState, useMemo } from 'react'

export function WeeklySummary() {
  const [copied, setCopied] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const { data: prs, isLoading } = useQuery({
    queryKey: ['prs', 7],
    queryFn: () => fetchMergedPRs(7),
  })

  const summary = useMemo(() => {
    if (!prs) return null
    return generateWeeklySummary(prs)
  }, [prs])

  const handleCopy = async () => {
    if (!summary) return
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: '"Playfair Display", serif' }}>
          <FileText className="w-4 h-4 text-primary" />
          Weekly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {!isLoading && !showSummary && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Generate a stakeholder-ready summary of your last 7 days.
            </p>
            <Button
              onClick={() => setShowSummary(true)}
              className="gap-2"
              disabled={!prs || prs.length === 0}
            >
              <Sparkles className="w-4 h-4" />
              Generate Weekly Summary
            </Button>
            {prs && prs.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No PRs to summarize.</p>
            )}
          </div>
        )}

        {!isLoading && showSummary && summary && (
          <>
            <div className="bg-background/50 border border-border/50 rounded-lg p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {summary}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(false)}
                className="text-muted-foreground"
              >
                Reset
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
