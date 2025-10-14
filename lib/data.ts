import { getSupabase } from './supabaseClient';
import type { Comment, Emoji, Post } from './types';
import { dataCache } from './performance-utils';

export async function fetchPosts(groupId: number) {
  const cacheKey = `posts_${groupId}`;
  
  // Intentar obtener del cache primero
  const cached = dataCache.get<Post[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('grupo', groupId)
    .order('fechaCreacion', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  
  const posts = (data ?? []) as Post[];
  
  // Guardar en cache por 2 minutos
  dataCache.set(cacheKey, posts, 2 * 60 * 1000);
  
  return posts;
}

export function subscribePosts(groupId: number, cb: (posts: Post[]) => void) {
  // Realtime on table 'posts' filtered by grupo
  const supabase = getSupabase();
  const cacheKey = `posts_${groupId}`;
  
  const channel = supabase
    .channel(`posts-grupo-${groupId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'posts', 
      filter: `grupo=eq.${groupId}` 
    }, async () => {
      // Invalidar cache al recibir cambios
      dataCache.invalidate(`posts_${groupId}`);
      const posts = await fetchPosts(groupId);
      cb(posts);
    })
    .subscribe();
    
  // Carga inicial - verificar cache primero
  const cachedPosts = dataCache.get<Post[]>(cacheKey);
  if (cachedPosts) {
    // Usar cache pero aún cargar datos frescos en background
    cb(cachedPosts);
    fetchPosts(groupId).then(cb).catch(console.error);
  } else {
    // No hay cache, cargar normalmente
    fetchPosts(groupId).then(cb).catch(console.error);
  }
  
  return () => { supabase.removeChannel(channel); };
}

export async function fetchComments(groupId: number, postId: string) {
  const supabase = getSupabase();
  
  console.log(`Obteniendo comentarios para grupo ${groupId}, post ${postId}`);
  
  // Obtener todos los comentarios del grupo
  const { data, error } = await supabase
    .from('comentarios')
    .select('*')
    .eq('grupo', groupId)
    .order('fecha', { ascending: true });
    
  if (error) {
    console.error('Error obteniendo comentarios:', error);
    throw error;
  }
  
  // Filtrar comentarios por postId y limpiar el contenido
  const commentsForPost = (data || [])
    .filter(comment => comment.contenido.includes(`|||POST_ID:${postId}`))
    .map(comment => ({
      ...comment,
      contenido: comment.contenido.split('|||POST_ID:')[0] // Limpiar metadata
    })) as Comment[];
    
  console.log(`Comentarios encontrados para post ${postId}:`, commentsForPost.length);
  
  return commentsForPost;
}

export function subscribeComments(groupId: number, postId: string, cb: (comments: Comment[]) => void) {
  const supabase = getSupabase();
  
  console.log(`Suscribiéndose a comentarios para grupo ${groupId}, post ${postId}`);
  
  // Obtener comentarios iniciales
  fetchComments(groupId, postId).then(cb).catch(console.error);
  
  // Suscripción a cambios en la tabla comentarios del grupo
  const channel = supabase
    .channel(`comments-${groupId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'comentarios',
      filter: `grupo=eq.${groupId}`
    }, async () => {
      console.log('Cambio detectado en comentarios del grupo', groupId);
      try {
        const comments = await fetchComments(groupId, postId);
        cb(comments);
      } catch (error) {
        console.error('Error al obtener comentarios actualizados:', error);
      }
    })
    .subscribe((status) => {
      console.log('Estado de suscripción de comentarios:', status);
    });
    
  return () => { 
    console.log('Cancelando suscripción de comentarios');
    supabase.removeChannel(channel); 
  };
}

export async function createPost(groupId: number, data: Omit<Post, 'id' | 'fechaCreacion' | 'reacciones'>) {
  const supabase = getSupabase();
  
  // Usar nueva función RPC que soporta YouTube
  const { data: postId, error } = await supabase.rpc('create_post_with_media', {
    p_autor: data.autor,
    p_rol: data.rol,
    p_grupo: groupId,
    p_titulo: data.titulo || '',
    p_contenido: data.contenido,
    p_autor_nombre: data.autorNombre || null,
    p_status: data.status || 'published',
    p_youtube_url: data.youtube_url || null
  });
  
  if (error) {
    console.error('Error creating post via RPC:', error);
    throw error;
  }
  
  return postId;
}

export async function deletePost(groupId: number, postId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('posts').delete().eq('id', postId).eq('grupo', groupId);
  if (error) throw error;
}

export async function addComment(groupId: number, postId: string, data: Omit<Comment, 'id' | 'reacciones'>) {
  console.log('Insertando comentario via API:', { groupId, postId, autor: data.autor });
  
  try {
    // Usar nuestra API personalizada para evitar problemas de RLS
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupId,
        postId,
        autor: data.autor,
        contenido: data.contenido,
        autorNombre: data.autorNombre
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error al insertar comentario');
    }
    
    console.log('Comentario insertado exitosamente via API:', result.id);
    return result.id;
    
  } catch (err) {
    console.error('Error en addComment:', err);
    throw err;
  }
}

export async function reactTo(target: 'post' | 'comment', groupId: number, postId: string, emoji: Emoji, commentId?: string) {
  const table = target === 'post' ? 'posts' : 'comentarios';
  const idVal = target === 'post' ? postId : commentId!;
  
  // Usar la nueva función que previene spam y devuelve las reacciones actualizadas
  const supabase = getSupabase();
  const { data: updatedReactions, error } = await supabase.rpc('smart_increment_reaction', {
    p_table: table,
    p_id: idVal,
    p_emoji: emoji,
    p_ip_address: null // Se puede añadir detección de IP si es necesario
  });
  
  if (error) throw error;
  
  return updatedReactions as Record<string, number>;
}
