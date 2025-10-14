'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import UserAvatar from './UserAvatar';

interface Student {
  id: string;
  email: string;
  role: string;
  group: string;
  full_name?: string;
}

interface StudentWork {
  ensayos: Array<{
    id: string;
    title: string;
    file_url: string;
    uploaded_at: string;
    description?: string;
  }>;
  videos: Array<{
    id: string;
    title: string;
    description?: string;
    url: string;
    embedUrl: string;
    type: 'youtube' | 'drive';
    uploaded_at: string;
  }>;
  evidencias: Array<{
    id: string;
    title: string;
    description?: string;
    file_url: string;
    type: 'image' | 'pdf' | 'document';
    uploaded_at: string;
  }>;
}

interface StudentsViewerProps {
  groupId: string;
  currentUser: any;
}

export function StudentsViewer({ groupId, currentUser }: StudentsViewerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentWork, setStudentWork] = useState<StudentWork>({
    ensayos: [],
    videos: [],
    evidencias: []
  });
  const [activeSection, setActiveSection] = useState<'ensayos' | 'videos' | 'evidencias'>('ensayos');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fetchedCount, setFetchedCount] = useState<number | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, [groupId]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentWork(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const supabase = getSupabase();
      console.log('[StudentsViewer] groupId:', groupId, 'parseInt:', parseInt(groupId));
      // Usar la nueva tabla estudiantes (pedimos count también)
      const { data, error, count } = await supabase
        .from('estudiantes')
        .select('id, codigo, nombre_completo, email, grupo', { count: 'exact' })
        .eq('grupo', parseInt(groupId))
        .order('nombre_completo', { ascending: true });
      console.log('[StudentsViewer] estudiantes data:', data, 'error:', error, 'count:', count);
      setFetchedCount(typeof count === 'number' ? count : (data?.length || 0));
      setRawResponse(data || null);

      if (error) {
        setErrorMsg('Error loading students: ' + error.message);
        console.error('Error loading students:', error);
        // Fallback a tabla users si estudiantes no existe
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('group', parseInt(groupId))
          .eq('role', 'usuario')
          .order('email');

        if (usersError) {
          setErrorMsg('Error loading users fallback: ' + usersError.message);
          console.error('Error loading users fallback:', usersError);
          setStudents([]);
          return;
        }

        // Convertir formato users a estudiantes
        const convertedStudents = usersData?.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          group: user.group?.toString() || groupId,
          full_name: user.full_name || user.email
        })) || [];
        setStudents(convertedStudents);
        return;
      }

      // Convertir formato estudiantes a Student interface
      const convertedStudents = data?.map(estudiante => ({
        id: estudiante.id,
        email: estudiante.email,
        role: 'usuario',
        group: estudiante.grupo?.toString() || groupId,
        full_name: estudiante.nombre_completo
      })) || [];

      setStudents(convertedStudents);
      setErrorMsg(null);
    } catch (error: any) {
      setErrorMsg('Error loading students: ' + (error?.message || error));
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentWork = async (studentId: string) => {
    try {
      const supabase = getSupabase();
      
      // Cargar ensayos
      const { data: ensayos, error: ensayosError } = await supabase
        .from('student_essays')
        .select('id, title, file_url, uploaded_at, description')
        .eq('student_id', studentId);

      if (ensayosError) {
        console.error('Error cargando ensayos:', ensayosError);
      }

      // Cargar posts del estudiante (videos, evidencias)
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, titulo, contenido, archivos, youtube_url, google_drive_url, fechaCreacion')
        .eq('autor', studentId);

      if (postsError) {
        console.error('Error cargando posts:', postsError);
      }

      // Procesar videos
      const videos = posts?.filter(p => 
        (p.youtube_url && p.youtube_url.trim() !== '') || 
        (p.google_drive_url && p.google_drive_url.trim() !== '')
      ).map(p => {
        const isYouTube = p.youtube_url && p.youtube_url.trim() !== '';
        const originalUrl = isYouTube ? p.youtube_url : p.google_drive_url;
        
        let embedUrl = originalUrl;
        if (!isYouTube && p.google_drive_url) {
          const fileIdMatch = p.google_drive_url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (fileIdMatch) {
            embedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
          }
        }
        
        return {
          id: String(p.id),
          title: p.titulo || 'Video sin título',
          description: p.contenido || '',
          url: String(originalUrl),
          embedUrl: String(embedUrl),
          type: isYouTube ? "youtube" as const : "drive" as const,
          uploaded_at: String(p.fechaCreacion)
        };
      }) || [];

      // Procesar evidencias
      const evidencias = posts?.filter(p => p.archivos && Array.isArray(p.archivos) && p.archivos.length > 0)
        .flatMap(p => 
          p.archivos.map((archivo: string, index: number) => ({
            id: `${p.id}_${index}`,
            title: p.titulo || `Evidencia ${index + 1}`,
            description: p.contenido || '',
            file_url: archivo,
            type: archivo.toLowerCase().includes('.pdf') ? 'pdf' as const : 'image' as const,
            uploaded_at: p.fechaCreacion
          }))
        ) || [];

      setStudentWork({
        ensayos: ensayos || [],
        videos,
        evidencias
      });
    } catch (error) {
      console.error('Error loading student work:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Vista de lista de estudiantes
  if (!selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            👥 Integrantes del Grupo {groupId}
          </h2>
          <p className="text-purple-200 mb-4">
            Explora los trabajos y proyectos de tus compañeros de grupo
          </p>
          <div className="text-xs text-gray-300">Fetched: {fetchedCount ?? '-'} rows</div>
          {rawResponse && (
            <details className="text-xs text-gray-400 mt-2 bg-slate-800/40 p-2 rounded">
              <summary className="cursor-pointer">Ver respuesta cruda (debug)</summary>
              <pre className="text-xs whitespace-pre-wrap max-h-48 overflow-auto">{JSON.stringify(rawResponse, null, 2)}</pre>
            </details>
          )}
          {errorMsg && (
            <div className="bg-red-900/40 text-red-300 p-2 rounded mt-2">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">👥</div>
            <div className="text-xl mb-2">No hay estudiantes registrados</div>
            <div className="text-sm">Este grupo aún no tiene miembros</div>
            {errorMsg && (
              <div className="bg-red-900/40 text-red-300 p-2 rounded mt-4">
                <strong>Error:</strong> {errorMsg}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600/30 hover:border-purple-500/50 transition-all duration-200 cursor-pointer hover:bg-slate-700/50"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <UserAvatar
                    user={{
                      id: student.id,
                      displayName: student.full_name || student.email,
                      email: student.email
                    }}
                    size="sm"
                  />
                  <div>
                    <h3 className="text-white font-medium">
                      {student.full_name || student.email}
                    </h3>
                    <p className="text-gray-400 text-sm">Estudiante</p>
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  👁️ Ver trabajos →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de trabajos del estudiante seleccionado
  return (
    <div className="space-y-6">
      {/* Header del estudiante */}
      <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedStudent(null)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              ← Volver
            </button>
            <UserAvatar
              user={{
                id: selectedStudent.id,
                displayName: selectedStudent.full_name || selectedStudent.email,
                email: selectedStudent.email
              }}
              size="md"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {selectedStudent.full_name || selectedStudent.email}
              </h2>
              <p className="text-purple-200">Trabajos y proyectos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por secciones */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg">
        <div className="flex space-x-1 p-1">
          {[
            { id: 'ensayos', label: 'Ensayos', icon: '📄' },
            { id: 'videos', label: 'Videos', icon: '🎥' },
            { id: 'evidencias', label: 'Evidencias', icon: '📁' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {section.id === 'ensayos' ? studentWork.ensayos.length :
                 section.id === 'videos' ? studentWork.videos.length :
                 studentWork.evidencias.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la sección activa */}
      <div className="space-y-4">
        {/* Sección de Ensayos */}
        {activeSection === 'ensayos' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">📄 Ensayos</h3>
            {studentWork.ensayos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                📄 No hay ensayos disponibles
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentWork.ensayos.map((ensayo) => (
                  <div key={ensayo.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600/30">
                    <h4 className="text-white font-medium mb-2">{ensayo.title}</h4>
                    {ensayo.description && (
                      <p className="text-gray-300 text-sm mb-3">{ensayo.description}</p>
                    )}
                    <p className="text-gray-400 text-sm mb-3">
                      📅 {new Date(ensayo.uploaded_at).toLocaleDateString()}
                    </p>
                    <a
                      href={ensayo.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      📖 Ver ensayo →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sección de Videos */}
        {activeSection === 'videos' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">🎥 Videos</h3>
            {studentWork.videos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                🎥 No hay videos disponibles
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentWork.videos.map((video) => (
                  <div key={video.id} className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-600/30">
                    <div className="aspect-video bg-gray-800">
                      {video.type === 'youtube' && video.embedUrl ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${video.embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1] || ''}`}
                          title={video.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : video.type === 'drive' && video.embedUrl ? (
                        <iframe
                          src={video.embedUrl}
                          title={video.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎥</div>
                            <div>Video no disponible</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="text-white font-medium mb-2">{video.title}</h4>
                      {video.description && (
                        <p className="text-gray-300 text-sm mb-2">{video.description}</p>
                      )}
                      <p className="text-gray-400 text-sm mb-3">
                        {video.type === 'youtube' ? '📹 YouTube' : '💾 Google Drive'} • {new Date(video.uploaded_at).toLocaleDateString()}
                      </p>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        {video.type === 'youtube' ? '🔗 Ver en YouTube →' : '🔗 Ver en Drive →'}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sección de Evidencias */}
        {activeSection === 'evidencias' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">📁 Evidencias</h3>
            {studentWork.evidencias.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                📁 No hay evidencias disponibles
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentWork.evidencias.map((evidencia) => (
                  <div key={evidencia.id} className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-600/30">
                    <div className="aspect-square bg-gray-800 flex items-center justify-center">
                      {evidencia.type === 'image' ? (
                        <img
                          src={evidencia.file_url}
                          alt={evidencia.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <div className="text-4xl mb-2">
                            {evidencia.type === 'pdf' ? '📄' : '📋'}
                          </div>
                          <div className="text-sm">{evidencia.type.toUpperCase()}</div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="text-white font-medium mb-2">{evidencia.title}</h4>
                      {evidencia.description && (
                        <p className="text-gray-300 text-sm mb-2">{evidencia.description}</p>
                      )}
                      <p className="text-gray-400 text-sm mb-3">
                        📅 {new Date(evidencia.uploaded_at).toLocaleDateString()}
                      </p>
                      <a
                        href={evidencia.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        📖 Ver evidencia →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}