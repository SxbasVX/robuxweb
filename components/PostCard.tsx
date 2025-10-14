'use client';
import { memo, useEffect, useMemo, useState } from 'react';
import FilePreview from './FilePreview';
import EmojiReactions from './EmojiReactions';
import UserAvatar from './UserAvatar';
import { formatDate } from '../lib/utils';
import { getRoleDisplayName } from '../lib/gamertag';
import type { Post, Emoji } from '../lib/types';
import DOMPurify from 'dompurify';
import { getSupabase } from '../lib/supabaseClient';

// Caché simple en memoria para mapear id -> nombre visible
const authorNameCache: Record<string, string> = {};

const PostCard = memo(function PostCard({ post, onReact, canPublish, onPublish, canDelete, onDelete, currentUserId, currentUserRole }: {
  post: Post;
  onReact: (emoji: Emoji) => void;
  canPublish?: boolean;
  onPublish?: () => Promise<void> | void;
  canDelete?: boolean;
  onDelete?: () => Promise<void> | void;
  currentUserId?: string;
  currentUserRole?: string;
}) {
  const canDeletePost = canDelete || currentUserRole === 'admin' || post.autor === currentUserId;

  const [authorName, setAuthorName] = useState<string | undefined>(post.autorNombre);

  // Resolver nombre del autor si falta (para posts antiguos)
  useEffect(() => {
    let cancelled = false;
    if (authorName || !post.autor) return;

    const cached = authorNameCache[post.autor];
    if (cached) { setAuthorName(cached); return; }

    const load = async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('id', post.autor)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        const name = data?.email ? (data.email as string).split('@')[0] : undefined;
        const finalName = name || post.autor; // fallback al id si no hay email
        if (!cancelled) {
          authorNameCache[post.autor] = finalName;
          setAuthorName(finalName);
        }
      } catch {
        if (!cancelled) setAuthorName(post.autor);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authorName, post.autor]);
  return (
    <article className="post-card space-y-4 transition-all duration-300 animate-fade-in-up">
      <header className="post-header flex items-center justify-between">
        <div className="flex items-start gap-3">
          <UserAvatar 
            user={{ 
              id: post.autor, 
              displayName: post.autorNombre || post.autor,
              email: post.autor.includes('@') ? post.autor : undefined 
            }} 
            role={post.rol} 
            size="md" 
            showRole={true}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-token">{authorName || post.autor}</span>
              {post.rol === 'admin' && (
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-200 dark:border-purple-700">
                  👑 {getRoleDisplayName(post.rol)}
                </span>
              )}
              {post.rol === 'delegado' && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-200 dark:border-blue-700">
                  🎯 {getRoleDisplayName(post.rol)}
                </span>
              )}
            </div>
            <time className="text-xs muted-token">{formatDate(post.fechaCreacion)}</time>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.status && post.status !== 'published' && (
            <>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                post.status === 'draft' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' 
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
              }`}>
                {post.status === 'draft' ? 'Borrador' : 'Publicado'}
              </span>
              {canPublish && post.status === 'draft' && onPublish && (
                <button
                  onClick={onPublish}
                  className="btn-primary text-xs px-3 py-1"
                >
                  Publicar
                </button>
              )}
            </>
          )}
          {canDeletePost && onDelete && (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
                  onDelete();
                }
              }}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs"
              title="Eliminar publicación"
            >
              🗑️
            </button>
          )}
        </div>
      </header>

  <main className="space-y-4">
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-token">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold">{authorName || post.autor}</span>
              <span className="muted-token">→</span>
              <span className="font-medium" style={{color:'var(--chip-text)'}}>Grupo {post.grupo}</span>
            </div>
            <div className="space-y-3">
              {post.titulo && (
                <div className="font-semibold text-xl text-token">
                  {post.titulo}
                </div>
              )}
              <div className="post-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.contenido) }} />
              <div className="flex items-center gap-2 text-xs muted-token">
                <span>👀 0 vistas</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {post.archivos && post.archivos.length > 0 && (
        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: '0.3s' }}>
          {post.archivos.map((url, index) => (
            <FilePreview key={index} url={url} />
          ))}
        </div>
      )}

      {post.youtube_url && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="rounded-xl p-4 border" style={{background:'rgba(255,255,255,0.06)', borderColor:'var(--card-border)'}}>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${post.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1] || ''}`}
                title="Video de YouTube"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm muted-token">
              <span>🎥</span>
              <span>Video de YouTube</span>
            </div>
          </div>
        </div>
      )}

      {/* Pie de página con reacciones */}
      <footer className="pt-4 border-t" style={{borderColor:'var(--card-border)'}}>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <EmojiReactions 
            counts={post.reacciones} 
            onReact={onReact}
          />
        </div>
      </footer>
    </article>
  );
});

export default PostCard;