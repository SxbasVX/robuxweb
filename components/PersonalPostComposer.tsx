'use client';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor';

interface PersonalPostComposerProps {
  onSubmit: (content: string, mediaFiles: Array<{
    type: 'image' | 'video' | 'pdf' | 'youtube' | 'drive';
    url: string;
    name: string;
  }>) => void;
  placeholder?: string;
}

export default function PersonalPostComposer({ onSubmit, placeholder = "Comparte tus ideas..." }: PersonalPostComposerProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [mediaType, setMediaType] = useState<'files' | 'youtube' | 'drive' | 'mixed'>('files');
  const [loading, setLoading] = useState(false);

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isValidDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const handleSubmit = async () => {
    if (!content.trim() && !files?.length && !youtubeUrl && !driveUrl) return;

    setLoading(true);
    const mediaFiles: Array<{
      type: 'image' | 'video' | 'pdf' | 'youtube' | 'drive';
      url: string;
      name: string;
    }> = [];

    try {
      // Procesar archivos subidos
      if (files?.length) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const reader = new FileReader();
          const result = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });

          let fileType: 'image' | 'video' | 'pdf' = 'image';
          if (file.type.startsWith('video/')) fileType = 'video';
          else if (file.type === 'application/pdf') fileType = 'pdf';

          mediaFiles.push({
            type: fileType,
            url: result,
            name: file.name
          });
        }
      }

      // Procesar YouTube
      if (youtubeUrl) {
        const videoId = extractYouTubeId(youtubeUrl);
        if (videoId) {
          mediaFiles.push({
            type: 'youtube',
            url: youtubeUrl,
            name: `Video de YouTube (${videoId})`
          });
        }
      }

      // Procesar Google Drive
      if (driveUrl && isValidDriveUrl(driveUrl)) {
        mediaFiles.push({
          type: 'drive',
          url: driveUrl,
          name: 'Archivo de Google Drive'
        });
      }

      onSubmit(content, mediaFiles);

      // Limpiar formulario
      setContent('');
      setFiles(null);
      setYoutubeUrl('');
      setDriveUrl('');
      setMediaType('files');

      // Reset file input
      const fileInput = document.getElementById('personal-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error al crear post personal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor de contenido */}
      <RichTextEditor
        value={content}
        onChange={setContent}
      />

      {/* Selector de tipo de media */}
      <div className="flex space-x-2">
        <button
          onClick={() => setMediaType('files')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            mediaType === 'files' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          📁 Archivos
        </button>
        <button
          onClick={() => setMediaType('youtube')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            mediaType === 'youtube' 
              ? 'bg-red-600 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          📹 YouTube
        </button>
        <button
          onClick={() => setMediaType('drive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            mediaType === 'drive' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          💾 Google Drive
        </button>
        <button
          onClick={() => setMediaType('mixed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            mediaType === 'mixed' 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          🎭 Mixto
        </button>
      </div>

      {/* Contenido según tipo de media */}
      {(mediaType === 'files' || mediaType === 'mixed') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subir Archivos
          </label>
          <input
            id="personal-file-input"
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={(e) => setFiles(e.target.files)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {files && files.length > 0 && (
            <div className="mt-2 text-sm text-gray-400">
              {files.length} archivo(s) seleccionado(s)
            </div>
          )}
        </div>
      )}

      {(mediaType === 'youtube' || mediaType === 'mixed') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL de YouTube
          </label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      )}

      {(mediaType === 'drive' || mediaType === 'mixed') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL de Google Drive
          </label>
          <input
            type="url"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Botón de envío */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !files?.length && !youtubeUrl && !driveUrl)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Publicando...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span>📝</span>
              <span>Publicar Post Personal</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}