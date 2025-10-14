/**
 * FUNCIONES REQUERIDAS PARA LANZAMIENTO
 * ====================================
 */

// 1. CRÍTICAS (Debe tener antes del lanzamiento)
const CRITICAL_FEATURES = [
  {
    feature: '🔐 Recuperación de Contraseñas',
    status: 'MISSING',
    priority: 'ALTA',
    description: 'Los usuarios necesitan poder recuperar acceso si olvidan contraseñas'
  },
  {
    feature: '📧 Verificación de Email',
    status: 'MISSING', 
    priority: 'ALTA',
    description: 'Verificar emails válidos para evitar registros falsos'
  },
  {
    feature: '🛡️ Rate Limiting',
    status: 'MISSING',
    priority: 'ALTA', 
    description: 'Prevenir spam y ataques de fuerza bruta'
  },
  {
    feature: '📊 Logs de Auditoría',
    status: 'PARTIAL',
    priority: 'ALTA',
    description: 'Registrar acciones importantes para seguridad'
  },
  {
    feature: '🔄 Backup Automático',
    status: 'PARTIAL',
    priority: 'ALTA',
    description: 'Backups automáticos diarios de base de datos'
  }
];

// 2. IMPORTANTES (Deseables para lanzamiento)
const IMPORTANT_FEATURES = [
  {
    feature: '📈 Dashboard de Analytics',
    status: 'MISSING',
    priority: 'MEDIA',
    description: 'Métricas de uso, engagement, posts por grupo'
  },
  {
    feature: '🔔 Notificaciones Push',
    status: 'PARTIAL',
    priority: 'MEDIA',
    description: 'Notificaciones del navegador para nuevos posts'
  },
  {
    feature: '💬 Chat en Tiempo Real',
    status: 'MISSING',
    priority: 'MEDIA',
    description: 'Chat entre integrantes del mismo grupo'
  },
  {
    feature: '📱 Aplicación Móvil Nativa',
    status: 'PWA_ONLY',
    priority: 'MEDIA',
    description: 'App nativa iOS/Android para mejor experiencia'
  },
  {
    feature: '🔍 Búsqueda Global',
    status: 'BASIC',
    priority: 'MEDIA',
    description: 'Buscar contenido a través de todos los grupos'
  }
];

// 3. OPCIONALES (Para futuras versiones)
const OPTIONAL_FEATURES = [
  {
    feature: '🎨 Temas Personalizables',
    status: 'MISSING',
    priority: 'BAJA',
    description: 'Permitir a grupos personalizar colores y layout'
  },
  {
    feature: '📅 Calendario de Actividades',
    status: 'MISSING',
    priority: 'BAJA',
    description: 'Calendario compartido para deadlines y eventos'
  },
  {
    feature: '🏆 Sistema de Gamificación',
    status: 'MISSING',
    priority: 'BAJA',
    description: 'Puntos, badges por participación activa'
  },
  {
    feature: '📊 Reportes Avanzados',
    status: 'MISSING',
    priority: 'BAJA',
    description: 'Reportes PDF de actividad de grupos'
  }
];

export { CRITICAL_FEATURES, IMPORTANT_FEATURES, OPTIONAL_FEATURES };