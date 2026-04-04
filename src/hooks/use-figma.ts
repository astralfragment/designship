import { useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import {
  fetchRecentFiles,
  fetchFileScreenshot,
  hasFigmaToken,
  extractFigmaLinks,
  type FigmaLink,
} from '@/lib/figma'

interface TimelineEventLike {
  id: string
  description: string | null
}

export function useFigmaFiles() {
  return useQuery({
    queryKey: ['figma', 'files'],
    queryFn: () => fetchRecentFiles(),
    enabled: hasFigmaToken(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFigmaScreenshot(fileKey: string, nodeId: string) {
  return useQuery({
    queryKey: ['figma', 'screenshot', fileKey, nodeId],
    queryFn: () => fetchFileScreenshot(fileKey, nodeId),
    enabled: hasFigmaToken() && !!fileKey && !!nodeId,
    staleTime: 10 * 60 * 1000,
  })
}

export interface FigmaLinkWithScreenshot extends FigmaLink {
  screenshotUrl: string | null
  loading: boolean
  error: boolean
}

export interface EventFigmaData {
  links: FigmaLinkWithScreenshot[]
}

/**
 * Extracts Figma links from all timeline events' descriptions and fetches
 * screenshots for each. Returns a map of eventId -> FigmaLinkWithScreenshot[].
 */
export function useFigmaScreenshots(events: TimelineEventLike[]) {
  const connected = hasFigmaToken()

  const linksByEvent = useMemo(() => {
    const map = new Map<string, FigmaLink[]>()
    for (const event of events) {
      if (!event.description) continue
      const links = extractFigmaLinks(event.description)
      if (links.length > 0) {
        map.set(event.id, links)
      }
    }
    return map
  }, [events])

  // Flatten all links with nodeIds for parallel fetching
  const allLinks = useMemo(() => {
    const flat: Array<{ eventId: string; link: FigmaLink; index: number }> = []
    for (const [eventId, links] of linksByEvent) {
      links.forEach((link, index) => {
        if (link.nodeId) {
          flat.push({ eventId, link, index })
        }
      })
    }
    return flat
  }, [linksByEvent])

  const results = useQueries({
    queries: allLinks.map(({ link }) => ({
      queryKey: ['figma', 'screenshot', link.fileKey, link.nodeId],
      queryFn: () => fetchFileScreenshot(link.fileKey, link.nodeId!),
      enabled: connected && !!link.nodeId,
      staleTime: 10 * 60 * 1000,
      retry: 1,
    })),
  })

  const figmaData = useMemo(() => {
    const map = new Map<string, EventFigmaData>()

    // First, populate all events that have links (including those without nodeIds)
    for (const [eventId, links] of linksByEvent) {
      map.set(eventId, {
        links: links.map((link) => ({
          ...link,
          screenshotUrl: null,
          loading: false,
          error: false,
        })),
      })
    }

    // Overlay query results for links that have nodeIds
    for (let i = 0; i < allLinks.length; i++) {
      const { eventId, link } = allLinks[i]!
      const result = results[i]!
      const data = map.get(eventId)
      if (!data) continue

      const matchIndex = data.links.findIndex(
        (l) => l.fileKey === link.fileKey && l.nodeId === link.nodeId,
      )
      if (matchIndex === -1) continue

      data.links[matchIndex] = {
        ...data.links[matchIndex]!,
        screenshotUrl: result.data ?? null,
        loading: result.isLoading,
        error: result.isError,
      }
    }

    return map
  }, [linksByEvent, allLinks, results])

  return figmaData
}
