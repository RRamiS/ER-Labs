import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type MutableRefObject,
  type TransitionEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  projects,
  team,
  type GalleryShot,
  type Project,
  type ShotHotspot,
} from './data/projects'
import './App.css'

type Theme = 'light' | 'dark'

type PeekShot = {
  src: string
  caption: string
  accent: string
  hotspots?: ShotHotspot[]
  origin: {
    top: number
    left: number
    width: number
    height: number
  }
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('er-labs-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('is-visible')
          observer.unobserve(node)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return ref
}

function getPeekGeometry(
  origin: PeekShot['origin'],
  options?: { annotated?: boolean },
) {
  const annotated = options?.annotated ?? false
  if (annotated) {
    const width = Math.min(1180, window.innerWidth * 0.96)
    const height = Math.min(window.innerHeight * 0.9, 860)
    return {
      width,
      height,
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
    }
  }
  const maxW = Math.min(880, window.innerWidth * 0.86)
  const maxH = Math.min(window.innerHeight * 0.72, 640)
  const ratio = origin.width / Math.max(origin.height, 1)
  let width = maxW
  let height = width / ratio
  if (height > maxH) {
    height = maxH
    width = height * ratio
  }
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
  }
}

function groupHotspots(hotspots: ShotHotspot[]) {
  const left: ShotHotspot[] = []
  const right: ShotHotspot[] = []
  const bottom: ShotHotspot[] = []
  hotspots.forEach((hotspot) => {
    const side = hotspot.side ?? 'right'
    if (side === 'left') left.push(hotspot)
    else if (side === 'right') right.push(hotspot)
    else bottom.push(hotspot)
  })
  return { left, right, bottom }
}

type ConnectorLine = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

function HotspotBoxes({
  hotspots,
  accent,
  boxRefs,
}: {
  hotspots: ShotHotspot[]
  accent: string
  boxRefs: MutableRefObject<Map<string, HTMLElement | null>>
}) {
  return (
    <div className="shot-hotspots">
      {hotspots.map((hotspot, index) => (
        <div
          key={hotspot.id}
          ref={(node) => {
            boxRefs.current.set(hotspot.id, node)
          }}
          className="shot-hotspot-box is-active"
          style={
            {
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.w ?? 10}%`,
              height: `${hotspot.h ?? 8}%`,
              '--accent': accent,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <span className="shot-hotspot-index">{index + 1}</span>
        </div>
      ))}
    </div>
  )
}

function AnnotateNote({
  hotspot,
  index,
  accent,
  noteRefs,
}: {
  hotspot: ShotHotspot
  index: number
  accent: string
  noteRefs: MutableRefObject<Map<string, HTMLElement | null>>
}) {
  return (
    <article
      ref={(node) => {
        noteRefs.current.set(hotspot.id, node)
      }}
      className="shot-annotate-note"
      style={{ '--accent': accent } as CSSProperties}
    >
      <span className="shot-annotate-note-index">{index}</span>
      <div>
        <strong>{hotspot.label}</strong>
        {hotspot.text ? <p>{hotspot.text}</p> : null}
      </div>
    </article>
  )
}

function ShotPeek({
  shot,
  onClose,
}: {
  shot: PeekShot
  onClose: () => void
}) {
  const annotated = (shot.hotspots?.length ?? 0) > 0
  const [phase, setPhase] = useState<'enter' | 'open' | 'exit'>('enter')
  const [connectors, setConnectors] = useState<ConnectorLine[]>([])
  const final = useRef(getPeekGeometry(shot.origin, { annotated }))
  const phaseRef = useRef(phase)
  const layoutRef = useRef<HTMLDivElement | null>(null)
  const boxRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  const noteRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  phaseRef.current = phase

  const groups = annotated && shot.hotspots ? groupHotspots(shot.hotspots) : null
  const hotspotIndex = new Map(
    (shot.hotspots ?? []).map((hotspot, index) => [hotspot.id, index + 1]),
  )

  useEffect(() => {
    final.current = getPeekGeometry(shot.origin, { annotated })
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setPhase('open'))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [shot, annotated])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setPhase('exit')
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey, true)
    }
  }, [])

  useEffect(() => {
    if (!annotated || phase !== 'open' || !shot.hotspots?.length) {
      setConnectors([])
      return
    }

    const updateConnectors = () => {
      const layout = layoutRef.current
      if (!layout) return
      const layoutRect = layout.getBoundingClientRect()
      if (layoutRect.width < 1 || layoutRect.height < 1) return

      const next: ConnectorLine[] = []
      for (const hotspot of shot.hotspots!) {
        const box = boxRefs.current.get(hotspot.id)
        const note = noteRefs.current.get(hotspot.id)
        if (!box || !note) continue
        const boxRect = box.getBoundingClientRect()
        const noteRect = note.getBoundingClientRect()
        const side = hotspot.side ?? 'right'

        let x1 = 0
        let y1 = 0
        let x2 = 0
        let y2 = 0

        if (side === 'left') {
          x1 = ((boxRect.left - layoutRect.left) / layoutRect.width) * 100
          y1 = ((boxRect.top + boxRect.height / 2 - layoutRect.top) / layoutRect.height) * 100
          x2 = ((noteRect.right - layoutRect.left) / layoutRect.width) * 100
          y2 = ((noteRect.top + noteRect.height / 2 - layoutRect.top) / layoutRect.height) * 100
        } else if (side === 'right') {
          x1 = ((boxRect.right - layoutRect.left) / layoutRect.width) * 100
          y1 = ((boxRect.top + boxRect.height / 2 - layoutRect.top) / layoutRect.height) * 100
          x2 = ((noteRect.left - layoutRect.left) / layoutRect.width) * 100
          y2 = ((noteRect.top + noteRect.height / 2 - layoutRect.top) / layoutRect.height) * 100
        } else {
          x1 = ((boxRect.left + boxRect.width / 2 - layoutRect.left) / layoutRect.width) * 100
          y1 = ((boxRect.bottom - layoutRect.top) / layoutRect.height) * 100
          x2 = ((noteRect.left + noteRect.width / 2 - layoutRect.left) / layoutRect.width) * 100
          y2 = ((noteRect.top - layoutRect.top) / layoutRect.height) * 100
        }

        next.push({ id: hotspot.id, x1, y1, x2, y2 })
      }
      setConnectors(next)
    }

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(updateConnectors)
    })
    window.addEventListener('resize', updateConnectors)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateConnectors)
    }
  }, [annotated, phase, shot])

  const requestClose = () => setPhase('exit')

  const onFrameTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.propertyName !== 'transform') return
    if (phaseRef.current === 'exit') onClose()
  }

  const expanded = phase === 'open'
  const sx = shot.origin.width / final.current.width
  const sy = shot.origin.height / final.current.height
  const dx = shot.origin.left - final.current.left
  const dy = shot.origin.top - final.current.top

  return createPortal(
    <div
      className={`shot-peek${expanded ? ' is-open' : ''}${phase === 'exit' ? ' is-exit' : ''}${annotated ? ' is-annotated' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={shot.caption}
      onClick={requestClose}
    >
      <figure
        className={`shot-peek-frame${expanded ? ' is-open' : ''}${annotated ? ' is-annotated' : ''}`}
        style={
          {
            '--accent': shot.accent,
            top: final.current.top,
            left: final.current.left,
            width: final.current.width,
            height: final.current.height,
            transform: expanded
              ? 'translate3d(0, 0, 0) scale(1, 1)'
              : `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
          } as CSSProperties
        }
        onClick={(event) => event.stopPropagation()}
        onTransitionEnd={onFrameTransitionEnd}
      >
        {annotated && shot.hotspots && groups ? (
          <>
            <header className="shot-annotate-header">
              <div>
                <p className="shot-annotate-kicker">Captura anotada</p>
                <h3>{shot.caption}</h3>
              </div>
              <button type="button" className="shot-peek-close" onClick={requestClose}>
                Cerrar
              </button>
            </header>

            <div className="shot-annotate-body" ref={layoutRef}>
              <div className="shot-annotate-rail is-left">
                {groups.left.map((hotspot) => (
                  <AnnotateNote
                    key={hotspot.id}
                    hotspot={hotspot}
                    index={hotspotIndex.get(hotspot.id) ?? 1}
                    accent={shot.accent}
                    noteRefs={noteRefs}
                  />
                ))}
              </div>

              <div className="shot-peek-media">
                <div className="shot-peek-media-inner">
                  <img
                    src={shot.src}
                    alt={shot.caption}
                    onLoad={() => {
                      window.dispatchEvent(new Event('resize'))
                    }}
                  />
                  <HotspotBoxes
                    hotspots={shot.hotspots}
                    accent={shot.accent}
                    boxRefs={boxRefs}
                  />
                </div>
              </div>

              <div className="shot-annotate-rail is-right">
                {groups.right.map((hotspot) => (
                  <AnnotateNote
                    key={hotspot.id}
                    hotspot={hotspot}
                    index={hotspotIndex.get(hotspot.id) ?? 1}
                    accent={shot.accent}
                    noteRefs={noteRefs}
                  />
                ))}
              </div>

              <div className="shot-annotate-rail is-bottom">
                {groups.bottom.map((hotspot) => (
                  <AnnotateNote
                    key={hotspot.id}
                    hotspot={hotspot}
                    index={hotspotIndex.get(hotspot.id) ?? 1}
                    accent={shot.accent}
                    noteRefs={noteRefs}
                  />
                ))}
              </div>

              {connectors.length > 0 ? (
                <svg
                  className="shot-annotate-connector"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id="annotate-arrow-head"
                      markerWidth="4"
                      markerHeight="4"
                      refX="3.2"
                      refY="2"
                      orient="auto"
                    >
                      <path d="M0,0 L4,2 L0,4 Z" fill={shot.accent} />
                    </marker>
                  </defs>
                  {connectors.map((line) => {
                    const curveX = (line.x1 + line.x2) / 2
                    const curveY = (line.y1 + line.y2) / 2 - 4
                    return (
                      <path
                        key={line.id}
                        d={`M ${line.x1} ${line.y1} Q ${curveX} ${curveY}, ${line.x2} ${line.y2}`}
                        fill="none"
                        stroke={shot.accent}
                        strokeWidth="0.4"
                        strokeLinecap="round"
                        markerEnd="url(#annotate-arrow-head)"
                        opacity="0.9"
                      />
                    )
                  })}
                </svg>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="shot-peek-media">
              <img src={shot.src} alt={shot.caption} />
            </div>
            <figcaption>{shot.caption}</figcaption>
            <button type="button" className="shot-peek-close" onClick={requestClose}>
              Cerrar
            </button>
          </>
        )}
      </figure>
    </div>,
    document.body,
  )
}

function GalleryFigure({
  shot,
  accent,
  onPeek,
}: {
  shot: GalleryShot
  accent: string
  onPeek: (shot: PeekShot) => void
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dwellRef = useRef<number | null>(null)
  const [warming, setWarming] = useState(false)

  const clearDwell = () => {
    if (dwellRef.current !== null) {
      window.clearTimeout(dwellRef.current)
      dwellRef.current = null
    }
    setWarming(false)
  }

  useEffect(
    () => () => {
      if (dwellRef.current !== null) window.clearTimeout(dwellRef.current)
    },
    [],
  )

  const openPeek = () => {
    if (!shot.src || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    clearDwell()
    onPeek({
      src: shot.src,
      caption: shot.caption,
      accent,
      hotspots: shot.hotspots,
      origin: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    })
  }

  const onEnter = () => {
    if (!shot.src) return
    setWarming(true)
    dwellRef.current = window.setTimeout(() => {
      openPeek()
    }, 900)
  }

  if (!shot.src) {
    return (
      <figure
        className="gallery-shot is-placeholder"
        style={{
          background: `linear-gradient(145deg, ${accent}55, ${accent}18)`,
        }}
      >
        <span className="gallery-placeholder-label">Captura pendiente</span>
        <figcaption>{shot.caption}</figcaption>
      </figure>
    )
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`gallery-shot gallery-shot-btn${warming ? ' is-warming' : ''}`}
      onClick={openPeek}
      onMouseEnter={onEnter}
      onMouseLeave={clearDwell}
      aria-label={`Ampliar ${shot.caption}`}
    >
      <img src={shot.src} alt="" decoding="async" />
      <span className="gallery-shot-hint" aria-hidden="true">
        Ampliar
      </span>
      <span className="gallery-shot-caption">{shot.caption}</span>
    </button>
  )
}

function ProjectCollage({
  project,
  onOpenWalkthrough,
  onOpenShot,
}: {
  project: Project
  onOpenWalkthrough: () => void
  onOpenShot: (shot: GalleryShot, origin: PeekShot['origin']) => void
}) {
  return (
    <div className="project-collage-section">
      <div className="collage-header">
        <div className="collage-title-line">
          <span className="collage-badge" style={{ borderColor: `${project.accent}55` }}>
            <span className="collage-badge-dot" style={{ background: project.accent }} />
            SHOWROOM & GALERÍA DE CAPTURAS
          </span>
          <button
            type="button"
            className="collage-diagram-btn"
            onClick={onOpenWalkthrough}
            style={{ borderColor: `${project.accent}44`, color: project.accent }}
          >
            Walkthrough de módulos
          </button>
        </div>
        <h4 className="collage-heading">Galería & Vistas de {project.name}</h4>
        <p className="collage-subheading">
          Hacé clic en una captura para ampliarla y ver anotaciones sobre las partes clave de la pantalla.
        </p>
      </div>

      <div className="project-collage-grid">
        {project.gallery.slice(0, 6).map((shot, index) => {
          return (
            <button
              key={`${project.id}-collage-${index}`}
              type="button"
              className={`collage-tile tile-${index}`}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                onOpenShot(shot, {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                })
              }}
              title={`Explorar captura: ${shot.caption}`}
            >
              {shot.src ? (
                <img src={shot.src} alt={shot.caption} loading="lazy" />
              ) : (
                <div
                  className="collage-placeholder"
                  style={{
                    background: `linear-gradient(135deg, ${project.accent}44, ${project.accent}15)`,
                  }}
                />
              )}
              <div className="collage-tile-overlay">
                <span className="collage-tile-tag">{shot.caption}</span>
                <h5 className="collage-tile-title">{shot.stepTitle || shot.caption}</h5>
                <span className="collage-tile-hint">
                  {shot.hotspots?.length ? 'Explorar anotaciones →' : 'Ampliar captura →'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FlowchartModal({
  project,
  onClose,
  setPeek,
  isPeekActive,
}: {
  project: Project
  onClose: () => void
  setPeek: (shot: PeekShot) => void
  isPeekActive: boolean
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPeekActive) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isPeekActive])

  return createPortal(
    <div className="flow-modal-backdrop" onClick={onClose}>
      <div className="flow-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="flow-modal-header">
          <div className="flow-modal-title-group">
            <span className="flow-modal-badge" style={{ background: `${project.accent}22`, color: project.accent, borderColor: `${project.accent}55` }}>
              <span className="flow-modal-dot" style={{ background: project.accent }} />
              WALKTHROUGH · 4 MÓDULOS CLAVE
            </span>
            <h3 className="flow-modal-title">Recorrido de módulos de {project.name}</h3>
          </div>
          <button type="button" className="flow-modal-close" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="flow-modal-body">
          <div className="flowchart-track" tabIndex={0} aria-label={`Mapa conceptual y flujo de ${project.name}`}>
            {project.gallery.slice(0, 4).map((shot, shotIndex) => {
              return (
                <div key={`modal-${project.id}-${shotIndex}`} className="flow-node">
                  <div className="flow-card">
                    <div className="flow-card-head">
                      <span className="flow-dot-indicator" style={{ background: project.accent }} />
                      <div className="flow-head-titles">
                        <span className="flow-step-meta">{shot.caption}</span>
                        <h5 className="flow-step-title">{shot.stepTitle || shot.caption}</h5>
                      </div>
                    </div>

                    <GalleryFigure shot={shot} accent={project.accent} onPeek={setPeek} />

                    <div className="flow-card-body">
                      <div className="flow-action-badge">
                        <span className="flow-lightning">⚡</span>
                        <span>{shot.actionText || 'Interacción principal'}</span>
                      </div>
                      <p className="flow-description">{shot.description || shot.caption}</p>

                      {shot.tags && shot.tags.length > 0 ? (
                        <div className="flow-tags">
                          {shot.tags.map((tag) => (
                            <span key={tag} className="flow-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {shotIndex < 3 ? (
                    <div className="flow-arrow-connector" aria-hidden="true">
                      <svg className="flow-curved-svg" viewBox="0 0 44 24">
                        <path d="M 2 12 Q 22 4, 34 12" fill="none" stroke={project.accent} strokeWidth="2.2" strokeLinecap="round" />
                        <polygon points="32,7 42,12 32,17" fill={project.accent} />
                      </svg>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ProjectCard({
  project,
  index,
}: {
  project: Project
  index: number
}) {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [peek, setPeek] = useState<PeekShot | null>(null)
  const rowRef = useRef<HTMLLIElement | null>(null)
  const cover = project.gallery.find((shot) => shot.src)?.src

  const onMove = (event: MouseEvent<HTMLLIElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    event.currentTarget.style.setProperty('--mx', `${x}%`)
    event.currentTarget.style.setProperty('--my', `${y}%`)
  }

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next && rowRef.current) {
        window.setTimeout(() => {
          rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      }
      return next
    })
  }

  return (
    <li
      ref={rowRef}
      className={`project-row${open ? ' is-open' : ''}`}
      style={{ '--accent': project.accent } as CSSProperties}
      onMouseMove={onMove}
    >
      <button
        type="button"
        className="project-toggle"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <div className="project-preview">
          {cover ? (
            <img src={cover} alt="" loading="lazy" />
          ) : (
            <div className="project-preview-empty" />
          )}
          <span className="project-preview-glow" aria-hidden="true" />
        </div>

        <div className="project-copy">
          <div className="project-top">
            <span className="project-index">0{index + 1}</span>
            <h3>{project.name}</h3>
            <span className={`status status-${project.status}`}>
              {project.status === 'mvp' ? 'MVP' : 'En desarrollo'}
            </span>
          </div>
          <p>{project.blurb}</p>
          <div className="project-meta">
            <span>{project.stack}</span>
            <span className="project-hint">
              {open ? 'Ocultar galería' : 'Ver showroom'}
              <span className={`project-hint-arrow${open ? ' is-open' : ''}`} aria-hidden="true"> →</span>
            </span>
          </div>
        </div>
      </button>

      <div className={`project-detail-wrapper${open ? ' is-expanded' : ''}`}>
        <div className="project-detail-inner">
          <div className="project-detail">
            <ProjectCollage
              project={project}
              onOpenWalkthrough={() => setModalOpen(true)}
              onOpenShot={(shot, origin) => {
                if (!shot.src) return
                setPeek({
                  src: shot.src,
                  caption: shot.caption,
                  accent: project.accent,
                  hotspots: shot.hotspots,
                  origin,
                })
              }}
            />

            <div className="project-actions">
              <a className="action-link action-link-btn" href={project.repoUrl} target="_blank" rel="noreferrer">
                <span>Código en GitHub</span>
                <span aria-hidden="true">↗</span>
              </a>
              {project.liveUrl ? (
                <a className="action-link action-link-btn primary" href={project.liveUrl} target="_blank" rel="noreferrer">
                  <span>Probar demo en vivo</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <FlowchartModal
          project={project}
          onClose={() => setModalOpen(false)}
          setPeek={setPeek}
          isPeekActive={!!peek}
        />
      ) : null}

      {peek ? <ShotPeek shot={peek} onClose={() => setPeek(null)} /> : null}
    </li>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'light' : getInitialTheme(),
  )
  const projectsRef = useReveal<HTMLElement>()
  const teamRef = useReveal<HTMLElement>()
  const statsRef = useReveal<HTMLElement>()
  const craftRef = useReveal<HTMLElement>()
  const ctaRef = useReveal<HTMLElement>()
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('er-labs-theme', theme)
  }, [theme])

  useEffect(() => {
    const page = pageRef.current
    if (!page) return

    const onMove = (event: globalThis.MouseEvent) => {
      page.style.setProperty('--spot-x', `${event.clientX}px`)
      page.style.setProperty('--spot-y', `${event.clientY}px`)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="page" ref={pageRef}>
      <div className="atmosphere" aria-hidden="true" />
      <div className="mesh-a" aria-hidden="true" />
      <div className="mesh-b" aria-hidden="true" />
      <div className="grid-noise" aria-hidden="true" />
      <div className="cursor-spot" aria-hidden="true" />

      <header className="nav">
        <a className="nav-brand" href="#top">
          <span className="nav-mark">ER</span>
          Labs
        </a>
        <div className="nav-right">
          <nav className="nav-links" aria-label="Principal">
            <a href="#proyectos">Proyectos</a>
            <a href="#equipo">Equipo</a>
          </nav>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Cambiar a modo claro'
                : 'Cambiar a modo oscuro'
            }
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb" />
            </span>
            <span className="theme-toggle-label">
              {theme === 'dark' ? 'Oscuro' : 'Claro'}
            </span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Laboratorio de producto</p>
            <p className="brand-mark">
              <span>ER Labs</span>
            </p>
            <h1>Software que ya se puede usar, no demos eternas.</h1>
            <p className="hero-lead">
              Construimos MVPs vivos con Ramiro y Emiliano: precisión de
              producto, iteración constante y detalle de front que se nota.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#proyectos">
                <span>Ver proyectos</span>
              </a>
              <a className="btn btn-ghost" href="#equipo">
                El equipo
              </a>
            </div>
            <div className="hero-meta">
              <span className="meta-chip">
                <i className="meta-dot is-live" />
                {projects.filter((p) => p.status === 'desarrollo').length} en desarrollo
              </span>
              <span className="meta-chip">
                <i className="meta-dot is-mvp" />
                {projects.filter((p) => p.status === 'mvp').length} MVP vivos
              </span>
              <span className="meta-chip">2 builders · ER Labs</span>
            </div>
          </div>

          <div className="hero-stage" aria-hidden="true">
            <div className="stage-glow" />
            <div className="stage-ring" />

            <article className="stage-panel stage-panel-a">
              <header className="panel-chrome">
                <span className="panel-dots" />
                <span className="panel-label">Vehio</span>
              </header>
              <div className="panel-shot">
                <img
                  src="/projects/vehio/03-catalogo.png"
                  alt=""
                  loading="eager"
                />
              </div>
            </article>

            <article className="stage-panel stage-panel-b">
              <header className="panel-chrome">
                <span className="panel-dots" />
                <span className="panel-label">FincOS</span>
              </header>
              <div className="panel-shot">
                <img
                  src="/projects/fincos/01-dashboard.png"
                  alt=""
                  loading="eager"
                />
              </div>
            </article>

            <article className="stage-panel stage-panel-c">
              <header className="panel-chrome">
                <span className="panel-dots" />
                <span className="panel-label">Containers</span>
              </header>
              <div className="panel-shot">
                <img
                  src="/projects/containers/02-mapa.png"
                  alt=""
                  loading="eager"
                />
              </div>
            </article>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...projects, ...projects].map((project, index) => (
              <span key={`${project.id}-${index}`} className="marquee-item">
                <i style={{ background: project.accent }} />
                {project.name}
                <em>{project.status === 'mvp' ? 'MVP' : 'DEV'}</em>
              </span>
            ))}
          </div>
        </div>

        <section className="stats reveal" ref={statsRef}>
          <article className="stat-card">
            <strong>{projects.length}</strong>
            <span>Productos en el lab</span>
          </article>
          <article className="stat-card">
            <strong>{projects.filter((p) => p.liveUrl).length}</strong>
            <span>Demos en vivo</span>
          </article>
          <article className="stat-card">
            <strong>2</strong>
            <span>Builders full-stack</span>
          </article>
          <article className="stat-card">
            <strong>MVP+</strong>
            <span>Ship temprano, iterar fuerte</span>
          </article>
        </section>

        <section
          className="projects reveal"
          id="proyectos"
          ref={projectsRef}
        >
          <div className="section-head">
            <p className="eyebrow">Selected work</p>
            <h2>Proyectos</h2>
            <p>
              Cada producto con galería, descripción y acceso al código o demo.
            </p>
          </div>

          <ul className="project-list">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </ul>
        </section>

        <section className="craft reveal" ref={craftRef}>
          <div className="section-head">
            <p className="eyebrow">Cómo laburamos</p>
            <h2>Craft de producto</h2>
            <p>Pocas reglas, bien aplicadas. Eso se siente en la UI.</p>
          </div>
          <div className="craft-grid">
            <article className="craft-card">
              <span className="craft-num">01</span>
              <h3>MVP usable</h3>
              <p>
                Primero que camine. Después pulimos. Cada repo ya tiene algo
                que se puede mostrar o probar.
              </p>
            </article>
            <article className="craft-card">
              <span className="craft-num">02</span>
              <h3>Detalle de front</h3>
              <p>
                Tipografía, estados, motion y contraste. Lo que hace que un
                producto se sienta caro sin gritar.
              </p>
            </article>
            <article className="craft-card">
              <span className="craft-num">03</span>
              <h3>Iteración real</h3>
              <p>
                Feedback, demos y commits. Construimos en pareja y empujamos
                el mismo estándar de calidad.
              </p>
            </article>
          </div>
        </section>

        <section
          className="team reveal"
          id="equipo"
          ref={teamRef}
        >
          <div className="section-head">
            <p className="eyebrow">People</p>
            <h2>Equipo</h2>
            <p>Dos desarrolladores. Una misma barra de calidad.</p>
          </div>
          <div className="team-grid">
            {team.map((member, index) => (
              <a
                key={member.handle}
                className="team-member"
                href={member.url}
                target="_blank"
                rel="noreferrer"
                style={{ '--delay': `${index * 90}ms` } as CSSProperties}
              >
                <span className="team-index" aria-hidden="true">
                  0{index + 1}
                </span>
                <span className="team-name">{member.name}</span>
                <span className="team-handle">@{member.handle}</span>
                <span className="team-role">{member.role}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="cta-band reveal" ref={ctaRef}>
          <div>
            <p className="eyebrow">Siguiente paso</p>
            <h2>¿Querés ver código o hablar de un build?</h2>
            <p>
              Todo lo que mostramos vive en repos reales. El lab sigue
              sumando producto.
            </p>
          </div>
          <div className="cta-actions">
            <a
              className="btn btn-primary"
              href="https://github.com/RRamiS/ER-Labs"
              target="_blank"
              rel="noreferrer"
            >
              Repo de esta web
            </a>
            <a className="btn btn-ghost" href="#proyectos">
              Volver a proyectos
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <p className="footer-brand">ER Labs</p>
          <p>Software en construcción, con intención de durar.</p>
          <div className="footer-links">
            <a href="https://github.com/RRamiS" target="_blank" rel="noreferrer">
              Ramiro
            </a>
            <a
              href="https://github.com/EmilianoArias021"
              target="_blank"
              rel="noreferrer"
            >
              Emiliano
            </a>
            <a href="#proyectos">Proyectos</a>
          </div>
        </div>
        <p className="footer-meta">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
