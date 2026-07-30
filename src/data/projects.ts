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
  owner: 'Ramiro' | 'Emiliano' | 'ER Labs'
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
    owner: 'Ramiro',
    accent: '#1F6BFF',
    gallery: [
      { caption: 'Inicio / catálogo' },
      { caption: 'Detalle de vehículo' },
      { caption: 'Publicación' },
      { caption: 'Búsqueda y filtros' },
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
    owner: 'Ramiro',
    accent: '#0E8A7A',
    gallery: [
      { src: '/projects/reflejos/01-portada.png', caption: 'Portada' },
      { src: '/projects/reflejos/02-galeria.png', caption: 'Galería' },
      { src: '/projects/reflejos/03-nosotros.png', caption: 'Nosotros / contacto' },
      { caption: 'Alojamiento' },
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
    owner: 'ER Labs',
    accent: '#E8A317',
    gallery: [
      { caption: 'Dashboard' },
      { caption: 'Inventario' },
      { caption: 'Alquileres' },
      { caption: 'Detalle de activo' },
      { caption: 'Versión desktop' },
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
    owner: 'ER Labs',
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
    owner: 'Emiliano',
    accent: '#C44D2B',
    gallery: [
      { caption: 'Lista principal' },
      { caption: 'Edición de ítems' },
      { caption: 'Categorías' },
      { caption: 'Vista cliente' },
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
    owner: 'Ramiro',
    accent: '#8B5E3C',
    gallery: [
      { src: '/projects/muebleria/01-portada.png', caption: 'Portada' },
      { src: '/projects/muebleria/02-categorias.png', caption: 'Categorías' },
      { src: '/projects/muebleria/03-productos.png', caption: 'Catálogo' },
      { caption: 'Ficha de producto' },
    ],
  },
]

export const team = [
  {
    name: 'Ramiro',
    handle: 'RRamiS',
    role: 'Desarrollo de software',
    url: 'https://github.com/RRamiS',
  },
  {
    name: 'Emiliano Arias',
    handle: 'EmilianoArias021',
    role: 'Desarrollo de software',
    url: 'https://github.com/EmilianoArias021',
  },
]
