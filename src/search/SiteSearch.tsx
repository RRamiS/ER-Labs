import { useEffect, useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  HISTORY_LIMIT,
  PAGE_SIZE,
  SUGGEST_DEBOUNCE_MS,
  highlightRanges,
  readHistory,
  recommendedLinks,
  rememberQuery,
  searchRecords,
  suggest,
  type SearchKind,
  type SearchRecord,
} from './engine'
import './SiteSearch.css'

type OverlayItem =
  | { kind: 'history'; title: string }
  | { kind: 'suggestion'; title: string }
  | { kind: 'recommended'; title: string; href: string }

function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = highlightRanges(text, query)
  if (ranges.length === 0) return text
  const nodes = []
  let cursor = 0
  ranges.forEach(([start, end], index) => {
    if (start > cursor) nodes.push(text.slice(cursor, start))
    nodes.push(<em key={`${start}-${index}`}>{text.slice(start, end)}</em>)
    cursor = end
  })
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function SearchField({
  id,
  value,
  onChange,
  onSubmit,
  labelledBy,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  labelledBy?: string
}) {
  return (
    <form
      className="site-search-form"
      role="search"
      onSubmit={(event: FormEvent) => {
        event.preventDefault()
        onSubmit(value)
      }}
    >
      <label className="visually-hidden" htmlFor={id} id={labelledBy}>
        Buscar en ER Sistemas
      </label>
      <input
        id={id}
        name="q"
        className="site-search-input"
        type="text"
        autoComplete="off"
        placeholder="Buscar en ER Sistemas..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button className="site-search-submit" type="submit">
        Buscar
      </button>
    </form>
  )
}

export function SearchOverlay({
  open,
  onClose,
  onCommit,
  onFollowHash,
}: {
  open: boolean
  onClose: () => void
  onCommit: (query: string) => void
  onFollowHash: (hash: string) => void
}) {
  const inputId = useId()
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [active, setActive] = useState(-1)

  useEffect(() => {
    if (!open) return
    setDraft('')
    setSuggestions([])
    setHistory(readHistory())
    setActive(-1)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(inputId)?.focus()
    })
    return () => {
      document.body.style.overflow = previous
      window.cancelAnimationFrame(frame)
    }
  }, [open, inputId])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      setSuggestions(suggest(draft))
      setActive(-1)
    }, SUGGEST_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [draft, open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const items = useMemo<OverlayItem[]>(() => {
    const trimmed = draft.trim()
    const next: OverlayItem[] = []
    if (!trimmed) {
      history.slice(0, HISTORY_LIMIT).forEach((title) => next.push({ kind: 'history', title }))
    }
    suggestions.forEach((title) => next.push({ kind: 'suggestion', title }))
    recommendedLinks.forEach((link) => next.push({ kind: 'recommended', ...link }))
    return next
  }, [draft, history, suggestions])

  if (!open) return null

  const commit = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    rememberQuery(trimmed)
    onCommit(trimmed)
    onClose()
  }

  const activate = (item: OverlayItem) => {
    if (item.kind === 'recommended') {
      onClose()
      if (item.href.startsWith('#')) onFollowHash(item.href)
      else window.location.assign(item.href)
      return
    }
    commit(item.title)
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && active >= 0 && items[active]) {
      event.preventDefault()
      activate(items[active])
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    if (items.length === 0) return
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    const next = active < 0
      ? direction > 0 ? 0 : items.length - 1
      : (active + direction + items.length) % items.length
    setActive(next)
  }

  return createPortal(
    <div className="site-search-overlay" role="presentation">
      <button className="site-search-cover" type="button" aria-label="Cerrar búsqueda" onClick={onClose} />
      <div className="site-search-panel" role="dialog" aria-modal="true" aria-label="Buscar">
        <div onKeyDown={onInputKeyDown}>
          <SearchField id={inputId} value={draft} onChange={setDraft} onSubmit={commit} />
        </div>
        <div className="site-search-push">
          {suggestions.length > 0 ? (
            <section>
              <h3>Búsquedas sugeridas</h3>
              <ul>
                {suggestions.map((title) => {
                  const index = items.findIndex((item) => item.kind === 'suggestion' && item.title === title)
                  return (
                    <li key={title}>
                      <button
                        type="button"
                        className={index === active ? 'is-active' : undefined}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => commit(title)}
                      >
                        <Highlight text={title} query={draft} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
          {!draft.trim() && history.length > 0 ? (
            <section>
              <h3>Recientes</h3>
              <ul>
                {history.map((title) => {
                  const index = items.findIndex((item) => item.kind === 'history' && item.title === title)
                  return (
                    <li key={title}>
                      <button
                        type="button"
                        className={index === active ? 'is-active' : undefined}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => commit(title)}
                      >
                        {title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
          <section>
            <h3>Recomendado</h3>
            <ul>
              {recommendedLinks.map((link) => {
                const index = items.findIndex(
                  (item) => item.kind === 'recommended' && item.href === link.href,
                )
                return (
                  <li key={link.href}>
                    <button
                      type="button"
                      className={index === active ? 'is-active' : undefined}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => activate({ kind: 'recommended', ...link })}
                    >
                      {link.title}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ResultCard({
  record,
  query,
  onOpenProject,
}: {
  record: SearchRecord
  query: string
  onOpenProject: (projectId: string) => void
}) {
  return (
    <article className="site-search-card">
      {record.image ? <img src={record.image} alt="" /> : <div className="site-search-card-fallback" />}
      <div>
        <p className="site-search-kicker">{record.kind === 'proyecto' ? 'Proyecto' : record.projectName}</p>
        <h3>
          <button type="button" onClick={() => onOpenProject(record.projectId)}>
            <Highlight text={record.title} query={query} />
          </button>
        </h3>
        <p>{record.summary}</p>
        <div className="site-search-actions">
          <button type="button" onClick={() => onOpenProject(record.projectId)}>
            Ver proyecto
          </button>
          {record.liveUrl ? (
            <a href={record.liveUrl} target="_blank" rel="noreferrer">
              Demo
            </a>
          ) : null}
          <a href={record.repoUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </article>
  )
}

export function SearchResults({
  query,
  onCommit,
  onOpenProject,
}: {
  query: string
  onCommit: (query: string) => void
  onOpenProject: (projectId: string) => void
}) {
  const inputId = useId()
  const groups = useMemo(
    () => ({
      proyecto: searchRecords(query, 'proyecto'),
      modulo: searchRecords(query, 'modulo'),
    }),
    [query],
  )
  const preferredTab: SearchKind =
    groups.proyecto.length === 0 && groups.modulo.length > 0 ? 'modulo' : 'proyecto'
  const [draft, setDraft] = useState(query)
  const [tab, setTab] = useState<SearchKind>(preferredTab)
  const [visible, setVisible] = useState<Record<SearchKind, number>>({
    proyecto: PAGE_SIZE,
    modulo: PAGE_SIZE,
  })
  const [syncedQuery, setSyncedQuery] = useState(query)

  if (syncedQuery !== query) {
    setSyncedQuery(query)
    setDraft(query)
    setTab(preferredTab)
    setVisible({ proyecto: PAGE_SIZE, modulo: PAGE_SIZE })
  }

  const tabs: Array<{ kind: SearchKind; label: string }> = [
    { kind: 'proyecto', label: 'Proyectos' },
    { kind: 'modulo', label: 'Módulos' },
  ]
  const active = groups[tab]
  const shown = active.slice(0, visible[tab])

  return (
    <section className="site-search-results" aria-labelledby="search-results-title">
      <div className="site-search-results-bar">
        <p className="eyebrow">Búsqueda</p>
        <h1 id="search-results-title">Resultados para “{query}”</h1>
        <SearchField id={inputId} value={draft} onChange={setDraft} onSubmit={onCommit} />
      </div>
      <div className="site-search-tabs" role="tablist" aria-label="Tipo de resultado">
        {tabs.map((item) => (
          <button
            key={item.kind}
            type="button"
            role="tab"
            aria-selected={tab === item.kind}
            className={tab === item.kind ? 'is-active' : undefined}
            onClick={() => setTab(item.kind)}
          >
            {item.label}
            <span>({groups[item.kind].length})</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="site-search-empty">No hay {tab === 'proyecto' ? 'proyectos' : 'módulos'} para “{query}”.</p>
      ) : (
        <div className="site-search-list">
          {shown.map((record) => (
            <ResultCard key={record.id} record={record} query={query} onOpenProject={onOpenProject} />
          ))}
        </div>
      )}
      {shown.length < active.length ? (
        <button
          type="button"
          className="site-search-more"
          onClick={() =>
            setVisible((current) => ({ ...current, [tab]: current[tab] + PAGE_SIZE }))
          }
        >
          Cargar más
        </button>
      ) : null}
    </section>
  )
}
