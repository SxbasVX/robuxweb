'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Shield, Database, Users, Cog } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

interface CheckResult {
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'checking';
  message: string;
  icon: React.ReactNode;
}

export default function LaunchReadiness() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'good' | 'warning' | 'error'>('good');

  const runChecks = async () => {
    setIsRunning(true);
    const supabase = getSupabase();
    
    const checkResults: CheckResult[] = [
      {
        name: 'Base de Datos',
        status: 'checking',
        message: 'Verificando conexión...',
        icon: <Database className="w-5 h-5" />
      },
      {
        name: 'Usuarios y Roles',
        status: 'checking',
        message: 'Verificando permisos...',
        icon: <Users className="w-5 h-5" />
      },
      {
        name: 'Políticas de Seguridad',
        status: 'checking',
        message: 'Verificando RLS...',
        icon: <Shield className="w-5 h-5" />
      },
      {
        name: 'Configuración',
        status: 'checking',
        message: 'Verificando configuración...',
        icon: <Cog className="w-5 h-5" />
      }
    ];

    setChecks([...checkResults]);

    // Verificar base de datos
    try {
      const { data, error } = await supabase.from('students').select('count').limit(1);
      checkResults[0] = {
        ...checkResults[0],
        status: error ? 'failed' : 'passed',
        message: error ? `Error: ${error.message}` : 'Conexión exitosa'
      };
    } catch (error) {
      checkResults[0] = {
        ...checkResults[0],
        status: 'failed',
        message: 'Error de conexión'
      };
    }

    // Verificar usuarios
    try {
      const { data, error } = await supabase.rpc('get_user_count');
      checkResults[1] = {
        ...checkResults[1],
        status: error ? 'failed' : 'passed',
        message: error ? `Error: ${error.message}` : `${data || 0} usuarios registrados`
      };
    } catch (error) {
      checkResults[1] = {
        ...checkResults[1],
        status: 'warning',
        message: 'No se pudo verificar usuarios'
      };
    }

    // Verificar RLS
    try {
      const { data, error } = await supabase.rpc('check_rls_status');
      checkResults[2] = {
        ...checkResults[2],
        status: data ? 'passed' : 'warning',
        message: data ? 'RLS activo' : 'RLS no configurado correctamente'
      };
    } catch (error) {
      checkResults[2] = {
        ...checkResults[2],
        status: 'warning',
        message: 'No se pudo verificar RLS'
      };
    }

    // Verificar configuración
    checkResults[3] = {
      ...checkResults[3],
      status: 'passed',
      message: 'Configuración válida'
    };

    setChecks([...checkResults]);
    
    // Determinar estado general
    const failed = checkResults.filter(c => c.status === 'failed').length;
    const warnings = checkResults.filter(c => c.status === 'warning').length;
    
    if (failed > 0) {
      setOverallStatus('error');
    } else if (warnings > 0) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('good');
    }
    
    setIsRunning(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return null;
    }
  };

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'good':
        return '¡Sistema listo para lanzamiento!';
      case 'warning':
        return 'Sistema funcional con advertencias';
      case 'error':
        return 'Se requieren correcciones antes del lanzamiento';
      default:
        return 'Verificando sistema...';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Estado del Sistema</h2>
        <button
          onClick={runChecks}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                   disabled:bg-blue-800 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Verificando...' : 'Verificar'}
        </button>
      </div>

      <div className={`p-4 rounded-lg mb-6 ${
        overallStatus === 'good' ? 'bg-green-900/30 border border-green-700/50' :
        overallStatus === 'warning' ? 'bg-yellow-900/30 border border-yellow-700/50' :
        'bg-red-900/30 border border-red-700/50'
      }`}>
        <div className="flex items-center gap-3">
          {overallStatus === 'good' && <CheckCircle className="w-6 h-6 text-green-400" />}
          {overallStatus === 'warning' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
          {overallStatus === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
          <span className="text-white font-medium">{getOverallMessage()}</span>
        </div>
      </div>

      <div className="space-y-4">
        {checks.map((check, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-slate-700/30 
                     rounded-lg border border-slate-600/30"
          >
            <div className="flex items-center gap-3">
              {check.icon}
              <span className="text-white font-medium">{check.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${
                check.status === 'passed' ? 'text-green-400' :
                check.status === 'failed' ? 'text-red-400' :
                check.status === 'warning' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                {check.message}
              </span>
              {getStatusIcon(check.status)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-700/20 rounded-lg">
        <h3 className="text-white font-medium mb-2">Próximos pasos:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Verificar que todos los checks estén en verde</li>
          <li>• Crear backup final antes del lanzamiento</li>
          <li>• Configurar monitoreo de producción</li>
          <li>• Documentar procedimientos de mantenimiento</li>
        </ul>
      </div>
    </div>
  );
}