import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PencilRulerIcon,
  ExternalLinkIcon,
  ImageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
} from 'lucide-react'
import type { FigmaLinkWithScreenshot } from '@/hooks/use-figma'

interface FigmaThumbnailsProps {
  links: FigmaLinkWithScreenshot[]
}

export function FigmaThumbnails({ links }: FigmaThumbnailsProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  if (links.length === 0) return null

  const hasScreenshots = links.some((l) => l.screenshotUrl)
  const allLoading = links.every((l) => l.loading)
  const hasMultiple = links.length > 1

  if (allLoading) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-ds-text-tertiary">
          <PencilRulerIcon className="size-3" />
          <span>Loading design previews...</span>
          <LoaderCircleIcon className="size-3 animate-spin" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-16 w-24 rounded-md sm:h-20 sm:w-32" />
          {hasMultiple && <Skeleton className="h-16 w-24 rounded-md sm:h-20 sm:w-32" />}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 text-[10px] text-ds-text-tertiary">
          <PencilRulerIcon className="size-3" />
          <span>
            {hasMultiple
              ? `${links.length} design references`
              : 'Design reference'}
          </span>
        </div>

        {hasScreenshots ? (
          <div className="flex flex-wrap gap-2">
            {links.map((link, i) => (
              <FigmaThumbnailItem
                key={`${link.fileKey}-${link.nodeId ?? i}`}
                link={link}
                onClick={() => {
                  setPreviewIndex(i)
                  setPreviewOpen(true)
                }}
                label={hasMultiple ? (i === 0 ? 'Before' : 'After') : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {links.map((link, i) => (
              <FigmaLinkFallback
                key={`${link.fileKey}-${link.nodeId ?? i}`}
                link={link}
              />
            ))}
          </div>
        )}
      </div>

      {hasScreenshots && (
        <FigmaPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          links={links}
          currentIndex={previewIndex}
          onIndexChange={setPreviewIndex}
        />
      )}
    </>
  )
}

function FigmaThumbnailItem({
  link,
  onClick,
  label,
}: {
  link: FigmaLinkWithScreenshot
  onClick: () => void
  label?: string
}) {
  const [imgError, setImgError] = useState(false)

  if (link.error || imgError || !link.screenshotUrl) {
    return <FigmaLinkFallback link={link} />
  }

  if (link.loading) {
    return <Skeleton className="h-16 w-24 rounded-md sm:h-20 sm:w-32" />
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/thumb relative overflow-hidden rounded-md border border-border/40',
        'transition-all hover:border-border/70 hover:ring-2 hover:ring-primary/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {label && (
        <Badge
          variant="secondary"
          className="absolute top-1 left-1 z-10 text-[9px] px-1 py-0"
        >
          {label}
        </Badge>
      )}
      <img
        src={link.screenshotUrl}
        alt="Figma design preview"
        className="h-16 w-24 object-cover object-top sm:h-20 sm:w-32"
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/thumb:bg-black/20">
        <ImageIcon className="size-4 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100" />
      </div>
    </button>
  )
}

function FigmaLinkFallback({ link }: { link: FigmaLinkWithScreenshot }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border/40 px-2.5 py-1.5',
        'text-[11px] text-ds-text-secondary transition-colors',
        'hover:border-border/70 hover:text-ds-text-primary',
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <PencilRulerIcon className="size-3" />
      <span>Figma design</span>
      <ExternalLinkIcon className="size-2.5" />
    </a>
  )
}

function FigmaPreviewDialog({
  open,
  onOpenChange,
  links,
  currentIndex,
  onIndexChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  links: FigmaLinkWithScreenshot[]
  currentIndex: number
  onIndexChange: (index: number) => void
}) {
  const screenshotLinks = links.filter((l) => l.screenshotUrl)
  const hasMultiple = screenshotLinks.length > 1
  const current = screenshotLinks[currentIndex] ?? screenshotLinks[0]
  const [compareMode, setCompareMode] = useState(false)

  if (!current) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilRulerIcon className="size-4" />
            Design Preview
            {hasMultiple && (
              <Badge variant="secondary" className="text-[10px]">
                {currentIndex + 1} / {screenshotLinks.length}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Figma design screenshot preview
          </DialogDescription>
        </DialogHeader>

        {hasMultiple && !compareMode && (
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  onIndexChange(
                    (currentIndex - 1 + screenshotLinks.length) %
                      screenshotLinks.length,
                  )
                }
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  onIndexChange((currentIndex + 1) % screenshotLinks.length)
                }
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
            {screenshotLinks.length === 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareMode(true)}
                className="text-xs"
              >
                Compare
              </Button>
            )}
          </div>
        )}

        {compareMode && screenshotLinks.length >= 2 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-ds-text-tertiary uppercase">
                  Before
                </span>
                <img
                  src={screenshotLinks[0]!.screenshotUrl!}
                  alt="Before design"
                  className="w-full rounded-md border border-border/40"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-ds-text-tertiary uppercase">
                  After
                </span>
                <img
                  src={screenshotLinks[1]!.screenshotUrl!}
                  alt="After design"
                  className="w-full rounded-md border border-border/40"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareMode(false)}
              className="text-xs"
            >
              Exit comparison
            </Button>
          </div>
        ) : (
          <img
            src={current.screenshotUrl!}
            alt="Figma design preview"
            className="w-full rounded-md border border-border/40"
          />
        )}

        <a
          href={current.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          Open in Figma
          <ExternalLinkIcon className="size-3" />
        </a>
      </DialogContent>
    </Dialog>
  )
}
