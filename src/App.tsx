import { useEffect, useState, type CSSProperties } from 'react'
import { projects, team, type Project } from './data/projects'
import './App.css'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('er-labs-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const cover = project.gallery.find((shot) => shot.src)?.src

  return (
    <li className={`project-row${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="project-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="project-preview" style={{ '--accent': project.accent } as CSSProperties}>
          {cover ? (
            <img src={cover} alt="" loading="lazy" />
          ) : (
            <div className="project-preview-empty" />
          )}
        </div>

        <div className="project-copy">
          <div className="project-top">
            <h3>{project.name}</h3>
            <span className={`status status-${project.status}`}>
              {project.status === 'mvp' ? 'MVP' : 'En desarrollo'}
            </span>
          </div>
          <p>{project.blurb}</p>
          <div className="project-meta">
            <span>{project.stack}</span>
            <span className="project-hint">
              {open ? 'Cerrar' : 'Abrir galería'}
              <span aria-hidden="true"> →</span>
            </span>
          </div>
        </div>
      </button>

      {open ? (
        <div className="project-detail">
          <div className="gallery" tabIndex={0} aria-label={`Galería de ${project.name}`}>
            {project.gallery.map((shot, index) => (
              <figure
                key={`${project.id}-${index}`}
                className={`gallery-shot${shot.src ? '' : ' is-placeholder'}`}
                style={
                  shot.src
                    ? undefined
                    : {
                        background: `linear-gradient(145deg, ${project.accent}44, ${project.accent}12)`,
                      }
                }
              >
                {shot.src ? (
                  <img src={shot.src} alt={shot.caption} loading="lazy" />
                ) : (
                  <span className="gallery-placeholder-label">
                    Captura pendiente
                  </span>
                )}
                <figcaption>{shot.caption}</figcaption>
              </figure>
            ))}
          </div>

          <div className="project-actions">
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              Repositorio
            </a>
            {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                Ver en vivo
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'light' : getInitialTheme(),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('er-labs-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true" />
      <div className="grid-noise" aria-hidden="true" />

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
            <p className="brand-mark">ER Labs</p>
            <h1>Software que ya se puede usar, no demos eternas.</h1>
            <p className="hero-lead">
              Construimos MVPs vivos con Ramiro y Emiliano: precisión de
              producto, iteración constante y detalle de front que se nota.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#proyectos">
                Ver proyectos
              </a>
              <a className="btn btn-ghost" href="#equipo">
                El equipo
              </a>
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

        <section className="projects" id="proyectos">
          <div className="section-head">
            <p className="eyebrow">Selected work</p>
            <h2>Proyectos</h2>
            <p>
              Cada producto con galería, descripción y acceso al código o demo.
            </p>
          </div>

          <ul className="project-list">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ul>
        </section>

        <section className="team" id="equipo">
          <div className="section-head">
            <p className="eyebrow">People</p>
            <h2>Equipo</h2>
            <p>Dos desarrolladores. Una misma barra de calidad.</p>
          </div>
          <div className="team-grid">
            {team.map((member) => (
              <a
                key={member.handle}
                className="team-member"
                href={member.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="team-index" aria-hidden="true">
                  0{team.indexOf(member) + 1}
                </span>
                <span className="team-name">{member.name}</span>
                <span className="team-handle">@{member.handle}</span>
                <span className="team-role">{member.role}</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <p className="footer-brand">ER Labs</p>
          <p>Software en construcción, con intención de durar.</p>
        </div>
        <p className="footer-meta">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
