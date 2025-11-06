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
    description?: string;
    file_url: string;
    essay_url?: string;
    essay_name?: string;
    report_url?: string;
    report_name?: string;
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
  const [editingEssay, setEditingEssay] = useState<{
    id: string;
    title: string;
    description?: string;
    essay_url?: string;
    essay_name?: string;
    report_url?: string;
    report_name?: string;
  } | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
  });
  const [newEssayFile, setNewEssayFile] = useState<File | null>(null);
  const [newReportFile, setNewReportFile] = useState<File | null>(null);
  const [editingVideo, setEditingVideo] = useState<{
    id: string;
    title: string;
    description: string;
    url: string;
    type: 'youtube' | 'drive';
  } | null>(null);
  const [editingMapa, setEditingMapa] = useState<{
    id: string;
    title: string;
    description: string;
    file_url: string;
  } | null>(null);
  const [newMapaFile, setNewMapaFile] = useState<File | null>(null);

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
      
      // Intentar primero con todas las columnas (si existen)
      let { data: ensayos, error: ensayosError } = await supabase
        .from('student_essays')
        .select('id, title, description, file_url, essay_url, essay_name, report_url, report_name, uploaded_at')
        .eq('student_id', studentId);

      // Si falla porque las columnas no existen, usar solo las columnas básicas
      if (ensayosError && ensayosError.code === '42703') {
        console.log('Columnas nuevas no encontradas, usando solo columnas básicas');
        const result = await supabase
          .from('student_essays')
          .select('id, title, description, file_url, uploaded_at')
          .eq('student_id', studentId);
        ensayos = result.data as any;
        ensayosError = result.error;
      }

      console.log('Ensayos cargados:', ensayos, 'Error:', ensayosError);

      // Mapear ensayos para la estructura esperada (con compatibilidad para datos antiguos)
      const mappedEnsayos = ensayos?.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        file_url: e.file_url,
        essay_url: (e as any).essay_url || e.file_url, // Compatibilidad con datos antiguos
        essay_name: (e as any).essay_name || (e.file_url ? e.file_url.split('/').pop() : 'Archivo'),
        report_url: (e as any).report_url,
        report_name: (e as any).report_name,
        uploaded_at: e.uploaded_at,
      })) || [];

      const { data: posts } = await supabase
        .from('posts')
        .select('id, titulo, contenido, archivos, youtube_url, google_drive_url, fechaCreacion, status')
        .eq('autor', studentId)
        .neq('status', 'deleted'); // Filtrar posts eliminados

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

      console.log('Seteando contenido con ensayos:', mappedEnsayos.length);
      setStudentContent({ ensayos: mappedEnsayos, videos, evidencias });
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

  const handleEditEssayTitle = async (essayId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      alert('❌ El título no puede estar vacío');
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('student_essays')
        .update({ title: newTitle.trim() })
        .eq('id', essayId);

      if (error) throw error;

      // Actualizar el estado local
      setStudentContent(prev => ({
        ...prev,
        ensayos: prev.ensayos.map(ensayo =>
          ensayo.id === essayId ? { ...ensayo, title: newTitle.trim() } : ensayo
        )
      }));

      setEditingEssay(null);
      alert('✅ Título actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating essay title:', error);
      alert('❌ Error al actualizar el título: ' + (error?.message || 'Error desconocido'));
    }
  };

  const handleDeleteReport = async (essayId: string, reportUrl: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar el reporte de Turnitin?')) {
      return;
    }

    try {
      const supabase = getSupabase();

      // Intentar eliminar el archivo del storage si es de Supabase
      if (reportUrl.includes('supabase.co/storage')) {
        const urlParts = reportUrl.split('/');
        const pathIndex = urlParts.findIndex(part => part === 'ensayos') + 1;
        const filePath = urlParts.slice(pathIndex).join('/');
        const { error: storageError } = await supabase.storage.from('ensayos').remove([`ensayos/${filePath}`]);
        if (storageError) console.error('Error eliminando archivo:', storageError);
      }

      // Actualizar la base de datos para eliminar las referencias al reporte
      const { error } = await supabase
        .from('student_essays')
        .update({ report_url: null, report_name: null })
        .eq('id', essayId);

      // Si falla por columnas inexistentes, informar al usuario
      if (error && error.code === '42703') {
        alert('ℹ️ La función de reportes no está disponible. Ejecuta el script SQL en Supabase primero.');
        return;
      } else if (error) {
        throw error;
      }

      // Recargar contenido
      if (selectedStudent) {
        await loadStudentContent(selectedStudent.id);
      }

      // Actualizar el estado local de edición si está activo
      if (editingEssay?.id === essayId) {
        setEditingEssay({
          ...editingEssay,
          report_url: undefined,
          report_name: undefined,
        });
      }

      alert('✅ Reporte eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting report:', error);
      alert('❌ Error al eliminar el reporte: ' + (error?.message || 'Error desconocido'));
    }
  };

  const handleSaveEssayEdit = async () => {
    if (!editingEssay) return;
    if (!editFormData.title.trim()) {
      alert('❌ El título no puede estar vacío');
      return;
    }

    setUploading(true);
    try {
      const supabase = getSupabase();
      const updates: any = {
        title: editFormData.title.trim(),
        description: editFormData.description?.trim() || null,
      };

      // Subir nuevo archivo de ensayo si se seleccionó
      if (newEssayFile) {
        const uploadedUrls = await uploadFiles(parseInt(groupId), [newEssayFile]);
        updates.file_url = uploadedUrls[0]; // Siempre actualizar file_url para compatibilidad
        // Intentar actualizar essay_url si la columna existe
        updates.essay_url = uploadedUrls[0];
        updates.essay_name = newEssayFile.name;
      }

      // Subir nuevo archivo de reporte si se seleccionó
      if (newReportFile) {
        const uploadedUrls = await uploadFiles(parseInt(groupId), [newReportFile]);
        updates.report_url = uploadedUrls[0];
        updates.report_name = newReportFile.name;
      }

      const { error } = await supabase
        .from('student_essays')
        .update(updates)
        .eq('id', editingEssay.id);

      // Si falla por columnas inexistentes, intentar solo con las columnas básicas
      if (error && error.code === '42703') {
        console.log('Columnas nuevas no encontradas, guardando solo campos básicos');
        const basicUpdates: any = {
          title: editFormData.title.trim(),
          description: editFormData.description?.trim() || null,
        };
        if (newEssayFile) {
          const uploadedUrls = await uploadFiles(parseInt(groupId), [newEssayFile]);
          basicUpdates.file_url = uploadedUrls[0];
        }
        
        const { error: basicError } = await supabase
          .from('student_essays')
          .update(basicUpdates)
          .eq('id', editingEssay.id);
          
        if (basicError) throw basicError;
        
        if (newReportFile) {
          alert('ℹ️ El reporte no se pudo guardar. Ejecuta primero el script SQL en Supabase para habilitar esta función.');
        }
      } else if (error) {
        throw error;
      }

      // Recargar contenido
      if (selectedStudent) {
        await loadStudentContent(selectedStudent.id);
      }

      setEditingEssay(null);
      setEditFormData({ title: '', description: '' });
      setNewEssayFile(null);
      setNewReportFile(null);
      alert('✅ Ensayo actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating essay:', error);
      alert('❌ Error al actualizar el ensayo: ' + (error?.message || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'delegado')) {
      alert('❌ No tienes permisos para eliminar videos');
      return;
    }
    if (!confirm(`¿Estás seguro de que quieres eliminar el video "${videoTitle}"?`)) {
      return;
    }
    try {
      const supabase = getSupabase();
      console.log('Eliminando video con ID:', videoId);
      console.log('Usuario actual:', currentUser);
      
      // Verificar que el post existe antes de eliminar
      const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('id, autor, grupo')
        .eq('id', videoId)
        .single();
      
      if (fetchError) {
        console.error('Error buscando el post:', fetchError);
        throw new Error('No se pudo encontrar el video: ' + fetchError.message);
      }
      
      console.log('Post encontrado:', postData);
      
      // Intentar eliminar directamente
      const { data: deleteData, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', videoId)
        .select();
        
      console.log('Resultado de eliminación - Data:', deleteData, 'Error:', error);
      
      if (error) {
        console.error('Error en la eliminación, código:', error.code, 'mensaje:', error.message);
        // Si falla por RLS, marcar como borrado en lugar de eliminar
        if (error.code === 'PGRST301' || error.message.includes('policy')) {
          console.log('Políticas RLS bloqueando eliminación, marcando como borrado...');
          const { error: updateError } = await supabase
            .from('posts')
            .update({ status: 'deleted' })
            .eq('id', videoId);
          
          if (updateError) {
            throw new Error('No se pudo marcar como eliminado: ' + updateError.message);
          }
          
          console.log('Video marcado como eliminado');
        } else {
          throw error;
        }
      }

      if (selectedStudent) {
        await loadStudentContent(selectedStudent.id);
      }
      alert(`✅ Video "${videoTitle}" eliminado exitosamente`);
    } catch (error: any) {
      console.error('Error eliminando video:', error);
      alert(`❌ Error al eliminar el video: ${error?.message || String(error)}`);
    }
  };

  const handleSaveVideoEdit = async () => {
    if (!editingVideo) return;
    if (!editFormData.title.trim()) {
      alert('❌ El título no puede estar vacío');
      return;
    }

    setUploading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('posts')
        .update({
          titulo: editFormData.title.trim(),
          contenido: editFormData.description?.trim() || '',
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      if (selectedStudent) {
        await loadStudentContent(selectedStudent.id);
      }

      setEditingVideo(null);
      setEditFormData({ title: '', description: '' });
      alert('✅ Video actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating video:', error);
      alert('❌ Error al actualizar el video: ' + (error?.message || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMapa = async (mapaId: string, mapaTitle: string) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'delegado')) {
      alert('❌ No tienes permisos para eliminar mapas');
      return;
    }
    if (!confirm(`¿Estás seguro de que quieres eliminar el mapa "${mapaTitle}"?`)) {
      return;
    }
    try {
      const supabase = getSupabase();
      // El ID del mapa es formato "postId_index", extraemos el postId
      const postId = mapaId.split('_')[0];
      console.log('Eliminando mapa con ID:', mapaId, 'PostID extraído:', postId);
      console.log('Usuario actual:', currentUser);
      
      // Verificar que el post existe antes de eliminar
      const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('id, autor, grupo, archivos')
        .eq('id', postId)
        .single();
      
      if (fetchError) {
        console.error('Error buscando el post:', fetchError);
        throw new Error('No se pudo encontrar el mapa: ' + fetchError.message);
      }
      
      console.log('Post encontrado:', postData);

      // Intentar eliminar archivos del storage si existen
      if (postData?.archivos && Array.isArray(postData.archivos)) {
        for (const fileUrl of postData.archivos) {
          if (fileUrl.includes('supabase.co/storage')) {
            try {
              const urlParts = fileUrl.split('/');
              const bucketName = urlParts[urlParts.indexOf('storage') + 2];
              const pathIndex = urlParts.indexOf(bucketName) + 1;
              const filePath = urlParts.slice(pathIndex).join('/');
              await supabase.storage.from(bucketName).remove([filePath]);
            } catch (storageError) {
              console.error('Error eliminando archivo del storage:', storageError);
            }
          }
        }
      }

      // Ahora eliminamos el post
      const { data: deleteData, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .select();
        
      console.log('Resultado de eliminación - Data:', deleteData, 'Error:', error);
      
      if (error) {
        console.error('Error en la eliminación, código:', error.code, 'mensaje:', error.message);
        // Si falla por RLS, marcar como borrado en lugar de eliminar
        if (error.code === 'PGRST301' || error.message.includes('policy')) {
          console.log('Políticas RLS bloqueando eliminación, marcando como borrado...');
          const { error: updateError } = await supabase
            .from('posts')
            .update({ status: 'deleted' })
            .eq('id', postId);
          
          if (updateError) {
            throw new Error('No se pudo marcar como eliminado: ' + updateError.message);
          }
          
          console.log('Mapa marcado como eliminado');
        } else {
          throw error;
        }
      }

      if (selectedStudent) {
        await loadStudentContent(selectedStudent.id);
      }
      alert(`✅ Mapa "${mapaTitle}" eliminado exitosamente`);
    } catch (error: any) {
      console.error('Error eliminando mapa:', error);
      alert(`❌ Error al eliminar el mapa: ${error?.message || String(error)}`);
    }
  };

  const handleSaveMapaEdit = async () => {
    if (!editingMapa) return;
    if (!editFormData.title.trim()) {
      alert('❌ El título no puede estar vacío');
      return;
    }

    setUploading(true);
    try {
      const supabase = getSupabase();
      const postId = editingMapa.id.split('_')[0];
      
      const updates: any = {
        titulo: editFormData.title.trim(),
        contenido: editFormData.description?.trim() || '',
      };

      // Si se seleccionó un nuevo archivo
      if (newMapaFile) {
        const uploadedUrls = await uploadFiles(parseInt(groupId), [newMapaFile]);
        updates.archivos = uploadedUrls;
      }

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;

      if (selectedStudent) {
        await loadStudentContent(selectedStudent.id);
      }

      setEditingMapa(null);
      setEditFormData({ title: '', description: '' });
      setNewMapaFile(null);
      alert('✅ Mapa actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating mapa:', error);
      alert('❌ Error al actualizar el mapa: ' + (error?.message || 'Error desconocido'));
    } finally {
      setUploading(false);
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
            📁 Mapas ({studentContent.evidencias.length})
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
                  {studentContent.ensayos.map((ensayo) => {
                    console.log('Renderizando ensayo:', ensayo.id, 'User role:', currentUser?.role);
                    return (
                    <div key={ensayo.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-2">{ensayo.title}</h4>
                          {ensayo.description && (
                            <p className="text-gray-300 text-sm mb-2">{ensayo.description}</p>
                          )}
                          <p className="text-gray-400 text-sm mb-2">📅 {new Date(ensayo.uploaded_at).toLocaleDateString()}</p>
                          <div className="flex flex-col gap-1">
                            {(ensayo.essay_url || ensayo.file_url) && (
                              <a
                                href={ensayo.essay_url || ensayo.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 text-sm"
                              >
                                📎 Ver ensayo: {ensayo.essay_name || 'Archivo'}
                              </a>
                            )}
                            {ensayo.report_url && (
                              <a
                                href={ensayo.report_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-400 hover:text-pink-300 text-sm"
                              >
                                � Ver reporte: {ensayo.report_name || 'Reporte'}
                              </a>
                            )}
                          </div>
                        </div>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'delegado') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingEssay({
                                  id: ensayo.id,
                                  title: ensayo.title,
                                  description: ensayo.description,
                                  essay_url: ensayo.essay_url || ensayo.file_url,
                                  essay_name: ensayo.essay_name,
                                  report_url: ensayo.report_url,
                                  report_name: ensayo.report_name,
                                });
                                setEditFormData({
                                  title: ensayo.title,
                                  description: ensayo.description || '',
                                });
                              }}
                              className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs rounded transition-colors"
                              title="Editar publicación"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDeleteEssay(ensayo.id, ensayo.essay_url || ensayo.file_url, ensayo.title)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              title="Eliminar ensayo"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
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
                          <div className="flex items-center gap-2">
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                              {video.type === 'youtube' ? '🔗 Ver en YouTube →' : '🔗 Ver en Drive →'}
                            </a>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'delegado') && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingVideo({
                                      id: video.id,
                                      title: video.title,
                                      description: video.description || '',
                                      url: video.url,
                                      type: video.type,
                                    });
                                    setEditFormData({
                                      title: video.title,
                                      description: video.description || '',
                                    });
                                  }}
                                  className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs rounded transition-colors"
                                  title="Editar video"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteVideo(video.id, video.title)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                  title="Eliminar video"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
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
                        <div className="flex items-center gap-2">
                          <a
                            href={evidencia.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            📎 Ver completo →
                          </a>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'delegado') && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingMapa({
                                    id: evidencia.id,
                                    title: evidencia.title,
                                    description: evidencia.description || '',
                                    file_url: evidencia.file_url,
                                  });
                                  setEditFormData({
                                    title: evidencia.title,
                                    description: evidencia.description || '',
                                  });
                                }}
                                className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-300 text-xs rounded transition-colors"
                                title="Editar mapa"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteMapa(evidencia.id, evidencia.title)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                title="Eliminar mapa"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición de ensayo */}
      {editingEssay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Editar publicación</h2>
            
            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Título</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Título del ensayo..."
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descripción o evidencia del ensayo..."
                  rows={3}
                />
              </div>

              {/* Archivos actuales */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-medium">Archivos actuales</label>
                {editingEssay.essay_url && (
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                    <a
                      href={editingEssay.essay_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      📎 {editingEssay.essay_name || 'Ensayo actual'}
                    </a>
                  </div>
                )}
                {editingEssay.report_url && (
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                    <a
                      href={editingEssay.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 text-sm"
                    >
                      📝 {editingEssay.report_name || 'Reporte actual'}
                    </a>
                    <button
                      onClick={() => handleDeleteReport(editingEssay.id, editingEssay.report_url!)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      title="Eliminar reporte"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              {/* Subir nuevo ensayo */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Reemplazar ensayo (opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => setNewEssayFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
                />
                {newEssayFile && (
                  <p className="text-green-400 text-xs mt-1">✓ {newEssayFile.name}</p>
                )}
              </div>

              {/* Agregar/reemplazar reporte de Turnitin */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {editingEssay.report_url ? 'Reemplazar reporte de Turnitin' : 'Agregar reporte de Turnitin (opcional)'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => setNewReportFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-600 file:text-white file:cursor-pointer hover:file:bg-pink-700"
                />
                {newReportFile && (
                  <p className="text-green-400 text-xs mt-1">✓ {newReportFile.name}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  Este archivo se agregará como un documento adicional sin reemplazar el ensayo
                </p>
              </div>

              {/* TODO: Agregar soporte para reportes de Turnitin cuando se agreguen las columnas a la BD */}
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEssayEdit}
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {uploading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => {
                  setEditingEssay(null);
                  setEditFormData({ title: '', description: '' });
                  setNewEssayFile(null);
                  setNewReportFile(null);
                }}
                disabled={uploading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de video */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Editar video</h2>
            
            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Título</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título del video..."
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del video..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  📝 La URL del video no se puede cambiar. Si necesitas cambiar el video, elimina este y crea uno nuevo.
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveVideoEdit}
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {uploading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => {
                  setEditingVideo(null);
                  setEditFormData({ title: '', description: '' });
                }}
                disabled={uploading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de mapa */}
      {editingMapa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Editar mapa</h2>
            
            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Título</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Título del mapa..."
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Descripción del mapa..."
                  rows={3}
                />
              </div>

              {/* Archivo actual */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Archivo actual</label>
                <a
                  href={editingMapa.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-green-400 hover:text-green-300 text-sm"
                >
                  📎 Ver archivo actual
                </a>
              </div>

              {/* Reemplazar archivo */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Reemplazar archivo (opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => setNewMapaFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
                />
                {newMapaFile && (
                  <p className="text-green-400 text-xs mt-1">✓ {newMapaFile.name}</p>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveMapaEdit}
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {uploading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => {
                  setEditingMapa(null);
                  setEditFormData({ title: '', description: '' });
                  setNewMapaFile(null);
                }}
                disabled={uploading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
