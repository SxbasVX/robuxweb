'use client';
import { getSupabase } from './supabaseClient';
import { useAuth } from './auth-context';

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';
export type LogAction = 'user_login' | 'user_logout' | 'post_created' | 'post_deleted' | 'user_created' | 'user_deleted' | 'role_changed' | 'backup_created' | 'backup_loaded' | 'admin_access' | 'file_uploaded';

export interface LogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_email?: string;
  action: LogAction;
  level: LogLevel;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  private user: any = null;
  private logs: LogEntry[] = [];

  private constructor() {
    // Cargar logs desde localStorage
    this.loadLogsFromStorage();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  setUser(user: any) {
    this.user = user;
  }

  private loadLogsFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('audit_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading logs from storage:', error);
    }
  }

  private saveLogsToStorage() {
    if (typeof window === 'undefined') return;
    try {
      // Mantener solo los últimos 1000 logs
      const recentLogs = this.logs.slice(-1000);
      window.localStorage.setItem('audit_logs', JSON.stringify(recentLogs));
      this.logs = recentLogs;
    } catch (error) {
      console.error('Error saving logs to storage:', error);
    }
  }

  async log(action: LogAction, level: LogLevel = 'info', details: Record<string, any> = {}) {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user_id: this.user?.id || 'anonymous',
      user_email: this.user?.email || 'unknown',
      action,
      level,
      details,
      ip_address: 'local', // En producción, obtener IP real
      user_agent: navigator.userAgent
    };

    // Guardar en localStorage
    this.logs.push(logEntry);
    this.saveLogsToStorage();

    // Guardar SIEMPRE en Supabase
    try {
      const supabase = getSupabase();
      await supabase.from('logs').insert({
        id: logEntry.id,
        timestamp: logEntry.timestamp,
        user_id: logEntry.user_id,
        user_email: logEntry.user_email,
        action: logEntry.action,
        level: logEntry.level,
        details: logEntry.details,
        ip_address: logEntry.ip_address,
        user_agent: logEntry.user_agent
      });
    } catch (error) {
      // Si falla, mostrar advertencia pero no perder el log local
      console.warn('No se pudo guardar el log en Supabase:', error);
    }

    // Log críticos también en consola
    if (level === 'critical' || level === 'error') {
      console.error(`[AUDIT ${level.toUpperCase()}]`, action, details);
    }
  }

  getLogs(filters?: {
    level?: LogLevel;
    action?: LogAction;
    userId?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filters?.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters?.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters?.userId) {
      filtered = filtered.filter(log => log.user_id === filters.userId);
    }

    // Ordenar por timestamp descendente
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: this.logs.length,
      today: this.logs.filter(log => new Date(log.timestamp) >= today).length,
      thisWeek: this.logs.filter(log => new Date(log.timestamp) >= thisWeek).length,
      errors: this.logs.filter(log => log.level === 'error' || log.level === 'critical').length,
      byLevel: {
        info: this.logs.filter(log => log.level === 'info').length,
        warning: this.logs.filter(log => log.level === 'warning').length,
        error: this.logs.filter(log => log.level === 'error').length,
        critical: this.logs.filter(log => log.level === 'critical').length,
      },
      byAction: this.logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('audit_logs');
    }
  }

  exportLogs() {
    if (typeof window === 'undefined') return;
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Hook para usar el sistema de logs
export function useAuditLogger() {
  const { user } = useAuth();
  const logger = AuditLogger.getInstance();
  
  // Establecer usuario actual
  if (user) {
    logger.setUser(user);
  }

  return {
    log: logger.log.bind(logger),
    getLogs: logger.getLogs.bind(logger),
    getStats: logger.getStats.bind(logger),
    clearLogs: logger.clearLogs.bind(logger),
    exportLogs: logger.exportLogs.bind(logger)
  };
}

// Funciones de conveniencia
export const auditLog = {
  userLogin: (userId: string, email: string) => 
    AuditLogger.getInstance().log('user_login', 'info', { userId, email }),
  
  userLogout: (userId: string) => 
    AuditLogger.getInstance().log('user_logout', 'info', { userId }),
  
  postCreated: (postId: string, userId: string, groupId: number) => 
    AuditLogger.getInstance().log('post_created', 'info', { postId, userId, groupId }),
  
  postDeleted: (postId: string, deletedBy: string, reason?: string) => 
    AuditLogger.getInstance().log('post_deleted', 'warning', { postId, deletedBy, reason }),
  
  userDeleted: (deletedUserId: string, deletedBy: string, reason?: string) => 
    AuditLogger.getInstance().log('user_deleted', 'critical', { deletedUserId, deletedBy, reason }),
  
  roleChanged: (userId: string, oldRole: string, newRole: string, changedBy: string) => 
    AuditLogger.getInstance().log('role_changed', 'warning', { userId, oldRole, newRole, changedBy }),
  
  backupCreated: (backupId: string, createdBy: string) => 
    AuditLogger.getInstance().log('backup_created', 'info', { backupId, createdBy }),
  
  backupLoaded: (backupId: string, loadedBy: string) => 
    AuditLogger.getInstance().log('backup_loaded', 'warning', { backupId, loadedBy }),
  
  adminAccess: (userId: string, section: string) => 
    AuditLogger.getInstance().log('admin_access', 'info', { userId, section }),
  
  fileUploaded: (fileName: string, fileSize: number, userId: string) => 
    AuditLogger.getInstance().log('file_uploaded', 'info', { fileName, fileSize, userId })
};

export default AuditLogger;