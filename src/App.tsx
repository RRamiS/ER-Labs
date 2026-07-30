import { useState } from 'react'
import { projects, team, type Project } from './data/projects'
import './App.css'

function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)

  return (
    <li className={`project-row${open ? ' is-open' : ''}`}>
      <div
        className="project-accent"
        style={{ background: project.accent }}
        aria-hidden="true"
      />
      <div className="project-body">
        <button
          type="button"
          className="project-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <div className="project-top">
            <h3>{project.name}</h3>
            <span className={`status status-${project.status}`}>
              {project.status === 'mvp' ? 'MVP' : 'En desarrollo'}
            </span>
          </div>
          <p>{project.blurb}</p>
          <div className="project-meta">
            <span>{project.stack}</span>
            <span>{project.owner}</span>
            <span className="project-hint">
              {open ? 'Ocultar galería' : 'Ver galería'}
            </span>
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
                          background: `linear-gradient(145deg, ${project.accent}33, ${project.accent}10)`,
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
      </div>
    </li>
  )
}

function App() {
  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true" />

      <header className="nav">
        <a className="nav-brand" href="#top">
          ER Labs
        </a>
        <nav className="nav-links" aria-label="Principal">
          <a href="#proyectos">Proyectos</a>
          <a href="#equipo">Equipo</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="brand-mark">ER Labs</p>
            <h1>Construimos software que ya se puede usar.</h1>
            <p className="hero-lead">
              Laboratorio de producto de Ramiro y Emiliano. MVPs vivos,
              iteración constante y código que sale a la calle.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#proyectos">
                Ver proyectos
              </a>
              <a className="btn btn-ghost" href="#equipo">
                Conocer el equipo
              </a>
            </div>
          </div>

          <div className="hero-stage" aria-hidden="true">
            <div className="stage-glow" />
            <div className="stage-panel stage-panel-a">
              <span className="panel-label">Vehio</span>
              <div className="panel-lines">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="stage-panel stage-panel-b">
              <span className="panel-label">FincOS</span>
              <div className="panel-grid">
                <b />
                <b />
                <b />
                <b />
              </div>
            </div>
            <div className="stage-panel stage-panel-c">
              <span className="panel-label">Containers</span>
              <div className="panel-bars">
                <s />
                <s />
                <s />
              </div>
            </div>
          </div>
        </section>

        <section className="projects" id="proyectos">
          <div className="section-head">
            <h2>Proyectos</h2>
            <p>
              Cada uno con descripción, links y una galería scrolleable de
              capturas. Van a sumar fotos reales de las apps.
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
            <h2>Equipo</h2>
            <p>Dos desarrolladores, un mismo laboratorio.</p>
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
                <span className="team-name">{member.name}</span>
                <span className="team-handle">@{member.handle}</span>
                <span className="team-role">{member.role}</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="footer-brand">ER Labs</p>
        <p>Software en construcción, con intención de durar.</p>
      </footer>
    </div>
  )
}

export default App
