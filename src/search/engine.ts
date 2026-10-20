import { projects, type Project } from '../data/projects'

export type SearchKind = 'proyecto' | 'modulo'

export type SearchRecord = {
  id: string
  kind: SearchKind
  title: string
  summary: string
  projectId: string
  projectName: string
  image?: string
  liveUrl?: string
  repoUrl: string
}

export type RecommendedLink = {
  title: string
  href: string
}

export const PAGE_SIZE = 10
export const SUGGESTION_LIMIT = 5
export const MIN_SUGGEST_LENGTH = 2
export const MAX_SUGGEST_LENGTH = 30
export const SUGGEST_DEBOUNCE_MS = 250
export const HISTORY_KEY = 'er-labs-historical-search'
export const HISTORY_LIMIT = 5

export const recommendedLinks: RecommendedLink[] = [
  { title: 'Proyectos', href: '#proyectos' },
  { title: 'Equipo', href: '#equipo' },
  { title: 'Repo de esta web', href: 'https://github.com/RRamiS/ER-Labs' },
]

function fold(value: string) {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function projectSummary(project: Project) {
  return `${project.blurb} ${project.stack}`
}

function moduleSummary(project: Project, caption: string, description?: string, tags?: string[]) {
  return [description || caption, project.name, ...(tags ?? [])].join(' · ')
}

export const catalog: SearchRecord[] = projects.flatMap((project) => {
  const cover = project.gallery.find((shot) => shot.src)?.src
  const projectRecord: SearchRecord = {
    id: `proyecto-${project.id}`,
    kind: 'proyecto',
    title: project.name,
    summary: projectSummary(project),
    projectId: project.id,
    projectName: project.name,
    image: cover,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
  }

  const modules = project.gallery.map((shot, index) => ({
    id: `modulo-${project.id}-${index}`,
    kind: 'modulo' as const,
    title: shot.stepTitle || shot.caption,
    summary: moduleSummary(project, shot.caption, shot.description, shot.tags),
    projectId: project.id,
    projectName: project.name,
    image: shot.src,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
  }))

  return [projectRecord, ...modules]
})

function haystack(record: SearchRecord) {
  return fold(`${record.title} ${record.summary} ${record.projectName}`)
}

export function suggest(query: string) {
  const trimmed = query.trim()
  if (trimmed.length < MIN_SUGGEST_LENGTH || trimmed.length > MAX_SUGGEST_LENGTH) {
    return []
  }
  const needle = fold(trimmed)
  const seen = new Set<string>()
  const titles: string[] = []
  for (const record of catalog) {
    if (!fold(record.title).includes(needle) || seen.has(record.title)) continue
    seen.add(record.title)
    titles.push(record.title)
    if (titles.length === SUGGESTION_LIMIT) break
  }
  return titles
}

export function searchRecords(query: string, kind: SearchKind) {
  const needle = fold(query.trim())
  if (!needle) return []
  return catalog.filter((record) => record.kind === kind && haystack(record).includes(needle))
}

export function highlightRanges(text: string, query: string) {
  const needle = fold(query.trim())
  if (needle.length < MIN_SUGGEST_LENGTH) return []
  let folded = ''
  const map: number[] = []
  for (let index = 0; index < text.length; index += 1) {
    const piece = fold(text[index] ?? '')
    for (let offset = 0; offset < piece.length; offset += 1) {
      folded += piece[offset]
      map.push(index)
    }
  }
  const ranges: Array<[number, number]> = []
  let from = 0
  while (from <= folded.length - needle.length) {
    const found = folded.indexOf(needle, from)
    if (found === -1) break
    const start = map[found] ?? 0
    const end = (map[found + needle.length - 1] ?? start) + 1
    ranges.push([start, end])
    from = found + needle.length
  }
  return ranges
}

export function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function readSearchQuery() {
  return new URLSearchParams(window.location.search).get('q')?.trim() ?? ''
}

export function writeSearchQuery(query: string) {
  const trimmed = query.trim()
  const url = trimmed ? `/?q=${encodeURIComponent(trimmed)}` : window.location.pathname
  window.history.pushState({ q: trimmed }, '', url)
  return trimmed
}

export function rememberQuery(query: string) {
  const trimmed = query.trim()
  if (trimmed.length < MIN_SUGGEST_LENGTH) return readHistory()
  const next = [trimmed, ...readHistory().filter((item) => fold(item) !== fold(trimmed))].slice(
    0,
    HISTORY_LIMIT,
  )
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}
