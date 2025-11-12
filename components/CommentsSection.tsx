'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import CommentBox from './CommentBox';
import { useAuth } from '../lib/auth-context';

interface Comment {
  id: string;
  contenido: string;
  autorNombre?: string;
  fecha: number;
}

interface CommentsSectionProps {
  itemId: string;
  itemType: 'essay' | 'video' | 'evidencia';
  studentId: string;
  groupId: string;
}

export default function CommentsSection({ itemId, itemType, studentId, groupId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const { user, role } = useAuth();

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, itemId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      // Crear un ID único para el "post" basado en el item
      const postId = `${itemType}_${itemId}`;
      
      const { data, error } = await supabase
        .from('student_comments')
        .select('*')
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .eq('student_id', studentId)
        .order('fecha', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (text: string, authorName?: string) => {
    try {
      const supabase = getSupabase();
      
      // Si el usuario es anónimo (ID empieza con 'anon-' o 'anon_') o no hay usuario, usar null
      const autorId = user?.id && !user.id.startsWith('anon-') && !user.id.startsWith('anon_') ? user.id : null;
      
      const newComment = {
        item_id: itemId,
        item_type: itemType,
        student_id: studentId,
        group_id: parseInt(groupId),
        autor: autorId,
        contenido: text,
        autorNombre: authorName || null,
        fecha: Date.now()
      };

      const { data, error } = await supabase
        .from('student_comments')
        .insert([newComment])
        .select()
        .single();

      if (error) throw error;

      // Agregar el comentario al estado local
      setComments(prev => [...prev, data]);
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      alert('❌ Error al enviar el comentario: ' + (error?.message || 'Error desconocido'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    try {
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('student_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Eliminar el comentario del estado local
      setComments(prev => prev.filter(c => c.id !== commentId));
      alert('✅ Comentario eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert('❌ Error al eliminar el comentario: ' + (error?.message || 'Error desconocido'));
    }
  };

  return (
    <div className="mt-4 border-t border-gray-600/30 pt-4">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors mb-3"
      >
        <span>{showComments ? '▼' : '▶'}</span>
        <span>💬 Comentarios ({comments.length})</span>
      </button>

      {showComments && (
        <div className="space-y-4">
          {/* Lista de comentarios */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="bg-white/5 rounded-lg p-3 border border-white/10 relative group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {comment.autorNombre 
                          ? comment.autorNombre.charAt(0).toUpperCase()
                          : '👤'
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {comment.autorNombre || 'Anónimo'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(comment.fecha).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Botón de eliminar (solo para admins) */}
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10"
                        title="Eliminar comentario"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.contenido}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </p>
          )}

          {/* Formulario para nuevo comentario - Todos pueden comentar */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <CommentBox
              onSubmit={handleSubmitComment}
              placeholder="Escribe tu comentario..."
              allowAnonymous={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
