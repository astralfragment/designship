const FIGMA_API = 'https://api.figma.com/v1'

function headers(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function getMe(token: string) {
  const res = await fetch(`${FIGMA_API}/me`, { headers: headers(token) })
  if (!res.ok) throw new Error(`Figma /me failed: ${res.status}`)
  return res.json()
}

export async function getRecentFiles(token: string) {
  // Figma doesn't have a /me/files endpoint publicly, so use team files or projects
  // For personal files, we use the /me endpoint which includes teams
  const me = await getMe(token)
  const files: Array<{ key: string; name: string; last_modified: string }> = []

  // Try to get files from each team the user belongs to
  if (me.teams && Array.isArray(me.teams)) {
    for (const team of me.teams) {
      try {
        const projectsRes = await fetch(`${FIGMA_API}/teams/${team.id}/projects`, {
          headers: headers(token),
        })
        if (!projectsRes.ok) continue
        const projectsData = await projectsRes.json()

        for (const project of projectsData.projects || []) {
          const filesRes = await fetch(`${FIGMA_API}/projects/${project.id}/files`, {
            headers: headers(token),
          })
          if (!filesRes.ok) continue
          const filesData = await filesRes.json()
          for (const file of filesData.files || []) {
            files.push({
              key: file.key,
              name: file.name,
              last_modified: file.last_modified,
            })
          }
        }
      } catch {
        // Skip teams we can't access
      }
    }
  }

  return files
}

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
}

interface FrameInfo {
  id: string
  name: string
  type: string
}

function extractFrames(node: FigmaNode, frames: FrameInfo[] = []): FrameInfo[] {
  if (node.type === 'FRAME') {
    frames.push({ id: node.id, name: node.name, type: node.type })
  }
  if (node.children) {
    for (const child of node.children) {
      extractFrames(child, frames)
    }
  }
  return frames
}

export async function getFileFrames(token: string, fileKey: string) {
  const res = await fetch(`${FIGMA_API}/files/${fileKey}?depth=3`, {
    headers: headers(token),
  })
  if (!res.ok) throw new Error(`Figma /files failed: ${res.status}`)
  const data = await res.json()

  const frames: FrameInfo[] = []
  const document = data.document as FigmaNode
  if (document.children) {
    for (const page of document.children) {
      extractFrames(page, frames)
    }
  }

  return {
    name: data.name as string,
    lastModified: data.lastModified as string,
    frames,
  }
}

export async function getFrameThumbnails(
  token: string,
  fileKey: string,
  nodeIds: string[]
) {
  const ids = nodeIds.join(',')
  const res = await fetch(
    `${FIGMA_API}/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=1`,
    { headers: headers(token) }
  )
  if (!res.ok) throw new Error(`Figma /images failed: ${res.status}`)
  const data = await res.json()
  return data.images as Record<string, string | null>
}
