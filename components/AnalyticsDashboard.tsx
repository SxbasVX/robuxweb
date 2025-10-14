'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';

interface AnalyticsDashboardProps {
  className?: string;
}

interface Analytics {
  totalPosts: number;
  totalUsers: number;
  activeGroups: number;
  todayActivity: number;
  weeklyGrowth: number;
  topGroups: Array<{
    groupId: number;
    groupName: string;
    postCount: number;
    userCount: number;
  }>;
  recentActivity: Array<{
    type: 'post' | 'comment' | 'user_join';
    description: string;
    timestamp: string;
    groupId?: number;
  }>;
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, role } = useAuth();

  const fetchAnalytics = async () => {
    if (role !== 'admin') return;

    try {
      const supabase = getSupabase();

      // Obtener estadísticas básicas
      const [postsResult, usersResult, studentsResult] = await Promise.all([
        supabase.from('posts').select('id, grupo, created_at'),
        supabase.auth.admin.listUsers(),
        supabase.from('students').select('id, group')
      ]);

      if (postsResult.error) throw postsResult.error;
      if (usersResult.error) throw usersResult.error;

      const posts = postsResult.data || [];
      const users = usersResult.data?.users || [];
      const students = studentsResult.data || [];

      // Calcular métricas
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const todayPosts = posts.filter(p => 
        new Date(p.created_at) >= new Date(today.setHours(0, 0, 0, 0))
      );
      
      const weekPosts = posts.filter(p => 
        new Date(p.created_at) >= weekAgo
      );

      // Grupos por actividad
      const groupActivity = posts.reduce((acc, post) => {
        const groupId = post.grupo;
        if (!acc[groupId]) {
          acc[groupId] = { postCount: 0, userCount: 0 };
        }
        acc[groupId].postCount++;
        return acc;
      }, {} as Record<number, { postCount: number; userCount: number }>);

      // Contar usuarios por grupo
      students.forEach(student => {
        const groupId = student.group;
        if (groupActivity[groupId]) {
          groupActivity[groupId].userCount++;
        }
      });

      const groupNames = {
        1: 'Inteligencia Artificial y Machine Learning',
        2: 'Energías Renovables y Conservación',
        3: 'Telemedicina y Aplicaciones Médicas',
        4: 'Plataformas de Aprendizaje Interactivo',
        5: 'Aplicaciones Descentralizadas y DeFi'
      };

      const topGroups = Object.entries(groupActivity)
        .map(([groupId, data]) => ({
          groupId: Number(groupId),
          groupName: groupNames[Number(groupId) as keyof typeof groupNames] || `Grupo ${groupId}`,
          postCount: data.postCount,
          userCount: data.userCount
        }))
        .sort((a, b) => b.postCount - a.postCount);

      const analyticsData: Analytics = {
        totalPosts: posts.length,
        totalUsers: users.length,
        activeGroups: Object.keys(groupActivity).length,
        todayActivity: todayPosts.length,
        weeklyGrowth: weekPosts.length,
        topGroups,
        recentActivity: posts
          .slice(-10)
          .reverse()
          .map(post => ({
            type: 'post' as const,
            description: `Nueva publicación en Grupo ${post.grupo}`,
            timestamp: post.created_at,
            groupId: post.grupo
          }))
      };

      setAnalytics(analyticsData);
    } catch (error: any) {
      setError(error.message || 'Error cargando analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [role]);

  if (role !== 'admin') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Acceso Denegado</h3>
        <p className="text-gray-300">Solo los administradores pueden ver analytics.</p>
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

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Error</h3>
        <p className="text-gray-300">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
          <div className="text-blue-400 text-sm font-medium">Total Posts</div>
          <div className="text-2xl font-bold text-white">{analytics.totalPosts}</div>
        </div>
        <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
          <div className="text-green-400 text-sm font-medium">Usuarios</div>
          <div className="text-2xl font-bold text-white">{analytics.totalUsers}</div>
        </div>
        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
          <div className="text-purple-400 text-sm font-medium">Grupos Activos</div>
          <div className="text-2xl font-bold text-white">{analytics.activeGroups}</div>
        </div>
        <div className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-4">
          <div className="text-orange-400 text-sm font-medium">Actividad Hoy</div>
          <div className="text-2xl font-bold text-white">{analytics.todayActivity}</div>
        </div>
      </div>

      {/* Grupos más activos */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">🏆 Grupos Más Activos</h3>
        <div className="space-y-3">
          {analytics.topGroups.slice(0, 5).map((group, index) => (
            <div key={group.groupId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}
                </span>
                <div>
                  <div className="text-white font-medium">{group.groupName}</div>
                  <div className="text-gray-400 text-sm">{group.userCount} integrantes</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{group.postCount}</div>
                <div className="text-gray-400 text-sm">posts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">📈 Actividad Reciente</h3>
        <div className="space-y-2">
          {analytics.recentActivity.slice(0, 8).map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-2 text-sm">
              <span className="text-blue-400">•</span>
              <span className="text-gray-300">{activity.description}</span>
              <span className="text-gray-500 ml-auto">
                {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh button */}
      <div className="text-center">
        <button
          onClick={fetchAnalytics}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          🔄 Actualizar Datos
        </button>
      </div>
    </div>
  );
}