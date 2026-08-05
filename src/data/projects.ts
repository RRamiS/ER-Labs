export type ProjectStatus = 'mvp' | 'desarrollo'

export type ShotHotspot = {
  id: string
  /** Left edge as % of image width (0–100). */
  x: number
  /** Top edge as % of image height (0–100). */
  y: number
  /** Box width as % of image width. */
  w?: number
  /** Box height as % of image height. */
  h?: number
  label: string
  text?: string
  side?: 'left' | 'right' | 'top' | 'bottom'
}

export type GalleryShot = {
  src?: string
  caption: string
  stepTitle?: string
  description?: string
  actionText?: string
  tags?: string[]
  hotspots?: ShotHotspot[]
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
      {
        src: '/projects/vehio/01-inicio.png',
        caption: 'Inicio & Landing',
        stepTitle: 'Portada Principal',
        actionText: 'Explorar destacados y ofertas',
        description: 'Recomendaciones principales y vehículos en tendencia.',
        tags: ['Hero Banner', 'Populares'],
        hotspots: [
          {
            id: 'vehio-nav',
            x: 18,
            y: 5.5,
            w: 28,
            h: 5,
            label: 'Navegación',
            text: 'Comprar, compra segura y destacados en un click.',
            side: 'bottom',
          },
          {
            id: 'vehio-search',
            x: 22,
            y: 48,
            w: 56,
            h: 18,
            label: 'Buscador central',
            text: 'Marca, modelo o ubicación con atajos rápidos.',
            side: 'top',
          },
          {
            id: 'vehio-publish',
            x: 62,
            y: 5.5,
            w: 16,
            h: 5,
            label: 'Publicar',
            text: 'CTA para cargar un vehículo al marketplace.',
            side: 'bottom',
          },
        ],
      },
      {
        src: '/projects/vehio/02-beneficios.png',
        caption: 'Recomendaciones',
        stepTitle: 'Selección del Día',
        actionText: 'Ver vehículos sugeridos',
        description: 'Unidades destacadas por precio y estado verificado.',
        tags: ['Destacados', 'Ofertas'],
      },
      {
        src: '/projects/vehio/02-beneficios.png',
        caption: 'Propuesta de Valor',
        stepTitle: 'Garantía & Confianza',
        actionText: 'Evaluar ventajas del servicio',
        description: 'Verificación de unidades y transparencia en operaciones.',
        tags: ['Garantía', 'Confianza'],
      },
      {
        src: '/projects/vehio/03-catalogo.png',
        caption: 'Catálogo Interactivo',
        stepTitle: 'Búsqueda Avanzada',
        actionText: 'Filtrar por marca y precio',
        description: 'Filtros dinámicos por año, marca y kilometraje.',
        tags: ['Filtros HD', 'Paginación'],
      },
      {
        src: '/projects/vehio/04-detalle.png',
        caption: 'Ficha del Vehículo',
        stepTitle: 'Ficha & Equipamiento',
        actionText: 'Inspeccionar especificaciones',
        description: 'Galería HD completa e historial de mantenimiento.',
        tags: ['Ficha HD', 'Historial'],
      },
      {
        src: '/projects/vehio/02-beneficios.png',
        caption: 'Simulador Financiero',
        stepTitle: 'Calculadora de Cuotas',
        actionText: 'Simular crédito automotor',
        description: 'Estimación de entrega inicial y financiamiento fijo.',
        tags: ['Calculadora', 'Cuotas'],
      },
      {
        src: '/projects/vehio/01-inicio.png',
        caption: 'Test Drive & Cita',
        stepTitle: 'Agendar Inspección',
        actionText: 'Coordinar prueba de manejo',
        description: 'Reserva de turno para inspeccionar el auto en persona.',
        tags: ['Cita', 'Test Drive'],
      },
      {
        src: '/projects/vehio/04-detalle.png',
        caption: 'Contacto Directo',
        stepTitle: 'Canal de Negociación',
        actionText: 'Contactar vía WhatsApp',
        description: 'Conexión inmediata con el vendedor en un clic.',
        tags: ['WhatsApp', 'Chat Directo'],
      },
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
      {
        src: '/projects/reflejos/01-portada.png',
        caption: 'Portada Principal',
        stepTitle: 'Bienvenida Inmersiva',
        actionText: 'Presentación visual',
        description: 'Header panorámico con acceso a tarifas.',
        tags: ['Hero Visual', 'Tarifas'],
      },
      {
        src: '/projects/reflejos/02-galeria.png',
        caption: 'Vistas Panorámicas',
        stepTitle: 'Entorno Natural',
        actionText: 'Descubrir el lago y parque',
        description: 'Fotografías del entorno y áreas verdes.',
        tags: ['Lago', 'Parque'],
      },
      {
        src: '/projects/reflejos/02-galeria.png',
        caption: 'Cabañas & Servicios',
        stepTitle: 'Tour de Instalaciones',
        actionText: 'Explorar comodidades',
        description: 'Equipamiento de cabañas y piscina.',
        tags: ['Cabañas', 'Piscina'],
      },
      {
        src: '/projects/reflejos/03-nosotros.png',
        caption: 'Historia & Anfitriones',
        stepTitle: 'Sobre Nosotros',
        actionText: 'Conocer la propuesta',
        description: 'Atención personalizada e historia del lugar.',
        tags: ['Historia', 'Anfitriones'],
      },
      {
        src: '/projects/reflejos/01-portada.png',
        caption: 'Tarifas & Fechas',
        stepTitle: 'Promociones',
        actionText: 'Consultar ofertas',
        description: 'Paquetes especiales por cantidad de noches.',
        tags: ['Promociones', 'Paquetes'],
      },
      {
        src: '/projects/reflejos/02-galeria.png',
        caption: 'Paseos & Excursiones',
        stepTitle: 'Guía Turística',
        actionText: 'Ver actividades locales',
        description: 'Circuitos recomendados y gastronomía.',
        tags: ['Excursiones', 'Paseos'],
      },
      {
        src: '/projects/reflejos/03-nosotros.png',
        caption: 'Ubicación & Mapa',
        stepTitle: 'Cómo Llegar',
        actionText: 'Ver mapa interactivo',
        description: 'Mapa con coordenadas GPS y referencias.',
        tags: ['Google Maps', 'GPS'],
      },
      {
        src: '/projects/reflejos/03-nosotros.png',
        caption: 'Reserva Directa',
        stepTitle: 'Contacto WhatsApp',
        actionText: 'Consultar disponibilidad',
        description: 'Canal directo para confirmar estadías.',
        tags: ['WhatsApp', 'Reserva'],
      },
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
      {
        src: '/projects/containers/01-alquileres.png',
        caption: 'Gestión de Alquileres',
        stepTitle: 'Panel de Activos',
        actionText: 'Monitorear contratos',
        description: 'Tablero operativo con contratos en curso.',
        tags: ['Contratos', 'KPIs'],
      },
      {
        src: '/projects/containers/01-alquileres.png',
        caption: 'Alertas de Cobro',
        stepTitle: 'Vencimientos',
        actionText: 'Revisar contratos por expirar',
        description: 'Avisos automáticos de renovación.',
        tags: ['Alertas', 'Facturas'],
      },
      {
        src: '/projects/containers/02-mapa.png',
        caption: 'Mapa de Flota',
        stepTitle: 'Geolocalización GPS',
        actionText: 'Rastrear contenedores',
        description: 'Ubicación en mapa en tiempo real.',
        tags: ['GPS', 'Rutas'],
      },
      {
        src: '/projects/containers/04-choferes.png',
        caption: 'Hojas de Ruta',
        stepTitle: 'Despacho & Logística',
        actionText: 'Asignar choferes',
        description: 'Coordinación de transportistas y remitos.',
        tags: ['Despacho', 'Choferes'],
      },
      {
        src: '/projects/containers/03-contenedores.png',
        caption: 'Ficha de Contenedor',
        stepTitle: 'Inventario de Stock',
        actionText: 'Inspeccionar unidades',
        description: 'Estado físico y disponibilidad.',
        tags: ['Stock', 'Ficha Técnica'],
      },
      {
        src: '/projects/containers/03-contenedores.png',
        caption: 'Mantenimiento',
        stepTitle: 'Historial Técnico',
        actionText: 'Registrar reparaciones',
        description: 'Control de repuestos y revisiones.',
        tags: ['Reparaciones', 'Taller'],
      },
      {
        src: '/projects/containers/01-alquileres.png',
        caption: 'Reportes Mensuales',
        stepTitle: 'Analítica de Rentabilidad',
        actionText: 'Ver balance de alquileres',
        description: 'Métricas de ocupación y rendimiento.',
        tags: ['Métricas', 'Balance'],
      },
      {
        src: '/projects/containers/04-choferes.png',
        caption: 'Firma Digital',
        stepTitle: 'Confirmación Entrega',
        actionText: 'Validar recepción en obra',
        description: 'Firma digital de remitos en celular.',
        tags: ['Firma App', 'Remitos'],
      },
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
      {
        src: '/projects/fincos/01-dashboard.png',
        caption: 'Dashboard Hortícola',
        stepTitle: 'Control Diario',
        actionText: 'Revisar vendido y cobrado',
        description: 'Situación financiera de la finca: ventas, cobranzas y neto.',
        tags: ['Dashboard', 'KPIs'],
        hotspots: [
          {
            id: 'fincos-metrics',
            x: 8,
            y: 28,
            w: 84,
            h: 22,
            label: 'KPIs financieros',
            text: 'Vendido, cobrado, por cobrar y neto finca sobre lo efectivamente cobrado.',
            side: 'bottom',
          },
          {
            id: 'fincos-debtors',
            x: 8,
            y: 52,
            w: 42,
            h: 22,
            label: 'Clientes deudores',
            text: 'Saldo pendiente por cliente y cultivo (ej. Verdulería El Mercado).',
            side: 'right',
          },
          {
            id: 'fincos-partners',
            x: 52,
            y: 52,
            w: 40,
            h: 22,
            label: 'Medieros',
            text: 'Parte cobrada y saldo a pagar (Beto 30%).',
            side: 'left',
          },
          {
            id: 'fincos-period',
            x: 62,
            y: 20,
            w: 30,
            h: 6,
            label: 'Filtro de período',
            text: 'Hoy, semana o mes para recortar el tablero.',
            side: 'bottom',
          },
        ],
      },
      {
        src: '/projects/fincos/02-fincas.png',
        caption: 'Estructura de Finca',
        stepTitle: 'Fincas, Cuadros y Sectores',
        actionText: 'Configurar la parcela',
        description: 'Alta de fincas, lotes y sectores del cinturón hortícola.',
        tags: ['Parcelas', 'Estructura'],
      },
      {
        src: '/projects/fincos/03-plantaciones.png',
        caption: 'Plantaciones Activas',
        stepTitle: 'Ciclo de Cultivo',
        actionText: 'Seguir remolacha y medieros',
        description: 'Cultivo, ubicación, acuerdo de mediería y estado de cosecha.',
        tags: ['Siembra', 'Mediería'],
      },
      {
        src: '/projects/fincos/04-ventas.png',
        caption: 'Ventas y Cobranzas',
        stepTitle: 'Despacho a Mercado',
        actionText: 'Registrar cobros parciales',
        description: 'Ventas a verdulerías con saldo pendiente y parte del mediero.',
        tags: ['Ventas', 'Cobranza'],
        hotspots: [
          {
            id: 'fincos-collect',
            x: 8,
            y: 22,
            w: 84,
            h: 28,
            label: 'Registrar cobranza',
            text: 'Elegís la venta pendiente y cobrás un monto; el mediero se calcula sobre lo cobrado.',
            side: 'bottom',
          },
          {
            id: 'fincos-sale-row',
            x: 8,
            y: 58,
            w: 84,
            h: 14,
            label: 'Venta parcial',
            text: 'Bruto $100.000 · cobrado $40.000 · pendiente $60.000 · Beto 30%.',
            side: 'top',
          },
          {
            id: 'fincos-status',
            x: 78,
            y: 62,
            w: 14,
            h: 6,
            label: 'Estado',
            text: 'PARTIALLY_PAID marca que todavía hay saldo por cobrar.',
            side: 'left',
          },
        ],
      },
      {
        src: '/projects/fincos/05-medieros.png',
        caption: 'Liquidación Medieros',
        stepTitle: 'Saldos y Pagos',
        actionText: 'Liquidar lo cobrado',
        description: 'Parte del mediero sobre lo efectivamente cobrado.',
        tags: ['Medieros', 'Liquidación'],
      },
      {
        src: '/projects/fincos/06-reportes.png',
        caption: 'Reportes de Cosecha',
        stepTitle: 'Por Cultivo y Cuadro',
        actionText: 'Evaluar rendimiento',
        description: 'Bruto vendido, neto finca y desglose por ubicación.',
        tags: ['Reportes', 'Cultivos'],
      },
      {
        src: '/projects/fincos/01-dashboard.png',
        caption: 'Neto de la Finca',
        stepTitle: 'Cashflow Hortícola',
        actionText: 'Ver pendiente y cobrado',
        description: 'Métricas de por cobrar, neto finca y saldos a medieros.',
        tags: ['Finanzas', 'Neto'],
      },
      {
        src: '/projects/fincos/03-plantaciones.png',
        caption: 'Acuerdos de Mediería',
        stepTitle: 'Beto 30% / Finca 70%',
        actionText: 'Cambiar o cerrar acuerdo',
        description: 'Plantaciones con mediero asignado y ciclo en cosecha.',
        tags: ['Acuerdos', 'Campo'],
      },
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
      {
        src: '/projects/lista-precios/01-lista.png',
        caption: 'Buscador Mostrador',
        stepTitle: 'Consulta Express',
        actionText: 'Búsqueda de insumos',
        description: 'Buscador veloz con stock y márgenes.',
        tags: ['Búsqueda', 'Mostrador'],
      },
      {
        src: '/projects/lista-precios/01-lista.png',
        caption: 'Filtro por Marca',
        stepTitle: 'Filtrado por Proveedor',
        actionText: 'Seleccionar marcas',
        description: 'Listado filtrado por fabricante.',
        tags: ['Proveedores', 'Filtros'],
      },
      {
        src: '/projects/lista-precios/02-detalle.png',
        caption: 'Alta de Producto',
        stepTitle: 'Calculadora de IVA',
        actionText: 'Ingresar costo y margen',
        description: 'Formulario con cálculo automático.',
        tags: ['IVA', 'Márgenes'],
      },
      {
        src: '/projects/lista-precios/03-categorias.png',
        caption: 'Estructura Rubros',
        stepTitle: 'Gestión de Rubros',
        actionText: 'Organizar categorías',
        description: 'Árbol de rubros e insumos.',
        tags: ['Rubros', 'Categorías'],
      },
      {
        src: '/projects/lista-precios/01-lista.png',
        caption: 'Actualización Masiva',
        stepTitle: 'Ajuste de Precios',
        actionText: 'Aplicar recargo por marca',
        description: 'Actualización de coeficientes en un clic.',
        tags: ['Ajuste Masivo', 'Precios'],
      },
      {
        src: '/projects/lista-precios/04-vista.png',
        caption: 'Personalización Visual',
        stepTitle: 'Modo Oscuro / Claro',
        actionText: 'Cambiar tema de pantalla',
        description: 'Adaptación para jornadas extensas.',
        tags: ['Modo Oscuro', 'UI'],
      },
      {
        src: '/projects/lista-precios/03-categorias.png',
        caption: 'Exportador PDF',
        stepTitle: 'Listas Imprimibles',
        actionText: 'Generar PDF para clientes',
        description: 'Diseño de catálogo impreso.',
        tags: ['PDF', 'Impresión'],
      },
      {
        src: '/projects/lista-precios/02-detalle.png',
        caption: 'Backup de Datos',
        stepTitle: 'Resguardo de Base',
        actionText: 'Exportar catálogo en JSON',
        description: 'Resguardo de datos seguro.',
        tags: ['Backup', 'JSON'],
      },
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
      {
        src: '/projects/muebleria/01-portada.png',
        caption: 'Showroom Virtual',
        stepTitle: 'Portada & Tendencias',
        actionText: 'Ver colecciones destacadas',
        description: 'Banners inmersivos con muebles de diseño.',
        tags: ['Showroom', 'Diseño'],
      },
      {
        src: '/projects/muebleria/01-portada.png',
        caption: 'Promociones Mes',
        stepTitle: 'Ofertas de Temporada',
        actionText: 'Descubrir descuentos',
        description: 'Kits de muebles con precio especial.',
        tags: ['Ofertas', 'Kits'],
      },
      {
        src: '/projects/muebleria/02-categorias.png',
        caption: 'Filtro por Ambientes',
        stepTitle: 'Living & Comedor',
        actionText: 'Filtrar por sección',
        description: 'Clasificación intuitiva por habitación.',
        tags: ['Ambientes', 'Living'],
      },
      {
        src: '/projects/muebleria/03-productos.png',
        caption: 'Ficha de Producto',
        stepTitle: 'Medidas & Materiales',
        actionText: 'Consultar detalles técnicos',
        description: 'Ficha con opciones de madera y lustres.',
        tags: ['Medidas', 'Madera'],
      },
      {
        src: '/projects/muebleria/02-categorias.png',
        caption: 'Catálogo de Telas',
        stepTitle: 'Muestrario Tapizados',
        actionText: 'Elegir textura y color',
        description: 'Catálogo con muestras de panas y linos.',
        tags: ['Tapizados', 'Telas'],
      },
      {
        src: '/projects/muebleria/01-portada.png',
        caption: 'Cotizador A Medida',
        stepTitle: 'Presupuestos',
        actionText: 'Cotizar proyectos',
        description: 'Cálculo para muebles personalizados.',
        tags: ['A Medida', 'Cotizador'],
      },
      {
        src: '/projects/muebleria/03-productos.png',
        caption: 'Envíos & Logística',
        stepTitle: 'Zonas de Entrega',
        actionText: 'Ver costos de envío',
        description: 'Información de fletes y armadores.',
        tags: ['Envíos', 'Armado'],
      },
      {
        src: '/projects/muebleria/03-productos.png',
        caption: 'Asesoría Venta',
        stepTitle: 'Contacto WhatsApp',
        actionText: 'Hablar con un diseñador',
        description: 'Asesoría personalizada en directo.',
        tags: ['WhatsApp', 'Diseñadores'],
      },
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
