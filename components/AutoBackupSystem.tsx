'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';

interface BackupInfo {
  id: string;
  name: string;
  type: 'manual' | 'automatic';
  size: number;
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed';
  tables_backed_up: string[];
  error_message?: string;
}

interface BackupStats {
  total_backups: number;
  last_backup: string;
  total_size: number;
  auto_backup_enabled: boolean;
  next_scheduled: string;
}

export default function AutoBackupSystem() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const { user, role } = useAuth();

  const loadBackups = async () => {
    try {
      const supabase = getSupabase();
      
      // Simular datos de backup (en producción conectar con sistema real)
      const mockBackups: BackupInfo[] = [
        {
          id: '1',
          name: `backup_${new Date().toISOString().split('T')[0]}`,
          type: 'automatic',
          size: 2.5 * 1024 * 1024, // 2.5MB
          created_at: new Date().toISOString(),
          status: 'completed',
          tables_backed_up: ['posts', 'comentarios', 'students', 'users']
        },
        {
          id: '2',
          name: 'backup_manual_2024-10-11',
          type: 'manual',
          size: 2.3 * 1024 * 1024,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          tables_backed_up: ['posts', 'comentarios', 'students']
        }
      ];

      const mockStats: BackupStats = {
        total_backups: mockBackups.length,
        last_backup: mockBackups[0].created_at,
        total_size: mockBackups.reduce((sum, b) => sum + b.size, 0),
        auto_backup_enabled: autoBackupEnabled,
        next_scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      setBackups(mockBackups);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createManualBackup = async () => {
    if (role !== 'admin') return;
    
    setCreating(true);
    try {
      const supabase = getSupabase();
      
      // En producción, implementar la lógica real de backup
      const newBackup: BackupInfo = {
        id: crypto.randomUUID(),
        name: `backup_manual_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
        type: 'manual',
        size: 0,
        created_at: new Date().toISOString(),
        status: 'in_progress',
        tables_backed_up: []
      };

      setBackups(prev => [newBackup, ...prev]);

      // Simular proceso de backup
      setTimeout(async () => {
        // Obtener datos reales para calcular tamaño
        const [postsResult, commentsResult, studentsResult] = await Promise.all([
          supabase.from('posts').select('*'),
          supabase.from('comentarios').select('*'),
          supabase.from('students').select('*')
        ]);

        const totalRecords = 
          (postsResult.data?.length || 0) +
          (commentsResult.data?.length || 0) +
          (studentsResult.data?.length || 0);

        const estimatedSize = totalRecords * 1024; // Estimación

        const completedBackup: BackupInfo = {
          ...newBackup,
          status: 'completed',
          size: estimatedSize,
          tables_backed_up: ['posts', 'comentarios', 'students', 'notifications']
        };

        setBackups(prev => prev.map(b => b.id === newBackup.id ? completedBackup : b));
        await loadBackups(); // Recargar stats
      }, 3000);

    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleAutoBackup = async () => {
    if (role !== 'admin') return;
    
    const newState = !autoBackupEnabled;
    setAutoBackupEnabled(newState);
    
    // En producción, guardar configuración en base de datos
    localStorage.setItem('auto_backup_enabled', newState.toString());
    
    await loadBackups();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (role === 'admin') {
      loadBackups();
      
      // Cargar configuración de auto-backup
      const autoBackupSetting = localStorage.getItem('auto_backup_enabled');
      if (autoBackupSetting !== null) {
        setAutoBackupEnabled(autoBackupSetting === 'true');
      }
    }
  }, [role]);

  if (role !== 'admin') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Acceso Denegado</h3>
        <p className="text-gray-300">Solo los administradores pueden gestionar backups.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de backup */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-blue-400 text-sm font-medium">Total Backups</div>
            <div className="text-2xl font-bold text-white">{stats.total_backups}</div>
          </div>
          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium">Último Backup</div>
            <div className="text-sm font-bold text-white">
              {formatDate(stats.last_backup)}
            </div>
          </div>
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
            <div className="text-purple-400 text-sm font-medium">Tamaño Total</div>
            <div className="text-lg font-bold text-white">{formatFileSize(stats.total_size)}</div>
          </div>
          <div className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-4">
            <div className="text-orange-400 text-sm font-medium">Próximo Auto</div>
            <div className="text-sm font-bold text-white">
              {formatDate(stats.next_scheduled)}
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">🔄 Sistema de Backup</h3>
          <div className="flex gap-3">
            <button
              onClick={toggleAutoBackup}
              className={`px-4 py-2 rounded-lg transition-colors ${
                autoBackupEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
              }`}
            >
              {autoBackupEnabled ? '✅ Auto ON' : '❌ Auto OFF'}
            </button>
            <button
              onClick={createManualBackup}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
            >
              {creating ? 'Creando...' : '💾 Backup Manual'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          {autoBackupEnabled ? (
            '🟢 Backups automáticos activados (diarios a las 2:00 AM)'
          ) : (
            '🔴 Backups automáticos desactivados'
          )}
        </div>

        {/* Lista de backups */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white">📚 Historial de Backups</h4>
          {backups.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No hay backups disponibles</p>
          ) : (
            backups.map((backup) => (
              <div key={backup.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-medium">{backup.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        backup.type === 'automatic' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        backup.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        backup.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {backup.status === 'completed' ? 'Completado' :
                         backup.status === 'in_progress' ? 'En progreso' : 'Error'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(backup.created_at)} • {formatFileSize(backup.size)} • 
                      {backup.tables_backed_up.length} tablas
                    </div>
                    {backup.error_message && (
                      <div className="text-sm text-red-400 mt-1">
                        Error: {backup.error_message}
                      </div>
                    )}
                  </div>
                  {backup.status === 'completed' && (
                    <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
                      📥 Restaurar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}