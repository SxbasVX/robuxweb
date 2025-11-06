'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { subscribePosts, reactTo } from '../lib/data';
import { getSupabase } from '../lib/supabaseClient';
import type { Post, Emoji } from '../lib/types';
import PostCard from './PostCard';
import PostComposer from './PostComposer';
import { useAuth } from '../lib/auth-context';
import { StudentManager } from './StudentManager';
import { StudentsViewer } from './StudentsViewer';
import dynamic from 'next/dynamic';

// Cargar componentes dinámicamente para evitar problemas de SSR
const GroupHomePage = dynamic(() => import('./GroupHomePage'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  )
});

const GroupHomeEditor = dynamic(() => import('./GroupHomeEditor'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  )
});

// Estructura académica de grupos
const academicGroups = [
  { 
    id: 1, 
    name: 'Grupo 1', 
    description: '',
    topic: '',
    members: [
      'Vilca Cruz Marsia Gianella Katherine',
      'Lugo Villogas Ihara Dula',
      'Romani Medina Nadit Liliana',
      'Maza Morales Benjamin Pedro',
      'Damjanovic Burga Yenko Branko',
      'Navarro Cespedes Sunmy Adriana '
    ],
    color: 'from-blue-500 to-cyan-600',
    icon: '🤖'
  },
  { 
    id: 2, 
    name: 'Grupo 2', 
    description: '',
    topic: '',
    members: [
      'Palomino Huamani Judit Gabriela',
      'Asuncion Pomasonco Allison Giselle',
      'Martinez Gomez Alvaro Jose',
      'Yaranga Mejia Zharick Scarlett',
      'Maquera Mendoza Bryan Antony',
      'Luque Loayza David Mauricio '
    ],
    color: 'from-green-500 to-emerald-600',
    icon: '🌱'
  },
  { 
    id: 3, 
    name: 'Grupo 3', 
    description: '',
    topic: '',
    members: [
      'Quispe Abtao Jhack Hildibrahan',
      'Reyes Mendieta Karla Fernanda',
      'Hanampa Bellido Luz Berli',
      'Gonzales Lopez Lulio Main',
      'Ballon Ramos Robert Andres'
    ],
    color: 'from-purple-500 to-violet-600',
    icon: '⚕️'
  },
  { 
    id: 4, 
    name: 'Grupo 4', 
    description: '',
    topic: '',
    members: [
      'Martinez Luque Claudia Alexandra',
      'Morales Damian Andrea Katherine',
      'Usurin Osorio Anghely Crystal',
      'Espinoza Cardeña Alessandra Abygail',
      'Granada Juarez Alejandra'
    ],
    color: 'from-pink-500 to-rose-600',
    icon: '📚'
  },
  { 
    id: 5, 
    name: 'Grupo 5', 
    description: '',
    topic: '',
    members: [
      'Balbin Cueva Aaron',
      'Carrillo Castillo Brenda',
      'Hurtado Dominguez Angel Valeria',
      'Marcelo Diego Francesco',
      'Medina Vera Arturo Alexis',
      'Obregon Castro Jhesbelt Jhadira',
      'Ramon Ipushima Ilan Yafet'
    ],
    color: 'from-orange-500 to-amber-600',
    icon: '⛓️'
  },
];

export default function GroupBoard({ groupId }: { groupId: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'inicio' | 'integrantes'>('inicio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user, role, group } = useAuth();

  // Obtener información del grupo académico
  const currentGroup = useMemo(() => 
    academicGroups.find(g => g.id === groupId), [groupId]
  );

  const refreshPosts = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Memoizar funciones para evitar re-renders
  const canManage = useMemo(() => 
    role === 'admin' || role === 'delegado', [role]
  );

  const canPublish = useCallback((p: Post) => {
    if (!user) return false;
    if (role === 'admin') return true;
    if (role === 'delegado' && group === p.grupo) return true;
    return false;
  }, [user, role, group]);

  // Optimizar el filtrado de posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (p.status === 'published') return true;
      if (p.status === 'draft' && canPublish(p)) return true;
      return false;
    });
  }, [posts, canPublish]);

  // Cargar posts solo cuando sea necesario
  useEffect(() => {
    // Ya no necesitamos cargar posts porque eliminamos la pestaña
    return;
  }, [groupId, refreshKey, activeTab]);

  const onReact = useCallback((postId: string) => async (emoji: Emoji) => {
    try {
      const updatedReactions = await reactTo('post', groupId, postId, emoji);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, reacciones: updatedReactions }
            : post
        )
      );
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  }, [groupId]);

  const doPublish = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !canPublish(post)) {
      alert('No tienes permisos para publicar esta publicación');
      return;
    }
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('posts')
        .update({ status: 'published' })
        .eq('id', postId)
        .eq('grupo', groupId);
      
      if (error) throw error;
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, status: 'published' }
            : post
        )
      );
    } catch (error) {
      console.error('Error publicando post:', error);
      alert('Error al publicar la publicación');
    }
  }, [posts, canPublish, groupId]);

  const doDelete = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Permitir borrar si es admin o si es delegado y autor del post
    const canDeletePost = role === 'admin' || (role === 'delegado' && post.autor === user?.id);
    if (!canDeletePost) {
      alert('No tienes permisos para eliminar esta publicación');
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      alert('✅ Publicación eliminada correctamente');
    } catch (error) {
      console.error('Error eliminando post:', error);
      alert('❌ Error al eliminar la publicación');
    }
  }, [posts, role, user?.email, groupId]);

  return (
    <section className="space-y-6 animate-fade-in">
      {/* Header del Grupo Académico */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-start space-x-6">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-r ${currentGroup?.color} flex items-center justify-center shadow-lg`}>
            <span className="text-3xl">{currentGroup?.icon}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-token mb-1">{currentGroup?.name}</h1>
            <h2 className="text-lg md:text-xl font-semibold" style={{color: 'var(--chip-text)'}}>{currentGroup?.topic}</h2>
            <p className="muted-token mt-2 mb-4">{currentGroup?.description}</p>
            
            {/* Integrantes */}
            <div className="post-card p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center text-token">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Integrantes del Grupo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {currentGroup?.members.map((member, idx) => (
                  <div key={idx} className="chip">
                    {member}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="glass-card p-2">
        <div className="tabbar">
          {[
            { id: 'inicio', label: 'Inicio', icon: '🏠' },
            { id: 'integrantes', label: 'Integrantes', icon: '👥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de Inicio */}
      {activeTab === 'inicio' && (
        <div className="space-y-4">
          {/* Botón de edición para admins y delegados */}
          {(role === 'admin' || role === 'delegado') && (
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isEditMode 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isEditMode ? '✅ Guardar cambios' : '✏️ Editar página'}
              </button>
            </div>
          )}
          
          {/* Mostrar editor o página según el modo */}
          <div className="post-card p-6">
            {isEditMode && (role === 'admin' || role === 'delegado') ? (
              <GroupHomeEditor 
                groupId={groupId} 
                currentUser={user}
                isEditMode={isEditMode}
                onToggleEdit={() => setIsEditMode(!isEditMode)}
                groupTopic={currentGroup?.topic || ''} 
              />
            ) : (
              <GroupHomePage 
                groupId={groupId} 
                groupTopic={currentGroup?.topic || ''} 
                currentUser={user}
              />
            )}
          </div>
        </div>
      )}

      {/* Panel de Integrantes */}
      {activeTab === 'integrantes' && (
        <div className="space-y-6">
          {/* Panel de gestión para Admin/Delegado */}
          {canManage ? (
            <div className="post-card p-6">
              <h3 className="text-xl font-bold text-token mb-4 flex items-center">
                <span className="text-2xl mr-3">⚙️</span>
                Gestión de Estudiantes
              </h3>
              
              <StudentManager groupId={groupId.toString()} currentUser={{ ...user, role }} />
            </div>
          ) : (
            /* Solo vista de trabajos para estudiantes */
            <div className="post-card p-6">
              <StudentsViewer groupId={groupId.toString()} currentUser={{ ...user, role }} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}