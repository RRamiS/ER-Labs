import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  projects,
  team,
  type GalleryShot,
  type Project,
  type ShotHotspot,
} from './data/projects'
import { readSearchQuery, writeSearchQuery } from './search/engine'
import { SearchOverlay, SearchResults } from './search/SiteSearch'
import './App.css'

type Theme = 'light' | 'dark'

type PeekShot = {
  src: string
  caption: string
  accent: string
  hotspots?: ShotHotspot[]
  layoutId?: string
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

let scrollLockCount = 0;
let originalNavPadding = '';

function lockScroll() {
  if (scrollLockCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      const nav = document.querySelector('.nav') as HTMLElement;
      if (nav) {
        originalNavPadding = nav.style.paddingRight;
        nav.style.paddingRight = `calc(6vw + ${scrollbarWidth}px)`;
      }
    }
  }
  scrollLockCount++;
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    const nav = document.querySelector('.nav') as HTMLElement;
    if (nav) nav.style.paddingRight = originalNavPadding;
  }
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
  const maxW = annotated ? Math.min(1000, window.innerWidth * 0.52) : Math.min(880, window.innerWidth * 0.86)
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
  hotspots.forEach((hotspot) => {
    if (hotspot.side === 'left') {
      left.push(hotspot)
    } else if (hotspot.side === 'right') {
      right.push(hotspot)
    } else if (hotspot.x < 50) {
      left.push(hotspot)
    } else {
      right.push(hotspot)
    }
  })
  return { left, right }
}

type ConnectorLine = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  side: 'left' | 'right'
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
          className="shot-hotspot-box"
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
          <span className="shot-hotspot-corner is-tl" />
          <span className="shot-hotspot-corner is-tr" />
          <span className="shot-hotspot-corner is-bl" />
          <span className="shot-hotspot-corner is-br" />
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
      data-side={hotspot.side === 'left' || hotspot.side === 'right' ? hotspot.side : hotspot.x < 50 ? 'left' : 'right'}
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

function getHotspotSide(
  hotspot: ShotHotspot,
  groups: { left: ShotHotspot[]; right: ShotHotspot[] },
): 'left' | 'right' {
  if (groups.left.some((item) => item.id === hotspot.id)) return 'left'
  if (groups.right.some((item) => item.id === hotspot.id)) return 'right'
  if (hotspot.side === 'left') return 'left'
  if (hotspot.side === 'right') return 'right'
  return hotspot.x < 50 ? 'left' : 'right'
}

function ShotPeek({
  shot,
  onClose,
}: {
  shot: PeekShot
  onClose: () => void
}) {
  const annotated = (shot.hotspots?.length ?? 0) > 0
  const [connectors, setConnectors] = useState<ConnectorLine[]>([])
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })
  const [connectorsReady, setConnectorsReady] = useState(false)
  const final = useRef(getPeekGeometry(shot.origin, { annotated }))
  const layoutRef = useRef<HTMLDivElement | null>(null)
  const mediaRef = useRef<HTMLDivElement | null>(null)
  const boxRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  const noteRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  const markerId = `annotate-arrow-head-${shot.layoutId ?? shot.src.replace(/\W+/g, '-')}`

  const groups = annotated && shot.hotspots ? groupHotspots(shot.hotspots) : null
  const hotspotIndex = new Map(
    (shot.hotspots ?? []).map((hotspot, index) => [hotspot.id, index + 1]),
  )

  useEffect(() => {
    final.current = getPeekGeometry(shot.origin, { annotated })
    setConnectorsReady(false)
  }, [shot, annotated])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    lockScroll()
    window.addEventListener('keydown', onKey, true)
    return () => {
      unlockScroll()
      window.removeEventListener('keydown', onKey, true)
    }
  }, [onClose])

  useEffect(() => {
    if (!annotated || !shot.hotspots?.length) {
      setConnectors([])
      setConnectorsReady(false)
      return
    }

    const grouped = groupHotspots(shot.hotspots)
    const expected = shot.hotspots.length
    let alive = true
    let frame = 0

    const updateConnectors = () => {
      if (!alive) return
      const layout = layoutRef.current
      if (!layout) return
      const layoutRect = layout.getBoundingClientRect()
      if (layoutRect.width < 1 || layoutRect.height < 1) return

      setSvgSize({ width: layoutRect.width, height: layoutRect.height })

      const next: ConnectorLine[] = []
      for (const hotspot of shot.hotspots!) {
        const box = boxRefs.current.get(hotspot.id)
        const note = noteRefs.current.get(hotspot.id)
        if (!box || !note) continue

        const side = getHotspotSide(hotspot, grouped)
        const boxRect = box.getBoundingClientRect()
        const noteRect = note.getBoundingClientRect()
        const indexEl = box.querySelector('.shot-hotspot-index')
        const originRect = indexEl?.getBoundingClientRect() ?? boxRect

        // Salida desde el pin central (más limpio con esquinas suaves).
        const x1 = originRect.left + originRect.width / 2 - layoutRect.left
        const y1 = originRect.top + originRect.height / 2 - layoutRect.top

        // Llegada: borde de la nota que mira la imagen.
        const y2 = noteRect.top + noteRect.height / 2 - layoutRect.top
        const x2 =
          side === 'left'
            ? noteRect.right - layoutRect.left
            : noteRect.left - layoutRect.left

        if (
          !Number.isFinite(x1) ||
          !Number.isFinite(y1) ||
          !Number.isFinite(x2) ||
          !Number.isFinite(y2)
        ) {
          continue
        }

        next.push({ id: hotspot.id, x1, y1, x2, y2, side })
      }
      setConnectors(next)
      if (next.length === expected) setConnectorsReady(true)
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        requestAnimationFrame(updateConnectors)
      })
    }

    schedule()
    window.addEventListener('resize', schedule)

    const layout = layoutRef.current
    const media = mediaRef.current
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => schedule())
        : null
    if (layout) resizeObserver?.observe(layout)
    if (media) resizeObserver?.observe(media)

    const settleTimers = [80, 180, 320, 520, 800, 1100].map((ms) =>
      window.setTimeout(schedule, ms),
    )

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      resizeObserver?.disconnect()
      settleTimers.forEach((id) => window.clearTimeout(id))
    }
  }, [annotated, shot])

  const requestClose = () => onClose()

  const connectorPath = (line: ConnectorLine) => {
    const dx = Math.max(36, Math.abs(line.x2 - line.x1) * 0.45)
    const c1x = line.side === 'left' ? line.x1 - dx : line.x1 + dx
    const c2x = line.side === 'left' ? line.x2 + dx : line.x2 - dx
    return `M ${line.x1} ${line.y1} C ${c1x} ${line.y1}, ${c2x} ${line.y2}, ${line.x2} ${line.y2}`
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className={`shot-peek is-open${annotated ? ' is-annotated' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={shot.caption}
      onClick={requestClose}
      ref={layoutRef}
    >
      {annotated && connectorsReady && svgSize.width > 0 && connectors.length > 0 ? (
        <svg
          className="shot-annotate-connector is-ready"
          width={svgSize.width}
          height={svgSize.height}
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill={shot.accent} />
            </marker>
          </defs>
          {connectors.map((line) => (
            <path
              key={line.id}
              d={connectorPath(line)}
              fill="none"
              stroke={shot.accent}
              strokeWidth="2"
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
              opacity="0.92"
            />
          ))}
        </svg>
      ) : null}

      {annotated && groups ? (
        <div className="shot-annotate-side side-left" onClick={(event) => event.stopPropagation()}>
          {groups.left.map((hotspot) => (
            <AnnotateNote
              key={hotspot.id}
              hotspot={hotspot}
              index={hotspotIndex.get(hotspot.id) ?? 0}
              accent={shot.accent}
              noteRefs={noteRefs}
            />
          ))}
        </div>
      ) : null}

      <motion.figure
        layoutId={shot.layoutId}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        className={`shot-peek-frame is-open${annotated ? ' is-annotated' : ''}`}
        style={
          {
            '--accent': shot.accent,
            width: final.current.width,
            zIndex: 10001,
          } as CSSProperties
        }
        onClick={(event) => event.stopPropagation()}
        onLayoutAnimationComplete={() => {
          window.dispatchEvent(new Event('resize'))
        }}
      >
        <div className="shot-peek-media" ref={mediaRef}>
          <div className="shot-peek-media-inner">
            <img
              src={shot.src}
              alt={shot.caption}
              onLoad={() => {
                window.dispatchEvent(new Event('resize'))
              }}
            />
            {annotated && shot.hotspots ? (
              <HotspotBoxes
                hotspots={shot.hotspots}
                accent={shot.accent}
                boxRefs={boxRefs}
              />
            ) : null}
          </div>
        </div>
      </motion.figure>

      {annotated && groups ? (
        <div className="shot-annotate-side side-right" onClick={(event) => event.stopPropagation()}>
          {groups.right.map((hotspot) => (
            <AnnotateNote
              key={hotspot.id}
              hotspot={hotspot}
              index={hotspotIndex.get(hotspot.id) ?? 0}
              accent={shot.accent}
              noteRefs={noteRefs}
            />
          ))}
        </div>
      ) : null}
    </motion.div>,
    document.body,
  )
}

function GalleryFigure({
  shot,
  accent,
  onPeek,
  layoutId,
}: {
  shot: GalleryShot
  accent: string
  onPeek: (shot: PeekShot) => void
  layoutId?: string
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
      layoutId,
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
    <motion.button
      ref={buttonRef as any}
      type="button"
      layoutId={layoutId}
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
    </motion.button>
  )
}

function ProjectCollage({
  project,
  playing,
  onOpenWalkthrough,
  onOpenShot,
}: {
  project: Project
  playing: boolean
  onOpenWalkthrough: () => void
  onOpenShot: (shot: GalleryShot, origin: PeekShot['origin'], layoutId: string) => void
}) {
  const slides = project.gallery
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [cleared, setCleared] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const active = slides[index]

  useLayoutEffect(() => {
    setCleared(false)
  }, [playing, index])

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setCleared(true), 2800)
    return () => window.clearTimeout(timer)
  }, [playing, index])

  const go = (delta: number) => {
    if (count < 2) return
    setIndex((current) => (current + delta + count) % count)
  }

  const openActive = () => {
    if (!active?.src || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    onOpenShot(
      active,
      { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      `collage-${project.id}-${index}`,
    )
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    }
  }

  return (
    <div className="project-collage-section">
      <section
        className={`module-carousel${cleared ? ' is-clear' : ''}`}
        aria-roledescription="carrusel"
        aria-label={`Módulos de ${project.name}`}
        onKeyDown={onKeyDown}
      >
        <div className="module-carousel-stage" ref={stageRef}>
          {slides.map((shot, slideIndex) => {
            const selected = slideIndex === index
            return (
              <div
                key={`${project.id}-${slideIndex}`}
                className={`module-slide${selected ? ' is-active' : ''}`}
                aria-hidden={!selected}
                onClick={(event) => {
                  if (!selected) return
                  if ((event.target as HTMLElement).closest('button')) return
                  openActive()
                }}
              >
                {shot.src ? (
                  <img src={shot.src} alt="" />
                ) : (
                  <span
                    className="module-slide-fallback"
                    style={{
                      background: `linear-gradient(135deg, ${project.accent}66, ${project.accent}22)`,
                    }}
                  />
                )}
                <div className="module-slide-copy">
                  <span className="module-slide-kicker">{shot.caption}</span>
                  <strong>{shot.stepTitle || shot.caption}</strong>
                  <span className="module-slide-text">{shot.description || shot.actionText}</span>
                  <div className="module-slide-options">
                    <button
                      type="button"
                      className="module-slide-cta"
                      tabIndex={selected ? 0 : -1}
                      onClick={openActive}
                    >
                      {shot.hotspots?.length ? 'Explorar' : 'Ampliar'}
                    </button>
                    <button
                      type="button"
                      className="module-slide-cta"
                      tabIndex={selected ? 0 : -1}
                      onClick={onOpenWalkthrough}
                    >
                      Walkthrough
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {count > 1 ? (
            <>
              <button
                type="button"
                className="module-carousel-nav is-prev"
                aria-label="Anterior"
                onClick={() => go(-1)}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className="module-carousel-nav is-next"
                aria-label="Siguiente"
                onClick={() => go(1)}
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          ) : null}

          {count > 1 ? (
            <div className="module-carousel-dots" role="tablist" aria-label="Módulos">
              {slides.map((shot, slideIndex) => (
                <button
                  key={`${project.id}-dot-${slideIndex}`}
                  type="button"
                  role="tab"
                  aria-selected={slideIndex === index}
                  aria-label={`${slideIndex + 1}. ${shot.stepTitle || shot.caption}`}
                  className={slideIndex === index ? 'is-active' : undefined}
                  onClick={() => setIndex(slideIndex)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
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
    lockScroll()
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      unlockScroll()
      window.removeEventListener('keydown', handleKeyDown)
    }
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

                    <GalleryFigure shot={shot} accent={project.accent} onPeek={setPeek} layoutId={`modal-${project.id}-${shotIndex}`} />

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
      if (next) {
        window.setTimeout(() => {
          rowRef.current?.querySelector('.module-carousel-stage')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }, 60)
      }
      return next
    })
  }

  return (
    <li
      id={`proyecto-${project.id}`}
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
            {project.stack.split('·').map(lang => (
              <span key={lang.trim()} className="stack-chip">
                {lang.trim()}
              </span>
            ))}
          </div>
          <p>{project.blurb}</p>
          <div className="project-case-strip">
            <div className="case-item">
              <span className="case-label">Problema</span>
              <span className="case-val">{project.caseStudy.problem}</span>
            </div>
            <div className="case-item">
              <span className="case-label">Arquitectura</span>
              <span className="case-val">{project.caseStudy.architecture}</span>
            </div>
            <div className="case-item">
              <span className="case-label">Impacto</span>
              <span className="case-val">{project.caseStudy.outcome}</span>
            </div>
          </div>
          <div className="project-meta">
            <span className="project-hint">
              {open ? 'Ocultar galería' : 'Ver showroom'}
              <span className={`project-hint-arrow${open ? ' is-open' : ''}`} aria-hidden="true"> →</span>
            </span>
          </div>
        </div>
      </button>

      <div
        className={`project-detail-wrapper${open ? ' is-expanded' : ''}`}
        inert={open ? undefined : true}
      >
        <div className="project-detail-inner">
          <div className="project-detail">
            <ProjectCollage
              project={project}
              playing={open}
              onOpenWalkthrough={() => setModalOpen(true)}
              onOpenShot={(shot, origin, layoutId) => {
                if (!shot.src) return
                setPeek({
                  src: shot.src,
                  caption: shot.caption,
                  accent: project.accent,
                  hotspots: shot.hotspots,
                  layoutId,
                  origin,
                })
              }}
            />

            <div className="project-actions">
              {project.liveUrl ? (
                <a className="action-link action-link-btn primary" href={project.liveUrl} target="_blank" rel="noreferrer">
                  <span>Demo</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              <a className="action-link action-link-btn" href={project.repoUrl} target="_blank" rel="noreferrer">
                <span>GitHub</span>
                <span aria-hidden="true">↗</span>
              </a>
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

      <AnimatePresence>
        {peek ? <ShotPeek shot={peek} onClose={() => setPeek(null)} /> : null}
      </AnimatePresence>
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
  const pendingProject = useRef<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(() =>
    typeof window === 'undefined' ? '' : readSearchQuery(),
  )

  const commitSearch = (next: string) => {
    setSearchQuery(writeSearchQuery(next))
  }

  const openProjectFromSearch = (projectId: string) => {
    pendingProject.current = projectId
    commitSearch('')
  }

  const followSearchHash = (hash: string) => {
    pendingProject.current = null
    commitSearch('')
    window.setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('er-labs-theme', theme)
  }, [theme])

  useEffect(() => {
    const onPop = () => setSearchQuery(readSearchQuery())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (searchQuery || !pendingProject.current) return
    const projectId = pendingProject.current
    pendingProject.current = null
    document.getElementById(`proyecto-${projectId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [searchQuery])

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="page" ref={pageRef}>
      <div className="atmosphere" aria-hidden="true" />
      <div className="mesh-a" aria-hidden="true" />
      <div className="mesh-b" aria-hidden="true" />
      <div className="grid-noise" aria-hidden="true" />
      <div className="cursor-spot" aria-hidden="true" />

      <header className="nav">
        <a
          className="nav-brand"
          href="#top"
          onClick={(event) => {
            if (!searchQuery) return
            event.preventDefault()
            commitSearch('')
          }}
        >
          <span className="nav-mark">ER</span>
          Sistemas
        </a>
        <div className="nav-right">
          <nav className="nav-links" aria-label="Principal">
            <a
              href="#proyectos"
              onClick={(event) => {
                if (!searchQuery) return
                event.preventDefault()
                followSearchHash('#proyectos')
              }}
            >
              Proyectos
            </a>
            <a
              href="#equipo"
              onClick={(event) => {
                if (!searchQuery) return
                event.preventDefault()
                followSearchHash('#equipo')
              }}
            >
              Equipo
            </a>
          </nav>
          <button
            type="button"
            className="nav-search"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <span>Buscar</span>
          </button>
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

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onCommit={commitSearch}
        onFollowHash={followSearchHash}
      />

      <main id="top">
        {searchQuery ? (
          <SearchResults
            query={searchQuery}
            onCommit={commitSearch}
            onOpenProject={openProjectFromSearch}
          />
        ) : (
          <>
        <section className="hero">
          <div className="hero-copy">
            <p className="brand-mark">
              <span>ER Sistemas</span>
            </p>
            <h1>Software simple y rápido. Apps, sistemas y páginas web.</h1>
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
              <span className="meta-chip">2 builders · ER Sistemas</span>
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

            <article className="stage-panel stage-panel-d">
              <header className="panel-chrome">
                <span className="panel-dots" />
                <span className="panel-label">Reflejos</span>
              </header>
              <div className="panel-shot">
                <img
                  src="/projects/reflejos/banner-reflejos.png"
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
            <span>Productos activos en el lab</span>
          </article>
          <article className="stat-card">
            <strong>100%</strong>
            <span>Offline‑first & Local‑first</span>
          </article>
          <article className="stat-card">
            <strong>$0/mes</strong>
            <span>Servidor local en PC propia (FincOS)</span>
          </article>
          <article className="stat-card">
            <strong>2</strong>
            <span>Builders full‑stack · Ship constante</span>
          </article>
        </section>

        <section className="workbench reveal">
          <div className="section-head">
            <p className="eyebrow">Live Lab Status</p>
            <h2>En el banco esta semana</h2>
            <p>
              Últimas mejoras de arquitectura, modo sin conexión y experiencia
              minimalista aplicadas en los productos del laboratorio.
            </p>
          </div>
          <div className="workbench-grid">
            <article className="workbench-card" style={{ '--accent': '#3D8B4F' } as CSSProperties}>
              <div className="workbench-top">
                <span className="workbench-tag">FincOS · Prioridad Campo</span>
                <span className="workbench-pill">Offline + Servidor PC</span>
              </div>
              <h3>Operación 100% sin señal y Servidor Local en PC ($0 Cloud)</h3>
              <p>
                Caché íntegra en el dispositivo + cola Outbox optimista para
                ventas, cosechas, cobranzas y bitácora. Al detectar el Wi‑Fi de
                la finca, sincroniza directo contra el PostgreSQL de la PC local
                sin pagar servidores externos.
              </p>
              <a className="workbench-link" href="#proyecto-fincos">
                Ver FincOS en el lab →
              </a>
            </article>

            <article className="workbench-card" style={{ '--accent': '#1F6BFF' } as CSSProperties}>
              <div className="workbench-top">
                <span className="workbench-tag">Vehio · Marketplace AR</span>
                <span className="workbench-pill">Transparencia 3‑en‑1</span>
              </div>
              <h3>Ficha de Confianza Unificada: Puesto en calle, Cuotas y DNRPA</h3>
              <p>
                Desglose real con transferencia estimada (~4.5%) e informe 13i,
                calculadora de cuotas interactiva y checklist mecánico de 8
                puntos con agendado directo por WhatsApp.
              </p>
              <a className="workbench-link" href="#proyecto-vehio">
                Ver Vehio en el lab →
              </a>
            </article>

            <article className="workbench-card" style={{ '--accent': '#8B5E3C' } as CSSProperties}>
              <div className="workbench-top">
                <span className="workbench-tag">Mueblería · Showroom v2</span>
                <span className="workbench-pill">Estudio a Medida</span>
              </div>
              <h3>Configurador al centímetro con plano de escala y cotización</h3>
              <p>
                Ajuste interactivo de largo, profundidad y ancho de ambiente con
                cálculo de paso libre lateral, elección de madera maciza
                (Petiribí, Paraíso, Roble) y presupuesto en vivo.
              </p>
              <a className="workbench-link" href="#proyecto-muebleria">
                Ver Mueblería en el lab →
              </a>
            </article>
          </div>
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
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-brand">ER Sistemas</p>
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
            <a
              href="#proyectos"
              onClick={(event) => {
                if (!searchQuery) return
                event.preventDefault()
                followSearchHash('#proyectos')
              }}
            >
              Proyectos
            </a>
          </div>
        </div>
        <p className="footer-meta">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
