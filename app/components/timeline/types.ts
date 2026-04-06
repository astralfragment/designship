export type TimelineEventType = 'pr_merged' | 'commit' | 'deploy' | 'design'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description: string | null
  timestamp: string
  url: string | null
  author: {
    name: string
    avatarUrl: string | null
  }
  metadata: TimelineEventMetadata
}

export interface PRMetadata {
  type: 'pr_merged'
  number: number
  branch: string
  baseBranch: string
  reviewCount?: number
  filesChanged?: number
  additions?: number
  deletions?: number
  labels: Array<{ name: string; color: string }>
}

export interface CommitMetadata {
  type: 'commit'
  sha: string
  additions?: number
  deletions?: number
}

export interface DeployMetadata {
  type: 'deploy'
  environment: string
  status: 'success' | 'failed' | 'pending'
}

export interface DesignMetadata {
  type: 'design'
  fileKey: string
  thumbnailUrl?: string
}

export type TimelineEventMetadata =
  | PRMetadata
  | CommitMetadata
  | DeployMetadata
  | DesignMetadata
