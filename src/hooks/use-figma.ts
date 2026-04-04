import { useQuery } from '@tanstack/react-query'
import { fetchRecentFiles, fetchFileScreenshot, hasFigmaToken } from '@/lib/figma'

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
