'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import UserAvatar from './UserAvatar';
import PdfViewer from './PdfViewer';
import EmojiReactions from './EmojiReactions';

interface Student {
  id: string;
  email: string;
  role: string;
  group: string;
  full_name?: string;
}

interface Essay {
  id: string;
  title: string;
  file_url: string;
  uploaded_at: string;
  student_id: string;
  uploaded_by: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  files: string[];
  youtube_url?: string;
  google_drive_url?: string;
  reactions: any;
}

interface StudentProfileProps {
  student: Student;
  currentUser: any;
  groupId: string;
  isDelegadoView: boolean;
}

export function StudentProfile({ student, currentUser, groupId, isDelegadoView }: StudentProfileProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'essays'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEssayTitle, setNewEssayTitle] = useState('');
  const [uploadingEssay, setUploadingEssay] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, [student.id]);

  const loadStudentData = async () => {
    try {
      const supabase = getSupabase();
      // Cargar posts del estudiante
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', student.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      setPosts(postsData || []);

      // Cargar ensayos del estudiante (si existe la tabla)
      try {
        const { data: essaysData } = await supabase
          .from('student_essays')
          .select('*')
          .eq('student_id', student.id)
          .order('uploaded_at', { ascending: false });

        setEssays(essaysData || []);
      } catch (error) {
        console.log('Essays table not found, skipping...');
      }

    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEssayUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !newEssayTitle.trim()) return;

    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }

    setUploadingEssay(true);

    try {
      const supabase = getSupabase();
      // Subir archivo a Supabase Storage
      const fileName = `essays/${student.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ensayos')  // Cambiado de 'files' a 'ensayos'
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('ensayos')  // Cambiado de 'files' a 'ensayos'
        .getPublicUrl(fileName);

      // Guardar en base de datos
      const { error: dbError } = await supabase
        .from('student_essays')
        .insert({
          title: newEssayTitle.trim(),
          file_url: publicUrl,
          student_id: student.id,
          uploaded_by: currentUser.id,
          group_id: groupId
        });

      if (dbError) throw dbError;

      setNewEssayTitle('');
      loadStudentData();
      alert('Ensayo subido exitosamente');

    } catch (error) {
      console.error('Error uploading essay:', error);
      alert('Error al subir el ensayo');
    } finally {
      setUploadingEssay(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-4 mb-4">
          <UserAvatar 
            user={{ 
              id: student.id, 
              displayName: student.full_name,
              email: student.email 
            }} 
            size="xl" 
          />
          <div>
            <h2 className="text-2xl font-bold text-white">
              {student.full_name || student.email.split('@')[0]}
            </h2>
            <p className="text-gray-300">{student.email}</p>
            <span className="inline-block px-2 py-1 bg-green-600/20 text-green-400 rounded text-sm">
              👤 Estudiante
            </span>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{posts.length}</div>
            <div className="text-gray-400 text-sm">Publicaciones</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{posts.filter(p => p.youtube_url || p.google_drive_url).length}</div>
            <div className="text-gray-400 text-sm">Videos</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{essays.length}</div>
            <div className="text-gray-400 text-sm">Ensayos</div>
          </div>
        </div>
      </div>

      {/* Upload Essay (solo para delegados) */}
      {isDelegadoView && (
        <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-white mb-4">📄 Subir Ensayo</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Título del ensayo..."
              value={newEssayTitle}
              onChange={(e) => setNewEssayTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
            <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer flex items-center gap-2">
              {uploadingEssay ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  📁 Seleccionar PDF
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleEssayUpload}
                    className="hidden"
                    disabled={!newEssayTitle.trim() || uploadingEssay}
                  />
                </>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="flex border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-3 text-center transition-colors ${
              activeTab === 'posts'
                ? 'bg-purple-600/30 text-purple-300 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            📝 Publicaciones ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 px-6 py-3 text-center transition-colors ${
              activeTab === 'videos'
                ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            🎥 Videos ({posts.filter(p => p.youtube_url || p.google_drive_url).length})
          </button>
          <button
            onClick={() => setActiveTab('essays')}
            className={`flex-1 px-6 py-3 text-center transition-colors ${
              activeTab === 'essays'
                ? 'bg-green-600/30 text-green-300 border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            📄 Ensayos ({essays.length})
          </button>
        </div>

        <div className="p-6">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">📝</div>
                  <p className="text-gray-400">No hay publicaciones aún.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-start gap-3">
                      <UserAvatar 
                        user={{ 
                          id: post.user_id, 
                          displayName: student.full_name,
                          email: student.email 
                        }} 
                        size="sm" 
                      />
                      <div className="flex-1">
                        <p className="text-white mb-2">{post.content}</p>
                        <div className="text-sm text-gray-400 mb-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                        
                        {/* Files */}
                        {post.files && post.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {post.files.map((file, index) => (
                              <a
                                key={index}
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm underline"
                              >
                                📎 Archivo {index + 1}
                              </a>
                            ))}
                          </div>
                        )}

                        <EmojiReactions 
                          counts={post.reactions || {}}
                          onReact={(emoji) => console.log('Reacted:', emoji)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              {posts.filter(p => p.youtube_url || p.google_drive_url).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">🎥</div>
                  <p className="text-gray-400">No hay videos compartidos aún.</p>
                </div>
              ) : (
                posts.filter(p => p.youtube_url || p.google_drive_url).map((post) => (
                  <div key={post.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-start gap-3">
                      <UserAvatar 
                        user={{ 
                          id: post.user_id, 
                          displayName: student.full_name,
                          email: student.email 
                        }} 
                        size="sm" 
                      />
                      <div className="flex-1">
                        <p className="text-white mb-2">{post.content}</p>
                        
                        {/* YouTube Video */}
                        {post.youtube_url && (
                          <div className="mb-3">
                            {(() => {
                              const videoId = getYouTubeVideoId(post.youtube_url);
                              return videoId ? (
                                <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="YouTube video"
                                    className="w-full h-full"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <a
                                  href={post.youtube_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-400 hover:text-red-300 underline"
                                >
                                  🎥 Ver en YouTube
                                </a>
                              );
                            })()}
                          </div>
                        )}

                        {/* Google Drive Link */}
                        {post.google_drive_url && (
                          <div className="mb-3">
                            <a
                              href={post.google_drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 underline"
                            >
                              💾 Ver en Google Drive
                            </a>
                          </div>
                        )}

                        <div className="text-sm text-gray-400 mb-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>

                        <EmojiReactions 
                          counts={post.reactions || {}}
                          onReact={(emoji) => console.log('Reacted:', emoji)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Essays Tab */}
          {activeTab === 'essays' && (
            <div className="space-y-4">
              {essays.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">📄</div>
                  <p className="text-gray-400">No hay ensayos subidos aún.</p>
                  {isDelegadoView && (
                    <p className="text-gray-500 text-sm mt-2">
                      Usa el formulario de arriba para subir ensayos.
                    </p>
                  )}
                </div>
              ) : (
                essays.map((essay) => (
                  <div key={essay.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600/30">
                    <div className="mb-4">
                      <h4 className="text-white font-medium mb-2">{essay.title}</h4>
                      <p className="text-gray-400 text-sm">
                        Subido el {new Date(essay.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <PdfViewer 
                      url={essay.file_url}
                      title={essay.title}
                      studentName={student.full_name || student.email.split('@')[0]}
                      className="h-96"
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}