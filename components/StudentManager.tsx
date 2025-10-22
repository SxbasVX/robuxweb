'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import UserAvatar from './UserAvatar';
import { uploadFiles } from '../lib/storage';

interface Student {
  id: string;
  email: string;
  role: string;
  group: string;
  full_name?: string;
}

interface StudentManagerProps {
  groupId: string;
  currentUser: any;
  isAdminView?: boolean;
}

interface StudentContent {
  ensayos: Array<{
    id: string;
    title: string;
    file_url: string;
    uploaded_at: string;
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

export function StudentManager({ groupId, currentUser, isAdminView = false }: StudentManagerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fetchedCount, setFetchedCount] = useState<number | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeSection, setActiveSection] = useState<'ensayos' | 'videos' | 'evidencias'>('ensayos');
  const [studentContent, setStudentContent] = useState<StudentContent>({
    ensayos: [],
    videos: [],
    evidencias: []
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const academicGroups = [
    { id: 1, members: ['Ana García', 'Luis Martínez', 'Sofia Rodríguez', 'Carlos López'] },
    { id: 2, members: ['María Hernández', 'Diego Morales', 'Elena Vega', 'Roberto Silva'] },
    { id: 3, members: ['Carmen Ruiz', 'Andrés Torres', 'Lucía Jiménez', 'Fernando Castro'] },
    { id: 4, members: ['Patricia Mendoza', 'Javier Santos', 'Isabella Ramos', 'Miguel Ortega'] },
    { id: 5, members: ['Valentina Cruz', 'Sebastián Vargas', 'Camila Delgado', 'Nicolás Pérez'] },
  ];

  useEffect(() => {
    loadStudents();
  }, [groupId]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentContent(selectedStudent.id);
    }
  }, [selectedStudent]);

  const createStudentsForGroup = async () => {
    if (!confirm('¿Crear estudiantes automáticamente para este grupo? Esto agregará los miembros predefinidos del grupo en la tabla estudiantes.')) {
      return;
    }
    const groupData = academicGroups.find(g => g.id === parseInt(groupId));
    if (!groupData) {
      alert('No se encontraron datos para este grupo');
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabase();
      for (let i = 0; i < groupData.members.length; i++) {
        const memberName = groupData.members[i];
        const email = `${memberName.toLowerCase().replace(/\s+/g, '.').replace(/[áéíóú]/g, (match) => {
          const replacements: {[key: string]: string} = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'};
          return replacements[match] || match;
        })}@estudiante.com`;

        // Insertar estudiante en la tabla 'estudiantes'
        const { data, error } = await supabase
          .from('estudiantes')
          .upsert({
            codigo: `AUTO${groupId}${i+1}`,
            nombre_completo: memberName,
            email: email,
            grupo: parseInt(groupId)
          }, {
            onConflict: 'email',
            ignoreDuplicates: false
          })
          .select();

        if (error) throw error;
        console.log('Estudiante creado/actualizado:', data);
      }

      alert(`${groupData.members.length} estudiantes creados exitosamente para el Grupo ${groupId}`);
      loadStudents();
    } catch (error) {
      console.error('Error creando estudiantes:', error);
      alert('Error al crear los estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const supabase = getSupabase();
      const { data, error, count } = await supabase
        .from('estudiantes')
        .select('id, codigo, nombre_completo, email, grupo', { count: 'exact' })
        .eq('grupo', parseInt(groupId))
        .order('nombre_completo', { ascending: true });

      console.log('[StudentManager] estudiantes data:', data, 'error:', error, 'count:', count);
      setFetchedCount(typeof count === 'number' ? count : (data?.length || 0));
      setRawResponse(data || null);

      if (error) {
        setErrorMsg('Error loading students: ' + error.message);
        console.error('Error loading students:', error);
        setStudents([]);
        return;
      }

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

  const loadStudentContent = async (studentId: string) => {
    try {
      const supabase = getSupabase();
      const { data: ensayos } = await supabase
        .from('student_essays')
        .select('id, title, file_url, uploaded_at, file_type')
        .eq('student_id', studentId);

      const { data: posts } = await supabase
        .from('posts')
        .select('id, titulo, contenido, archivos, youtube_url, google_drive_url, fechaCreacion')
        .eq('autor', studentId);

      const videos = posts?.filter(p =>
        (p.youtube_url && p.youtube_url.trim() !== '') ||
        (p.google_drive_url && p.google_drive_url.trim() !== '')
      ).map(p => {
        const isYouTube = !!(p.youtube_url && p.youtube_url.trim() !== '');
        const originalUrl = isYouTube ? p.youtube_url : p.google_drive_url;
        let embedUrl = originalUrl;
        if (!isYouTube && p.google_drive_url) {
          const fileIdMatch = p.google_drive_url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (fileIdMatch) embedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
        return {
          id: String(p.id),
          title: p.titulo || 'Video sin título',
          description: p.contenido || '',
          url: String(originalUrl),
          embedUrl: String(embedUrl),
          type: isYouTube ? 'youtube' as const : 'drive' as const,
          uploaded_at: String(p.fechaCreacion)
        };
      }) || [];

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

      setStudentContent({ ensayos: ensayos || [], videos, evidencias });
    } catch (error) {
      console.error('Error loading student content:', error);
    }
  };

  const handleDeleteEssay = async (essayId: string, fileUrl: string, essayTitle: string) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'delegado')) {
      alert('❌ No tienes permisos para eliminar ensayos');
      return;
    }
    if (!confirm(`¿Estás seguro de que quieres eliminar el ensayo "${essayTitle}"?`)) {
      return;
    }
    try {
      const supabase = getSupabase();
      if (fileUrl.includes('supabase.co/storage')) {
        const urlParts = fileUrl.split('/');
        const pathIndex = urlParts.findIndex(part => part === 'ensayos') + 1;
        const filePath = urlParts.slice(pathIndex).join('/');
        const { error: storageError } = await supabase.storage.from('ensayos').remove([`ensayos/${filePath}`]);
        if (storageError) console.error('Error eliminando archivo:', storageError);
      }
      const { error: dbError } = await supabase.from('student_essays').delete().eq('id', essayId);
      if (dbError) throw dbError;

      if (selectedStudent) {
        setTimeout(() => loadStudentContent(selectedStudent.id), 500);
      }
      alert(`✅ Ensayo "${essayTitle}" eliminado exitosamente`);
    } catch (error: any) {
      console.error('Error eliminando ensayo:', error);
      alert(`❌ Error al eliminar el ensayo: ${error?.message || String(error)}`);
    }
  };

  const handleFileUpload = async (file: File, type: 'ensayos' | 'evidencias') => {
    if (!selectedStudent) return;
    setUploading(true);
    try {
      const supabase = getSupabase();
      if (type === 'ensayos') {
          const uploadedUrls = await uploadFiles(parseInt(groupId), [file]);
          const fileUrl = uploadedUrls[0];

          const title = prompt('Título del ensayo:') || file.name.replace(/\.[^/.]+$/, "");
          const description = prompt('Descripción del ensayo (opcional):') || `Ensayo subido por ${selectedStudent.full_name || selectedStudent.email}`;
          const { error } = await supabase
            .from('student_essays')
            .insert({
              title,
              description,
              file_url: fileUrl,
              student_id: selectedStudent.id,
              uploaded_by: currentUser?.id || selectedStudent.id,
              group_id: parseInt(groupId),
              file_size: file.size,
              file_type: file.type
            });
          if (error) throw error;
      } else {
        const uploadedUrls = await uploadFiles(parseInt(groupId), [file]);
        const title = prompt('Título de la evidencia:') || file.name.replace(/\.[^/.]+$/, "");
        const description = prompt('Descripción de la evidencia (opcional):') || '';
        const { error: postError } = await supabase.from('posts').insert({
          titulo: title,
          contenido: description || `Evidencia: ${title}`,
          grupo: parseInt(groupId),
          autor: selectedStudent.id,
          rol: 'usuario',
          status: 'published',
          archivos: uploadedUrls,
          reacciones: {},
          fechaCreacion: Date.now()
        });
        if (postError) throw postError;
      }
      setTimeout(() => loadStudentContent(selectedStudent.id), 500);
      alert(`✅ ${type === 'ensayos' ? 'Ensayo' : 'Evidencia'} "${file.name}" subido exitosamente`);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(`❌ Error al subir el archivo: ${error?.message || String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const addVideoLink = async () => {
    if (!selectedStudent) return;
    const url = prompt('URL del video (YouTube o Google Drive):');
    if (!url) return;
    const title = prompt('Título del video:') || 'Video sin título';
    const description = prompt('Descripción del video (opcional):') || '';
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isGoogleDrive = url.includes('drive.google.com');
    if (!isYouTube && !isGoogleDrive) {
      alert('❌ Solo se permiten videos de YouTube o Google Drive');
      return;
    }
    try {
      const supabase = getSupabase();
      let finalUrl = url;
      if (isGoogleDrive) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) finalUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
      const { error } = await supabase.from('posts').insert({
        titulo: title,
        contenido: description || `Video: ${title}`,
        grupo: parseInt(groupId),
        autor: selectedStudent.id,
        rol: 'usuario',
        status: 'published',
        archivos: [],
        reacciones: {},
        [isYouTube ? 'youtube_url' : 'google_drive_url']: finalUrl,
        fechaCreacion: Date.now()
      });
      if (error) throw error;
      setTimeout(() => loadStudentContent(selectedStudent.id), 500);
      alert('✅ Video agregado exitosamente');
    } catch (error: any) {
      console.error('Error adding video:', error);
      alert(`❌ Error al agregar el video: ${error?.message || String(error)}`);
    }
  };

  // ====== RENDER ======

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div> // FIX: cerrar contenedor
    );
  }

  // Lista de estudiantes (sin seleccionado)
  if (!selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            👥 {isAdminView ? 'Panel de Administración' : 'Espacio de Delegado'} - Grupo {groupId}
          </h2>
          <p className="text-purple-200 mb-4">
            {isAdminView
              ? 'Gestiona estudiantes y su contenido académico'
              : 'Supervisa y gestiona los estudiantes de tu grupo asignado'}
          </p>

          <div className="flex items-center gap-3">
            {currentUser?.role === 'admin' && (
              <button
                onClick={createStudentsForGroup}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
              >
                {loading ? 'Creando...' : '✨ Crear Estudiantes Auto'}
              </button>
            )}
            <span className="text-purple-300 text-sm">
              {students.length > 0 && `${students.length} estudiantes en el grupo`}
            </span>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-600/20">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-white mb-2">No hay estudiantes</h3>
            <p className="text-gray-400 mb-4">No se encontraron estudiantes en este grupo</p>
            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={createStudentsForGroup}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Creando...' : '✨ Crear Estudiantes Automáticamente'}
                </button>
                <p className="text-gray-500 text-sm mt-3">
                  Esto creará estudiantes predefinidos para el Grupo {groupId}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/30 hover:border-purple-500/50 cursor-pointer transition-all duration-200 hover:scale-105 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <UserAvatar
                    user={{ id: student.id, displayName: student.full_name, email: student.email }}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {student.full_name || student.email.split('@')[0]}
                    </h3>
                    <p className="text-gray-400 text-sm">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400 font-medium">👤 Estudiante</span>
                  <span className="text-purple-400 group-hover:text-purple-300 transition-colors">Gestionar →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== Vista de gestión de estudiante individual =====
  // FIX: ahora sí retornamos JSX completo y cerrado
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedStudent(null)}
          className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-bold text-white">
          Gestionar: {selectedStudent.full_name || selectedStudent.email}
        </h2>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-600/30">
        <div className="flex">
          <button
            onClick={() => setActiveSection('ensayos')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeSection === 'ensayos'
                ? 'bg-purple-600/30 text-purple-300 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            📄 Ensayos ({studentContent.ensayos.length})
          </button>
          <button
            onClick={() => setActiveSection('videos')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeSection === 'videos'
                ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            🎥 Videos ({studentContent.videos.length})
          </button>
          <button
            onClick={() => setActiveSection('evidencias')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeSection === 'evidencias'
                ? 'bg-green-600/30 text-green-300 border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            📁 Evidencias ({studentContent.evidencias.length})
          </button>
        </div>

        <div className="p-6">
          {/* ENSAYOS */}
          {activeSection === 'ensayos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">📄 Ensayos</h3>
                <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer">
                  {uploading ? 'Subiendo...' : '+ Subir Ensayo'}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'ensayos')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {studentContent.ensayos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">📄 No hay ensayos subidos</div>
              ) : (
                <div className="space-y-3">
                  {studentContent.ensayos.map((ensayo) => (
                    <div key={ensayo.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{ensayo.title}</h4>
                          <p className="text-gray-400 text-sm">📅 {new Date(ensayo.uploaded_at).toLocaleDateString()}</p>
                          <a
                            href={ensayo.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            📎 Ver ensayo →
                          </a>
                        </div>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'delegado') && (
                          <button
                            onClick={() => handleDeleteEssay(ensayo.id, ensayo.file_url, ensayo.title)}
                            className="ml-3 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            title="Eliminar ensayo"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIDEOS */}
          {activeSection === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">🎥 Videos</h3>
                <button onClick={addVideoLink} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  + Agregar Video
                </button>
              </div>

              {studentContent.videos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">🎥 No hay videos agregados</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentContent.videos.map((video) => {
                    const ytId = video.type === 'youtube'
                      ? (video.embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1] || '')
                      : '';
                    return (
                      <div key={video.id} className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-600/30">
                        <div className="aspect-video bg-gray-800">
                          {video.type === 'youtube' && ytId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${ytId}`}
                              title={video.title}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : video.type === 'drive' && video.embedUrl ? (
                            <iframe src={video.embedUrl} title={video.title} className="w-full h-full" frameBorder="0" allow="autoplay" />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <div className="text-4xl mb-2">🎥</div>
                                <div>Video no disponible</div>
                                <div className="text-xs mt-1">URL: {video.embedUrl}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="text-white font-medium mb-2">{video.title}</h4>
                          {video.description && <p className="text-gray-300 text-sm mb-2">{video.description}</p>}
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* EVIDENCIAS */}
          {activeSection === 'evidencias' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">📁 Mapas</h3>
                <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer">
                  {uploading ? 'Subiendo...' : '+ Subir Mapa'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'evidencias')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {studentContent.evidencias.length === 0 ? (
                <div className="text-center py-8 text-gray-400">📁 No hay mapas subidos</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentContent.evidencias.map((evidencia) => (
                    <div key={evidencia.id} className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-600/30">
                      {evidencia.type === 'image' ? (
                        <div className="aspect-video bg-gray-800">
                          <img
                            src={evidencia.file_url}
                            alt={evidencia.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400" style={{ display: 'none' }}>
                            🖼️ Imagen no disponible
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-800 flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <div className="text-4xl mb-2">📄</div>
                            <div>Documento PDF</div>
                          </div>
                        </div>
                      )}

                      <div className="p-4">
                        <h4 className="text-white font-medium mb-2">{evidencia.title}</h4>
                        {evidencia.description && <p className="text-gray-300 text-sm mb-2">{evidencia.description}</p>}
                        <p className="text-gray-400 text-sm mb-3">
                          {evidencia.type === 'pdf' ? '📄 PDF' : '🖼️ Imagen'} • {new Date(evidencia.uploaded_at).toLocaleDateString()}
                        </p>
                        <a
                          href={evidencia.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                        >
                          📎 Ver completo →
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
    </div>
  );
}
