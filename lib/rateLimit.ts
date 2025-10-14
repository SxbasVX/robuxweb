'use client';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Limpiar entradas expiradas cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.store.delete(key);
      }
    }
  }

  private getClientId(request?: Request): string {
    // En producción, usar IP real del cliente
    if (typeof window !== 'undefined') {
      // Cliente: usar localStorage como identificador temporal
      let clientId = localStorage.getItem('client_id');
      if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem('client_id', clientId);
      }
      return clientId;
    }
    
    // Servidor: usar IP o headers
    return request?.headers.get('x-forwarded-for') || 
           request?.headers.get('x-real-ip') || 
           'unknown';
  }

  checkLimit(action: string, request?: Request): { allowed: boolean; resetTime?: number; retryAfter?: number } {
    const clientId = this.getClientId(request);
    const key = `${clientId}:${action}`;
    const now = Date.now();
    
    let entry = this.store.get(key);
    
    // Si está bloqueado, verificar si ya expiró el bloqueo
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }
    
    // Si no existe o expiró la ventana, crear nueva entrada
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      this.store.set(key, entry);
      return { allowed: true, resetTime: entry.resetTime };
    }
    
    // Incrementar contador
    entry.count++;
    
    // Si excede el límite, bloquear
    if (entry.count > this.config.maxRequests) {
      entry.blockedUntil = now + this.config.blockDurationMs;
      this.store.set(key, entry);
      
      return {
        allowed: false,
        retryAfter: Math.ceil(this.config.blockDurationMs / 1000)
      };
    }
    
    this.store.set(key, entry);
    return { allowed: true, resetTime: entry.resetTime };
  }

  getRemainingRequests(action: string, request?: Request): number {
    const clientId = this.getClientId(request);
    const key = `${clientId}:${action}`;
    const entry = this.store.get(key);
    
    if (!entry || entry.resetTime <= Date.now()) {
      return this.config.maxRequests;
    }
    
    return Math.max(0, this.config.maxRequests - entry.count);
  }
}

// Configuraciones para diferentes acciones
const rateLimiters = {
  // Posts: máximo 10 posts por hora
  posts: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 30 * 60 * 1000 // 30 minutos de bloqueo
  }),
  
  // Comentarios: máximo 30 por hora
  comments: new RateLimiter({
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 15 * 60 * 1000 // 15 minutos de bloqueo
  }),
  
  // Reacciones: máximo 100 por hora
  reactions: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 5 * 60 * 1000 // 5 minutos de bloqueo
  }),
  
  // Login attempts: máximo 5 intentos por 15 minutos
  auth: new RateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 60 * 60 * 1000 // 1 hora de bloqueo
  }),
  
  // Uploads: máximo 20 archivos por hora
  uploads: new RateLimiter({
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 30 * 60 * 1000 // 30 minutos de bloqueo
  })
};

export function checkRateLimit(action: keyof typeof rateLimiters, request?: Request) {
  const limiter = rateLimiters[action];
  if (!limiter) {
    console.warn(`Rate limiter not found for action: ${action}`);
    return { allowed: true };
  }
  
  return limiter.checkLimit(action, request);
}

export function getRemainingRequests(action: keyof typeof rateLimiters, request?: Request): number {
  const limiter = rateLimiters[action];
  if (!limiter) return 999;
  
  return limiter.getRemainingRequests(action, request);
}

// Hook para usar en componentes React
export function useRateLimit(action: keyof typeof rateLimiters) {
  const checkLimit = () => checkRateLimit(action);
  const getRemaining = () => getRemainingRequests(action);
  
  return { checkLimit, getRemaining };
}

export default rateLimiters;