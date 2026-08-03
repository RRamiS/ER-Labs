import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type TransitionEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { projects, team, type GalleryShot, type Project } from './data/projects'
import './App.css'

type Theme = 'light' | 'dark'

type PeekShot = {
  src: string
  caption: string
  accent: string
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

function getPeekGeometry(origin: PeekShot['origin']) {
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

function ShotPeek({
  shot,
  onClose,
}: {
  shot: PeekShot
  onClose: () => void
}) {
  const [phase, setPhase] = useState<'enter' | 'open' | 'exit'>('enter')
  const final = useRef(getPeekGeometry(shot.origin))
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    final.current = getPeekGeometry(shot.origin)
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setPhase('open'))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [shot])

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
      className={`shot-peek${expanded ? ' is-open' : ''}${phase === 'exit' ? ' is-exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={shot.caption}
      onClick={requestClose}
    >
      <figure
        className={`shot-peek-frame${expanded ? ' is-open' : ''}`}
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
        <img src={shot.src} alt={shot.caption} />
        <figcaption>{shot.caption}</figcaption>
        <button type="button" className="shot-peek-close" onClick={requestClose}>
          Cerrar
        </button>
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
  onOpenModal,
}: {
  project: Project
  onOpenModal: () => void
}) {
  return (
    <div className="project-collage-section">
      <div className="collage-header">
        <div className="collage-title-line">
          <span className="collage-badge" style={{ borderColor: `${project.accent}55` }}>
            <span className="collage-badge-dot" style={{ background: project.accent }} />
            SHOWROOM & GALERÍA DE CAPTURAS
          </span>
        </div>
        <h4 className="collage-heading">Galería & Vistas de {project.name}</h4>
        <p className="collage-subheading">
          Haz clic en cualquier captura para desplegar el mapa mental interactivo con diagramas de flujo completos.
        </p>
      </div>

      <div className="project-collage-grid">
        {project.gallery.slice(0, 6).map((shot, index) => {
          return (
            <button
              key={`${project.id}-collage-${index}`}
              type="button"
              className={`collage-tile tile-${index}`}
              onClick={onOpenModal}
              title={`Ver diagrama de flujo para ${shot.caption}`}
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
                <span className="collage-tile-hint">Ver flujo interactivo →</span>
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
              DIAGRAMA DE INTERACCIÓN (4 MÓDULOS CLAVE)
            </span>
            <h3 className="flow-modal-title">Flujo de experiencia de {project.name}</h3>
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
              {open ? 'Ocultar galería' : 'Ver showroom & flujo'}
              <span className={`project-hint-arrow${open ? ' is-open' : ''}`} aria-hidden="true"> →</span>
            </span>
          </div>
        </div>
      </button>

      <div className={`project-detail-wrapper${open ? ' is-expanded' : ''}`}>
        <div className="project-detail-inner">
          <div className="project-detail">
            <ProjectCollage project={project} onOpenModal={() => setModalOpen(true)} />

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
              <div className="panel-shot panel-shot-fincos">
                <div className="fincos-mock">
                  <span className="fincos-chip">Parcelas</span>
                  <div className="fincos-rows">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="fincos-tiles">
                    <b />
                    <b />
                    <b />
                    <b />
                  </div>
                </div>
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
