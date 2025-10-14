'use client';
import React from 'react';
import { useBackupSystem } from '../lib/useBackupSystem';
import { useAuth } from '../lib/auth-context';

export default function BackupManager() {
  const { user, role } = useAuth();
  const {
    isLoading,
    lastBackup,
    createBackup,
    getBackupStatus
  } = useBackupSystem();

  // Solo admins pueden acceder
  if (role !== 'admin') {
    return (
      <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Acceso Denegado</h3>
        <p className="text-gray-300">Solo los administradores pueden acceder al sistema de backup.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-600/20';
      case 'failed': return 'text-red-400 bg-red-600/20';
      case 'pending': return 'text-yellow-400 bg-yellow-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-6 border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          💾 Sistema de Backup y Respaldo
        </h2>
        <p className="text-purple-200">
          Gestiona copias de seguridad automáticas y exportación de datos
        </p>
      </div>

      {/* Estado del backup */}
      {lastBackup && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
          <div className="text-lg font-bold text-purple-400 mb-2">Estado del Sistema</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Último backup:</span>
              <span className="text-blue-400">
                {lastBackup ? 
                  formatDate(lastBackup) : 
                  'No disponible'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Estado:</span>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor('completed')}`}>
                Disponible
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={createBackup}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creando Backup...
            </>
          ) : (
            <>
              💾 Crear Backup Manual
            </>
          )}
        </button>

        <button
          onClick={() => getBackupStatus()}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          🔄 Actualizar Estado
        </button>
      </div>

      {/* Información del sistema */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-600/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ℹ️ Información del Sistema</h3>
        <div className="space-y-2 text-gray-300">
          <p>• Los backups se crean automáticamente para proteger los datos</p>
          <p>• Usa "Crear Backup Manual" para generar una copia inmediata</p>
          <p>• El estado del sistema se actualiza automáticamente</p>
        </div>
      </div>

      {/* Información sobre backup automático */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">📅 Backup Automático</h4>
        <p className="text-gray-300 text-sm">
          Los backups se crean automáticamente cada 24 horas. Los datos críticos se mantienen durante 30 días.
          Incluye: publicaciones, usuarios, comentarios, ensayos y configuraciones de grupo.
        </p>
      </div>

      {/* Información GDPR */}
      <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
        <h4 className="text-yellow-300 font-medium mb-2">🔒 Protección de Datos (GDPR)</h4>
        <p className="text-gray-300 text-sm">
          Los usuarios pueden exportar todos sus datos personales en formato JSON. 
          Esto incluye: perfil, publicaciones, comentarios, ensayos y notificaciones.
        </p>
      </div>
    </div>
  );
}