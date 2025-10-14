'use client';

import { useAuth } from '../../lib/auth-context';
import UserAvatar from '../../components/UserAvatar';
import { getRoleDisplayName, getRoleColor, getRoleIcon } from '../../lib/gamertag';
import { useState, useEffect } from 'react';
import { getSupabase } from '../../lib/supabaseClient';

export default function PerfilPage() {
  const { user, role, group, isAnonymous } = useAuth();
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    joinDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const supabase = getSupabase();
      if (!user?.id) return;
      
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('autor', user.id);

      const { count: commentsCount } = await supabase
        .from('comentarios')
        .select('*', { count: 'exact', head: true })
        .eq('autor', user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', user.id)
        .single();

      setStats({
        posts: postsCount || 0,
        comments: commentsCount || 0,
        joinDate: userData?.created_at
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="glass p-6 rounded-2xl">
        <h1 className="text-2xl font-semibold mb-2">Cargando perfil...</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header del Perfil */}
      <div className="glass p-8 rounded-2xl">
        <div className="flex items-center space-x-6">
          <UserAvatar 
            user={user} 
            role={role} 
            size="xl" 
            showRole={true}
            className="shadow-lg"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {user.displayName || user.email || 'Estudiante'}
            </h1>
            {isAnonymous && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🎓 Temporal
              </span>
            )}
            {user.email && (
              <p className="text-gray-400 text-sm mt-2"> {user.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información Detallada */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">👤</span>
            Mi Información
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">🏷️</span>
                <span className="text-gray-400">Tipo de cuenta</span>
              </div>
              <span className="text-white font-medium">
                {isAnonymous ? 'Temporal' : 'Registrado'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center space-x-3">
                <span className="text-green-400">📊</span>
                <span className="text-gray-400">Estado</span>
              </div>
              <span className="text-green-400 font-medium">🟢 Activo</span>
            </div>

            {group && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center space-x-3">
                  <span className="text-purple-400">📚</span>
                  <span className="text-gray-400">Grupo</span>
                </div>
                <span className="text-blue-300 font-medium">Grupo {group}</span>
              </div>
            )}

            {!isAnonymous && stats.joinDate && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-l-4 border-indigo-500">
                <div className="flex items-center space-x-3">
                  <span className="text-indigo-400">📅</span>
                  <span className="text-gray-400">Miembro desde</span>
                </div>
                <span className="text-white font-medium text-sm">
                  {formatDate(stats.joinDate)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Actividad */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Resumen de Actividad
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Cargando...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/10 p-4 rounded-lg text-center border border-blue-500/20">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stats.posts}</div>
                  <div className="text-sm text-gray-400">Publicaciones</div>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg text-center border border-green-500/20">
                  <div className="text-3xl font-bold text-green-400 mb-2">{stats.comments}</div>
                  <div className="text-sm text-gray-400">Comentarios</div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h3 className="text-white font-medium">Actividad Total</h3>
                      <p className="text-gray-400 text-sm">Tus contribuciones en la plataforma</p>
                    </div>
                  </div>
                  <span className="font-bold text-2xl text-purple-400">
                    {stats.posts + stats.comments}
                  </span>
                </div>
              </div>

              {stats.posts + stats.comments === 0 && (
                <div className="text-center py-4">
                  <span className="text-6xl mb-2 block">🌱</span>
                  <p className="text-gray-400">¡Comienza tu participación!</p>
                  <p className="text-gray-500 text-sm">Crea tu primera publicación o comenta en alguna existente</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Herramientas Estudiantiles */}
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <span className="mr-2">🛠️</span>
          Herramientas Útiles
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {group && (
            <a
              href={`/grupo/${group}`}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-4 rounded-lg font-medium transition-all duration-300 flex flex-col items-center space-y-2 text-center group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
              <span>Mi Grupo</span>
              <span className="text-xs opacity-75">Ver publicaciones del grupo</span>
            </a>
          )}
          
          <a
            href="/"
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white p-4 rounded-lg font-medium transition-all duration-300 flex flex-col items-center space-y-2 text-center group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">📝</span>
            <span>Crear Post</span>
            <span className="text-xs opacity-75">Comparte algo nuevo</span>
          </a>
          
          <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-4 rounded-lg font-medium transition-all duration-300 flex flex-col items-center space-y-2 text-center group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🔍</span>
            <span>Buscar</span>
            <span className="text-xs opacity-75">Encuentra contenido</span>
          </button>
        </div>
      </div>

      {/* Ayuda */}
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-4"> ¿Necesitas Ayuda?</h2>
        <div className="text-center">
          <p className="text-gray-400 mb-6">
            Si tienes alguna duda, tu delegado de grupo está aquí para ayudarte.
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium">
             Hablar con el Delegado
          </button>
        </div>
      </div>
    </div>
  );
}
