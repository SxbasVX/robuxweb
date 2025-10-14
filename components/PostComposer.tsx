'use client';
import { useState, memo } from 'react';
import { createPost } from '../lib/data';
import { uploadFilesForPost } from '../lib/storage';
import { useAuth } from '../lib/auth-context';
import { getSupabase } from '../lib/supabaseClient';
import { useRateLimit } from '../lib/rateLimit';
import auditLogger from '../lib/auditLogger';
import RichTextEditor from './RichTextEditor';

const PostComposer = memo(function PostComposer({ groupId, onPostCreated }: { groupId: number, onPostCreated?: () => void }) {
  const { user, role, group } = useAuth();
  const { checkLimit, getRemaining } = useRateLimit('posts');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [mediaType, setMediaType] = useState<'files' | 'youtube' | 'mixed'>('files');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [remainingPosts, setRemainingPosts] = useState(getRemaining());

  const canPost = !!user && (role === 'admin' || (role === 'delegado' && group === groupId));

  // Función para generar un nombre de autor apropiado
  const getAuthorName = () => {
    if (!user) return undefined;
    
    // Si es admin, usar "Administrador" o "Admin"
    if (role === 'admin') {
      return 'Administrador';
    }
    
    // Si es delegado, usar "Delegado" + grupo
    if (role === 'delegado') {
      return `Delegado Grupo ${group}`;
    }
    
    // Para otros usuarios, usar displayName o parte del email
    return user.displayName || user.email?.split('@')[0] || undefined;
  };

  // Función para extraer el ID de YouTube
  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!canPost) return setError('No tienes acceso a esta función.');
    if (!subject.trim() || !text.trim()) return;
    
    // Verificar rate limiting
    const rateLimitCheck = checkLimit();
    if (!rateLimitCheck.allowed) {
      const retryMinutes = Math.ceil((rateLimitCheck.retryAfter || 0) / 60);
      setError(`Has alcanzado el límite de publicaciones. Intenta de nuevo en ${retryMinutes} minutos.`);
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      // Preparar datos adicionales para el post
      let youtubeId = null;
      if (youtubeUrl.trim()) {
        youtubeId = extractYouTubeId(youtubeUrl.trim());
        if (!youtubeId) {
          setError('URL de YouTube inválida');
          setLoading(false);
          return;
        }
      }

      // Crear post usando la función normal
      const postId = await createPost(groupId, {
        autor: user!.id,
        autorNombre: getAuthorName(),
        rol: role!,
        grupo: groupId as 1 | 2 | 3 | 4 | 5,
        titulo: subject.trim(),
        contenido: text.trim(),
        archivos: [],
        youtube_url: youtubeUrl.trim() || undefined,
        status
      });

      // Log de auditoría
      const logger = auditLogger.getInstance();
      logger.setUser(user);
      logger.log(
        status === 'published' ? 'post_created' : 'post_created',
        'info',
        {
          groupId,
          postId,
          title: subject.trim(),
          hasFiles: files && files.length > 0,
          hasYoutube: !!youtubeUrl.trim(),
          status
        }
      );

      // Si hay archivos, subirlos después de crear el post
      if (files && files.length > 0) {
        const uploadedUrls = await uploadFilesForPost(groupId, postId, Array.from(files));
        
        // Actualizar el post con las URLs de los archivos
        const supabase = getSupabase();
        const { error: updateError } = await supabase
          .from('posts')
          .update({ archivos: uploadedUrls })
          .eq('id', postId);
        
        if (updateError) {
          console.error('Error actualizando post:', updateError);
          setError('Error actualizando el post con archivos');
          setLoading(false);
          return;
        }

        // Log de archivos subidos
        const logger = auditLogger.getInstance();
        logger.log('file_uploaded', 'info', {
          fileCount: files.length,
          postId,
          groupId
        });
      }
      
      setSuccess(true);
      setSubject('');
      setText('');
      setFiles(null);
      setYoutubeUrl('');
      
      // Actualizar contador de posts restantes
      setRemainingPosts(getRemaining());
      
      setTimeout(() => setSuccess(false), 3000);
      
      // Forzar refresh de la página después de crear el post
      if (onPostCreated) {
        onPostCreated();
        
        // Pequeño delay adicional para asegurar que se actualice
        setTimeout(() => {
          onPostCreated();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      setError('Error al crear el post');
      
      // Log de error
      const logger = auditLogger.getInstance();
      logger.log('post_created', 'error', {
        groupId,
        title: subject.trim(),
        status,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canPost) {
    return (
      <div className="glass p-6 rounded-2xl border border-red-500/20 animate-fade-in">
        <p className="text-red-300 text-center">
          Solo los administradores y delegados pueden crear posts en este grupo.
        </p>
      </div>
    );
  }

  return (
    <form 
      className="glass p-6 rounded-2xl space-y-4 animate-slide-up gpu-accelerated"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="text"
        placeholder="Título del post..."
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
        style={{ animationDelay: '0.1s' }}
      />
      <div 
        className="animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        <RichTextEditor value={text} onChange={setText} />
      </div>
      
      {/* Selector de tipo de contenido */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex rounded-xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMediaType('files')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mediaType === 'files' 
                ? 'bg-pink-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📁 Archivos/Fotos
          </button>
          <button
            type="button"
            onClick={() => setMediaType('youtube')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mediaType === 'youtube' 
                ? 'bg-pink-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎥 YouTube
          </button>
          <button
            type="button"
            onClick={() => setMediaType('mixed')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mediaType === 'mixed' 
                ? 'bg-pink-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📚 Mixto
          </button>
        </div>

        {/* Contenido según el tipo seleccionado */}
        {(mediaType === 'files' || mediaType === 'mixed') && (
          <input 
            type="file" 
            multiple 
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            onChange={(e) => setFiles(e.target.files)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 transition-all duration-300"
            title="Sube PDFs, imágenes (JPG, PNG, GIF, WebP)"
          />
        )}

        {(mediaType === 'youtube' || mediaType === 'mixed') && (
          <input
            type="url"
            placeholder="URL de YouTube (ej: https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
          />
        )}
      </div>
      <div className="flex gap-3">
        <button 
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={loading || !subject.trim() || !text.trim()}
          className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Guardando...
            </span>
          ) : (
            'Guardar Borrador'
          )}
        </button>
        <button 
          type="button"
          onClick={() => handleSubmit('published')}
          disabled={loading || !subject.trim() || !text.trim()}
          className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          Publicar Post
        </button>
      </div>
      
      {error && (
        <p 
          className="text-red-400 text-sm animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          {error}
        </p>
      )}
      
      {success && (
        <p 
          className="text-green-400 text-sm animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          ¡Post creado exitosamente!
        </p>
      )}
      
      {/* Indicador de Rate Limiting */}
      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 animate-fade-in">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-300">📊 Posts restantes esta hora:</span>
          <span className="text-blue-200 font-bold">{remainingPosts}</span>
        </div>
        {remainingPosts <= 3 && (
          <div className="text-yellow-300 text-xs mt-2">
            ⚠️ Acercándote al límite de publicaciones por hora
          </div>
        )}
      </div>
    </form>
  );
});

export default PostComposer;