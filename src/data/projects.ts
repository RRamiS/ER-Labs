export type ProjectStatus = 'mvp' | 'desarrollo'

export type GalleryShot = {
  src?: string
  caption: string
}

export type Project = {
  id: string
  name: string
  blurb: string
  status: ProjectStatus
  stack: string
  repoUrl: string
  liveUrl?: string
  accent: string
  gallery: GalleryShot[]
}

export const projects: Project[] = [
  {
    id: 'vehio',
    name: 'Vehio',
    blurb:
      'Marketplace de autos usados en Argentina. Flujo de publicación, búsqueda y contacto pensado para el mercado local.',
    status: 'mvp',
    stack: 'TypeScript',
    repoUrl: 'https://github.com/RRamiS/vehio',
    liveUrl: 'https://vehio.me/',
    accent: '#1F6BFF',
    gallery: [
      { src: '/projects/vehio/01-inicio.png', caption: 'Inicio' },
      { src: '/projects/vehio/02-beneficios.png', caption: 'Beneficios' },
      { src: '/projects/vehio/03-catalogo.png', caption: 'Catálogo' },
      { src: '/projects/vehio/04-detalle.png', caption: 'Detalle' },
    ],
  },
  {
    id: 'reflejos',
    name: 'Reflejos del Lago',
    blurb:
      'Sitio web desplegado para un emprendimiento local. Identidad visual, presencia online y experiencia lista para visitantes.',
    status: 'mvp',
    stack: 'HTML',
    repoUrl: 'https://github.com/RRamiS/Reflejos_Del_Lago_Vercel',
    liveUrl: 'https://reflejos-del-lago-vercel.vercel.app',
    accent: '#0E8A7A',
    gallery: [
      { src: '/projects/reflejos/01-portada.png', caption: 'Portada' },
      { src: '/projects/reflejos/02-galeria.png', caption: 'Galería' },
      { src: '/projects/reflejos/03-nosotros.png', caption: 'Nosotros / contacto' },
    ],
  },
  {
    id: 'containers',
    name: 'Containers',
    blurb:
      'App multiplataforma de alquiler de activos. Un mismo producto pensado para móvil (Expo) y escritorio (Tauri).',
    status: 'desarrollo',
    stack: 'Expo · Tauri · TypeScript',
    repoUrl: 'https://github.com/RRamiS/Containers',
    accent: '#E8A317',
    gallery: [
      { src: '/projects/containers/01-alquileres.png', caption: 'Alquileres' },
      { src: '/projects/containers/02-mapa.png', caption: 'Mapa' },
      { src: '/projects/containers/03-contenedores.png', caption: 'Contenedores' },
      { src: '/projects/containers/04-choferes.png', caption: 'Choferes' },
    ],
  },
  {
    id: 'fincos',
    name: 'FincOS',
    blurb:
      'Plataforma hortícola mobile-first. Herramientas digitales para gestionar la finca desde el bolsillo.',
    status: 'desarrollo',
    stack: 'TypeScript · Mobile-first',
    repoUrl: 'https://github.com/RRamiS/FincOS',
    accent: '#3D8B4F',
    gallery: [
      { caption: 'Home mobile' },
      { caption: 'Parcelas' },
      { caption: 'Tareas' },
      { caption: 'Reportes' },
    ],
  },
  {
    id: 'lista-precios',
    name: 'Lista de precios',
    blurb:
      'Sistema para administrar y consultar listas de precios. MVP funcional en evolución continua.',
    status: 'desarrollo',
    stack: 'TypeScript',
    repoUrl: 'https://github.com/EmilianoArias021/Lista-de-precios',
    accent: '#C44D2B',
    gallery: [
      { src: '/projects/lista-precios/01-lista.png', caption: 'Catálogo' },
      { src: '/projects/lista-precios/02-detalle.png', caption: 'Nuevo producto' },
      { src: '/projects/lista-precios/03-categorias.png', caption: 'Base de datos' },
      { src: '/projects/lista-precios/04-vista.png', caption: 'Modo claro' },
    ],
  },
  {
    id: 'muebleria',
    name: 'Mueblería',
    blurb:
      'Prototipo web para mueblería. Catálogo y presencia digital listos para iterar sobre feedback real.',
    status: 'desarrollo',
    stack: 'HTML · Vercel',
    repoUrl: 'https://github.com/RRamiS/Muebleria',
    liveUrl: 'https://muebleria-brown.vercel.app',
    accent: '#8B5E3C',
    gallery: [
      { src: '/projects/muebleria/01-portada.png', caption: 'Portada' },
      { src: '/projects/muebleria/02-categorias.png', caption: 'Categorías' },
      { src: '/projects/muebleria/03-productos.png', caption: 'Catálogo' },
    ],
  },
]

export const team = [
  {
    name: 'Ramiro',
    handle: 'RRamiS',
    role: 'ER Labs',
    url: 'https://github.com/RRamiS',
  },
  {
    name: 'Emiliano Arias',
    handle: 'EmilianoArias021',
    role: 'ER Labs',
    url: 'https://github.com/EmilianoArias021',
  },
]
