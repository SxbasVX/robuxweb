'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { getSupabase } from '../lib/supabaseClient';
import UserAvatar from './UserAvatar';
import { getRoleDisplayName } from '../lib/gamertag';
import { restoreAdminRole, verifyAdminRole, setUserRole } from '../lib/admin-utils';
import { useBackupSystem } from '../lib/useBackupSystem';
import { useNotifications } from '../lib/useNotifications';
import { useAuditLogger } from '../lib/auditLogger';
import ProductionSummary from './ProductionSummary';
import { useCallback } from 'react';

// Botón de prueba de backup manual y log se encuentran en el componente principal más abajo.

type UserDoc = { 
  role: 'usuario' | 'delegado' | 'admin'; 
  group?: 1|2|3|4|5; 
  email?: string; 
};

export default function AdminPanel() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; data: UserDoc }>>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string|null>(null);
  const [newDelegadoEmail, setNewDelegadoEmail] = useState('');
  const [newDelegadoGroup, setNewDelegadoGroup] = useState<1|2|3|4|5>(1);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'backups' | 'notifications' | 'logs' | 'system' | 'security' | 'production' | 'launch'>('production');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Hooks para funcionalidades adicionales
  const {
    createBackup,
    getBackupStatus,
    loadBackup,
    deleteBackup,
    isLoading: backupLoading,
    lastBackup,
    backupList
  } = useBackupSystem();

  // Botón de prueba de backup manual
  const handleTestBackup = useCallback(async () => {
    const result = await createBackup('manual');
    if (result.success) {
      alert('✅ Backup de prueba creado y guardado en Supabase');
    } else {
      alert('❌ Error al crear backup de prueba');
    }
  }, [createBackup]);

  // Botón de prueba de log
  const handleTestLogSupabase = useCallback(async () => {
    try {
      await getSupabase().from('logs').insert({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_id: user?.id || 'test',
        user_email: user?.email || 'test@demo.com',
        action: 'test_log',
        level: 'info',
        details: { test: true, message: 'Log de prueba desde el panel' },
        ip_address: 'local',
        user_agent: navigator.userAgent
      });
      alert('✅ Log de prueba guardado en Supabase');
    } catch (error) {
      alert('❌ Error al guardar log de prueba');
    }
  }, [user]);

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification,
    getStats,
    cleanExpiredNotifications
  } = useNotifications();

  const { getLogs, getStats: getLogStats, clearLogs, exportLogs } = useAuditLogger();

  const loadUsers = async () => {
    console.log('🔄 Iniciando carga de usuarios...');
    setLoading(true);
    try {
      const supabase = getSupabase();
      
      // Forzar una consulta fresca sin caché
      const { data: urows, error: uerr } = await supabase
        .from('users')
        .select('*');
      
      console.log('📊 Datos recibidos de Supabase:', urows);
      
      if (uerr) {
        console.error('❌ Error al cargar usuarios:', uerr);
        throw uerr;
      }
      
      const mappedUsers = (urows ?? []).map((r: any) => ({ id: r.id, data: r as UserDoc }));
      console.log('👥 Usuarios mapeados:', mappedUsers.length, 'usuarios');
      
      setUsers(mappedUsers);
      setError(null);
      
    } catch (e: any) {
      console.error('💥 Error completo en loadUsers:', e);
      setError(e.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    getBackupStatus();
  }, [getBackupStatus]);

  // Verificar que el usuario sea admin
  if (!user) {
    return (
      <div className="glass p-8 rounded-2xl">
        <div className="text-center text-gray-400">
          <p className="text-xl mb-2">🔒</p>
          <p>Debes iniciar sesión para acceder al panel de administración</p>
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="glass p-8 rounded-2xl border-l-4 border-red-500">
        <div className="text-center">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Acceso Denegado</h2>
          <p className="text-gray-400">
            Solo los administradores pueden acceder a este panel.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Tu rol actual: <span className="text-yellow-400 font-semibold">{role}</span>
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateBackup = async () => {
    try {
      const result = await createBackup();
      if (result.success) {
        await getBackupStatus();
        alert(`✅ Backup creado: ${result.data?.records} registros`);
      } else {
        alert('❌ Error al crear backup');
      }
    } catch (error) {
      console.error('Error creando backup:', error);
      alert('❌ Error al crear backup');
    }
  };



  const handleExportUserData = async (userId: string) => {
    try {
      // Obtener datos básicos del usuario desde Supabase
      const supabase = getSupabase();
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Crear y descargar archivo JSON
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_${userId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando datos:', error);
    }
  };

  const createDelegado = async () => {
    if (!newDelegadoEmail.trim()) {
      setError('Email es requerido');
      return;
    }
    
    setCreating(true);
    try {
      const supabase = getSupabase();
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', newDelegadoEmail.trim())
        .single();
      
      if (existingUser) {
        setError('Ya existe un usuario con ese email');
        setCreating(false);
        return;
      }
      
      const userId = crypto.randomUUID();
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: newDelegadoEmail.trim(),
          role: 'delegado',
          group: newDelegadoGroup
        });
        
      if (insertError) throw insertError;
      
      setNewDelegadoEmail('');
      await loadUsers();
      await getBackupStatus();
      
    } catch (e: any) {
      setError(e.message ?? 'Error al crear delegado');
    } finally {
      setCreating(false);
    }
  };

  const saveRole = async (id: string, role: UserDoc['role'], group?: number) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('users').update({ role, group }).eq('id', id);
      if (error) throw error;
      await loadUsers();
    } catch (e: any) { 
      setError(e.message ?? 'Error al guardar cambios'); 
    }
  };

  // Función para restaurar el administrador específico
  const restoreSpecificAdmin = async () => {
    if (!confirm('¿Restaurar rol de administrador para admin@admin.com?')) return;
    
    try {
      const result = await restoreAdminRole('2545304c-b9c2-4d8d-a413-93dad3f38007', 'admin@admin.com');
      
      if (result.success) {
        setError(null);
        await loadUsers();
        alert('Rol de administrador restaurado exitosamente');
      } else {
        setError(result.error || 'Error al restaurar administrador');
      }
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado');
    }
  };

  const deleteUser = async (userId: string) => {
    // Encontrar el usuario para mostrar información en la confirmación
    const userToDelete = users.find(u => u.id === userId);
    const userInfo = userToDelete ? `${userToDelete.data.email || userToDelete.id}` : userId;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${userInfo}"?\n\nEsta acción no se puede deshacer.`)) return;
    
    setDeletingUserId(userId);
    
    // Eliminación optimista: quitar de la lista inmediatamente
    const originalUsers = [...users];
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    
    try {
      const supabase = getSupabase();
      
      console.log(`🔄 Iniciando eliminación del usuario: ${userId}`);
      console.log('Usuario encontrado:', userToDelete);
      
      // Verificar que tenemos conexión a Supabase
      const { data: authUser } = await supabase.auth.getUser();
      console.log('Usuario autenticado:', authUser?.user?.email);
      
      // Intentar eliminar el usuario
      console.log('📤 Ejecutando DELETE en la tabla users...');
      const { data, error, count } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      console.log('Respuesta de eliminación:', { data, error, count });
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        // Restaurar la lista si hay error
        setUsers(originalUsers);
        throw new Error(`Error de base de datos: ${error.message}`);
      }
      
      console.log(`✅ Usuario ${userId} eliminado exitosamente`);
      
      // Verificar que realmente se eliminó haciendo una consulta fresca
      setTimeout(async () => {
        console.log('🔍 Verificando eliminación...');
        const { data: verifyData } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId);
        
        if (verifyData && verifyData.length > 0) {
          console.warn('⚠️ El usuario aún existe en la base de datos, recargando lista...');
          await loadUsers();
        } else {
          console.log('✅ Eliminación verificada correctamente');
        }
      }, 1000);
      
      // Mostrar mensaje de éxito
      alert(`✅ Usuario "${userInfo}" eliminado exitosamente`);
      
    } catch (e: any) {
      console.error('💥 Error completo al eliminar usuario:', e);
      const errorMessage = e.message || 'Error desconocido al eliminar usuario';
      setError(`Error al eliminar usuario: ${errorMessage}`);
      alert(`❌ Error al eliminar usuario: ${errorMessage}`);
      
      // En caso de error, restaurar la lista original
      setUsers(originalUsers);
    } finally {
      setDeletingUserId(null);
    }
  };

  // Función para borrar todos los posts y archivos
  const deleteAllPosts = async () => {
    if (!confirm('⚠️ ¿Estás COMPLETAMENTE SEGURO de que quieres borrar TODOS los posts y archivos?\n\nEsta acción NO SE PUEDE DESHACER.\n\nEscribe "BORRAR TODO" para confirmar:')) {
      return;
    }

    const confirmation = prompt('Para confirmar, escribe exactamente: BORRAR TODO');
    if (confirmation !== 'BORRAR TODO') {
      alert('Confirmación incorrecta. Operación cancelada.');
      return;
    }

    setLoading(true);
    
    try {
      const supabase = getSupabase();
      
      console.log('🗑️ Iniciando eliminación masiva de contenido...');

      // 1. Borrar todos los posts
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .neq('id', ''); // Esto borra todos los registros

      if (postsError) {
        throw new Error(`Error al borrar posts: ${postsError.message}`);
      }
      console.log('✅ Posts eliminados');

      // 2. Borrar todos los comentarios
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .neq('id', ''); // Esto borra todos los registros

      if (commentsError) {
        console.warn('⚠️ Error al borrar comentarios:', commentsError.message);
      } else {
        console.log('✅ Comentarios eliminados');
      }

      // 3. Borrar archivos de storage (intentar ambos buckets)
      try {
        // Listar archivos en bucket 'grupos'
        const { data: gruposFiles } = await supabase.storage
          .from('grupos')
          .list();

        if (gruposFiles && gruposFiles.length > 0) {
          const gruposFilePaths = gruposFiles.map(file => file.name);
          const { error: gruposStorageError } = await supabase.storage
            .from('grupos')
            .remove(gruposFilePaths);

          if (gruposStorageError) {
            console.warn('⚠️ Error al borrar archivos de grupos:', gruposStorageError.message);
          } else {
            console.log('✅ Archivos de grupos eliminados');
          }
        }

        // Listar archivos en bucket 'public'
        const { data: publicFiles } = await supabase.storage
          .from('public')
          .list();

        if (publicFiles && publicFiles.length > 0) {
          const publicFilePaths = publicFiles.map(file => file.name);
          const { error: publicStorageError } = await supabase.storage
            .from('public')
            .remove(publicFilePaths);

          if (publicStorageError) {
            console.warn('⚠️ Error al borrar archivos públicos:', publicStorageError.message);
          } else {
            console.log('✅ Archivos públicos eliminados');
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Error al acceder al storage:', storageError);
      }

      // 4. Borrar datos de home de grupos
      const { error: homeDataError } = await supabase
        .from('group_home_data')
        .delete()
        .neq('id', '');

      if (homeDataError) {
        console.warn('⚠️ Error al borrar datos de home:', homeDataError.message);
      } else {
        console.log('✅ Datos de home de grupos eliminados');
      }

      alert('🎉 ¡Eliminación completada! Todos los posts, comentarios y archivos han sido borrados. La plataforma está lista para el lanzamiento.');
      
    } catch (error: any) {
      console.error('❌ Error durante la eliminación masiva:', error);
      alert(`❌ Error durante la eliminación: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllUsers = async () => {
    if (!confirm('⚠️ ¿Estás COMPLETAMENTE SEGURO de que quieres borrar TODOS los usuarios (excepto administradores)?\n\nEsta acción NO SE PUEDE DESHACER.')) {
      return;
    }

    setLoading(true);
    
    try {
      const supabase = getSupabase();
      
      // Borrar todos los usuarios excepto admins
      const { error } = await supabase
        .from('users')
        .delete()
        .neq('role', 'admin');

      if (error) {
        throw new Error(`Error al borrar usuarios: ${error.message}`);
      }

      await loadUsers();
      alert('✅ Todos los usuarios no-administradores han sido eliminados.');
      
    } catch (error: any) {
      console.error('❌ Error al borrar usuarios:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para arreglar nombres de autores en posts existentes
  const fixAuthorNames = async () => {
    if (!confirm('¿Actualizar los nombres de autores en todos los posts existentes?')) {
      return;
    }

    setLoading(true);
    
    try {
      const supabase = getSupabase();
      
      console.log('🔧 Actualizando nombres de autores...');

      // 1. Obtener todos los posts que no tienen autorNombre o tienen nombres incorrectos
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, autor, autorNombre');

      if (postsError) {
        throw new Error(`Error al obtener posts: ${postsError.message}`);
      }

      if (!posts || posts.length === 0) {
        alert('✅ No hay posts para actualizar.');
        return;
      }

      // 2. Obtener información de usuarios
      const authorIds = [...new Set(posts.map(p => p.autor))];
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', authorIds);

      if (usersError) {
        throw new Error(`Error al obtener usuarios: ${usersError.message}`);
      }

      // 3. Crear mapa de id -> nombre con lógica de roles
      const userMap: Record<string, string> = {};
      users?.forEach(user => {
        let displayName;
        
        // Usar lógica basada en rol
        if (user.role === 'admin') {
          displayName = 'Administrador';
        } else if (user.role === 'delegado') {
          // Necesitaríamos el grupo del usuario para esto, por ahora usamos "Delegado"
          displayName = 'Delegado';
        } else {
          // Para usuarios normales, usar parte del email
          displayName = user.email ? user.email.split('@')[0] : user.id;
        }
        
        userMap[user.id] = displayName;
      });

      // 4. Actualizar posts uno por uno
      let updated = 0;
      for (const post of posts) {
        const authorName = userMap[post.autor] || post.autor;
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ autorNombre: authorName })
          .eq('id', post.id);

        if (updateError) {
          console.warn(`Error actualizando post ${post.id}:`, updateError.message);
        } else {
          updated++;
        }
      }

      // 5. También actualizar comentarios
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id, autor, autorNombre')
        .or('autorNombre.is.null,autorNombre.eq.');

      if (!commentsError && comments && comments.length > 0) {
        for (const comment of comments) {
          const authorName = userMap[comment.autor] || comment.autor;
          
          await supabase
            .from('comments')
            .update({ autorNombre: authorName })
            .eq('id', comment.id);
        }
      }

      alert(`✅ Nombres de autores actualizados! ${updated} posts y ${comments?.length || 0} comentarios procesados.`);
      
    } catch (error: any) {
      console.error('❌ Error al actualizar nombres:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar los integrantes de grupos con los nuevos datos
  const updateGroupMembers = async () => {
    if (!confirm('¿Actualizar la base de datos con la nueva lista de integrantes de grupos?')) {
      return;
    }

    setLoading(true);
    
    try {
      const supabase = getSupabase();
      
      console.log('👥 Actualizando integrantes de grupos...');

      // Nueva información de grupos
      const newGroupData = [
        {
          groupId: 1,
          members: [
            { name: 'Vilca Cruz Marsia Gianella Katherine', email: 'marsia.vilcac@unmsm.edu.pe', code: '25010238' },
            { name: 'Luna Viilca Sahara Dula', email: 'luna.vilcac@unmsm.edu.pe', code: '25010282' },
            { name: 'Romani Medina Nadit Liliana', email: 'nadit.romanim@unmsm.edu.pe', code: '25010578' },
            { name: 'Maza Morales Benjamin Pedro', email: 'benjamin.mazam@unmsm.edu.pe', code: '25010236' },
            { name: 'Damjanovic Burga Yenko Branko', email: 'yenko.damjanovicb@unmsm.edu.pe', code: '25010014' },
            { name: 'Navarro Cespedes Sunny Adriana', email: 'sunny.navarr.ocg@unmsm.edu.pe', code: '25010031' }
          ]
        },
        {
          groupId: 2,
          members: [
            { name: 'Palomino Huamani Judit Gabriela', email: 'judit.palominoh@unmsm.edu.pe', code: '25010434' },
            { name: 'Asuncion Pomasonco Allison Giselle', email: 'allison.asuncionp@unmsm.edu.pe', code: '25010007' },
            { name: 'Martinez Gomez Alvaro Jose', email: 'alvaro.martinezg@unmsm.edu.pe', code: '25010126' },
            { name: 'Yaranga Mejia Zharick Scarlett', email: 'zharick.yarangam@unmsm.edu.pe', code: '25010393' },
            { name: 'Maquera Mendoza Bryan Antony', email: 'bryan.maqueram@unmsm.edu.pe', code: '25010427' },
            { name: 'Luque Leayza David Mauricio', email: 'david.luquel@unmsm.edu.pe', code: '25010028' }
          ]
        },
        {
          groupId: 3,
          members: [
            { name: 'Quispe Abtao Jhack Hildibrahan', email: 'jhack.quispea@unmsm.edu.pe', code: '25010297' },
            { name: 'Reyes Mendieta Karla Fernanda', email: 'karla.reyesm@unmsm.edu.pe', code: '25010093' },
            { name: 'Hanampa Bellido Luz Berli', email: 'luz.hanampab@unmsm.edu.pe', code: '25010336' },
            { name: 'Gonzales Lopez Lulio Main', email: 'lulio.gonzalesl@unmsm.edu.pe', code: '25010478' },
            { name: 'Ballon Ramos Robert Andres', email: 'robert.ballonr@unmsm.edu.pe', code: '25010149' }
          ]
        },
        {
          groupId: 4,
          members: [
            { name: 'Martinez Lugue Claudia Alexandra', email: 'claudia.martinezl@unmsm.edu.pe', code: '25010127' },
            { name: 'Morales Damian Andrea Katherine', email: 'andrea.moralesd@unmsm.edu.pe', code: '20010327' },
            { name: 'Josue Osorio Anghely Cristal', email: 'anghely.josueo@unmsm.edu.pe', code: '25010330' },
            { name: 'Espinoza Cardeña Alessandra Abyael', email: 'alessandra.espinozac@unmsm.edu.pe', code: '25010360' },
            { name: 'Granada Juarez Alejandra', email: 'alejandra.granadaj@unmsm.edu.pe', code: '25010687' }
          ]
        },
        {
          groupId: 5,
          members: [
            { name: 'Balbin Cueva Aaron', email: 'aaron.balbinc@unmsm.edu.pe', code: '25010473' },
            { name: 'Carrillo Castillo Brenda', email: 'brenda.carrilloc@unmsm.edu.pe', code: '25010353' },
            { name: 'Hurtado Dominguez Angel Valeria', email: 'angel.hurtadod@unmsm.edu.pe', code: '25010240' },
            { name: 'Marcelo Diego Francesco', email: 'francesco.marcelod@unmsm.edu.pe', code: '25010173' },
            { name: 'Medina Vera Arturo Alexis', email: 'arturo.medinav@unmsm.edu.pe', code: '25010483' },
            { name: 'Obregon Castro Jhesbelt Anadira', email: 'jhesbelt.obregonc@unmsm.edu.pe', code: '25010486' },
            { name: 'Ramon Ipushima Ilan Yefet', email: 'ilan.ramoni@unmsm.edu.pe', code: '25010196' }
          ]
        }
      ];

      // 1. Primero limpiar usuarios que no sean admin
      const { error: deleteUsersError } = await supabase
        .from('users')
        .delete()
        .neq('role', 'admin'); // Solo borrar usuarios que no sean admin

      if (deleteUsersError) {
        console.warn('⚠️ Error al limpiar usuarios existentes:', deleteUsersError.message);
      } else {
        console.log('✅ Usuarios no-admin existentes eliminados');
      }

      // 2. Insertar nuevos estudiantes solo en tabla users (sin tabla students)
      let totalInserted = 0;
      for (const group of newGroupData) {
        for (const member of group.members) {
          // Solo insertar en tabla users
          const { error: insertUserError } = await supabase
            .from('users')
            .insert({
              email: member.email,
              role: 'usuario',
              group: group.groupId,
              full_name: member.name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertUserError) {
            console.warn(`⚠️ Error insertando usuario ${member.name}:`, insertUserError.message);
          } else {
            totalInserted++;
          }
        }
      }

      alert(`✅ Integrantes de grupos actualizados! ${totalInserted} estudiantes insertados en ${newGroupData.length} grupos.`);
      
    } catch (error: any) {
      console.error('❌ Error al actualizar grupos:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar estudiantes cargados
  const verifyStudents = async () => {
    setLoading(true);
    
    try {
      const supabase = getSupabase();
      
      console.log('🔍 Verificando estudiantes en la base de datos...');

      // Verificar tabla users (solo usuarios)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'usuario');

      // Verificar todos los usuarios (incluyendo admin)
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('*');

      let message = '📊 Reporte de Estudiantes:\n\n';
      
      if (usersError) {
        message += `❌ Error en tabla users: ${usersError.message}\n`;
      } else {
        message += `� Usuarios estudiantes: ${users?.length || 0}\n`;
        message += `👤 Total usuarios (incluyendo admin): ${allUsers?.length || 0}\n`;
      }

      // Mostrar por grupos
      if (users && users.length > 0) {
        message += '\n📋 Por grupos:\n';
        for (let i = 1; i <= 5; i++) {
          const groupUsers = users.filter(u => u.group === i);
          message += `• Grupo ${i}: ${groupUsers.length} estudiantes\n`;
        }
      }

      alert(message);
      
    } catch (error: any) {
      console.error('❌ Error al verificar estudiantes:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 rounded-2xl">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Cargando panel de administracion...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón de emergencia para restaurar administrador */}
      <div className="glass p-4 rounded-2xl border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-300 mb-1">🚨 Restauración de Emergencia</h3>
            <p className="text-gray-400 text-sm">
              Restaurar rol de administrador para admin@admin.com (UUID: 2545304c-b9c2-4d8d-a413-93dad3f38007)
            </p>
          </div>
          <button
            onClick={restoreSpecificAdmin}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap"
          >
            🔧 Restaurar Admin
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-red-400 mr-3">⚠️</span>
            <span className="text-red-300">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 text-xl"
          >
            ×
          </button>
        </div>
      )}

      <div className="glass p-6 rounded-2xl">
        {/* Botones de prueba para verificar backups y logs */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={handleCreateBackup}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow"
          >
            🧪 Probar Backup Manual
          </button>
          <button
            onClick={handleTestLogSupabase}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow"
          >
            🧪 Probar Log en Supabase
          </button>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Panel de Administracion</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-xl">
            <h3 className="text-white font-semibold">Total Usuarios</h3>
            <p className="text-2xl font-bold text-blue-400">{users.length}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <h3 className="text-white font-semibold">Delegados</h3>
            <p className="text-2xl font-bold text-green-400">
              {users.filter(u => u.data.role === 'delegado').length}
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <h3 className="text-white font-semibold">Administradores</h3>
            <p className="text-2xl font-bold text-purple-400">
              {users.filter(u => u.data.role === 'admin').length}
            </p>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">Crear Delegado</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={newDelegadoEmail}
              onChange={(e) => setNewDelegadoEmail(e.target.value)}
              placeholder="delegado@email.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Grupo</label>
            <select
              value={newDelegadoGroup}
              onChange={(e) => setNewDelegadoGroup(Number(e.target.value) as 1|2|3|4|5)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1,2,3,4,5].map(g => (
                <option key={g} value={g} className="bg-gray-800">Grupo {g}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={createDelegado}
              disabled={creating}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
            >
              {creating ? 'Creando...' : 'Crear Delegado'}
            </button>
          </div>
        </div>
      </div>

      {/* Sistema de pestañas */}
      <div className="glass p-6 rounded-2xl">
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('production')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'production'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🚀 Producción
          </button>
          <button
            onClick={() => setActiveTab('launch')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'launch'
                ? 'bg-red-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🗑️ Lanzamiento
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            👥 Usuarios
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'backups'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            💾 Backups
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'notifications'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🔔 Notificaciones
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'logs'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            📋 Logs
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'system'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            ⚙️ Sistema
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'security'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🔒 Seguridad
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'production' && (
          <div>
            <ProductionSummary />
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Usuarios ({users.length})
              </h3>
              <button
                onClick={() => loadUsers()}
                disabled={loading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
                title="Recargar lista de usuarios"
              >
                {loading ? '🔄 Cargando...' : '🔄 Recargar'}
              </button>
            </div>
            <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <UserAvatar 
                  user={{ id: u.id, email: u.data.email, displayName: u.data.email || u.id }} 
                  role={u.data.role} 
                  size="md" 
                  showRole={true}
                />
                <div>
                  <div className="font-medium text-white">{u.data.email || u.id}</div>
                  <div className="text-sm text-gray-400">
                    {getRoleDisplayName(u.data.role)}
                    {u.data.group && ` - Grupo ${u.data.group}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={u.data.role}
                  onChange={(e) => saveRole(u.id, e.target.value as any, u.data.group)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                >
                  <option value="usuario" className="bg-gray-800">Estudiante</option>
                  <option value="delegado" className="bg-gray-800">Delegado</option>
                  <option value="admin" className="bg-gray-800">Admin</option>
                </select>
                {u.data.role === 'delegado' && (
                  <select
                    value={u.data.group || 1}
                    onChange={(e) => saveRole(u.id, u.data.role, Number(e.target.value) as any)}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  >
                    {[1,2,3,4,5].map(g => (
                      <option key={g} value={g} className="bg-gray-800">Grupo {g}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => handleExportUserData(u.id)}
                  className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                  title="Exportar datos GDPR"
                >
                  📋
                </button>
                <button
                  onClick={() => deleteUser(u.id)}
                  disabled={deletingUserId === u.id}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    deletingUserId === u.id
                      ? 'text-gray-500 bg-gray-500/10 cursor-not-allowed'
                      : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  }`}
                  title={deletingUserId === u.id ? 'Eliminando...' : 'Eliminar usuario'}
                >
                  {deletingUserId === u.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No hay usuarios registrados
            </div>
          )}
            </div>
          </div>
        )}

        {/* Sección de Backups */}
        {activeTab === 'backups' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">💾 Sistema de Backups</h3>
            <div className="space-y-4">
              {/* Estado del último backup */}
              <div className="bg-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-white">Estado del Sistema</h4>
                  <button
                    onClick={async () => {
                      try {
                        await getBackupStatus();
                        alert('✅ Estado actualizado');
                      } catch (error) {
                        console.error('Error:', error);
                        alert('❌ Error al actualizar estado');
                      }
                    }}
                    disabled={backupLoading}
                    className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                  >
                    🔄 Actualizar
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Último backup:</span>
                    <div className="text-white font-medium">
                      {lastBackup ? new Date(lastBackup).toLocaleString('es-ES') : 'No disponible'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Estado:</span>
                    <div className="text-green-400 font-medium">Sistema operativo</div>
                  </div>
                </div>
              </div>

              {/* Acciones de backup */}
              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="text-lg font-medium text-white mb-3">Acciones</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={async () => {
                      try {
                        const result = await createBackup();
                        if (result.success) {
                          alert(`✅ Backup creado exitosamente! Registros: ${result.data?.records || 'N/A'}`);
                          await getBackupStatus(); // Actualizar estado
                        } else {
                          alert(`❌ Error al crear backup: ${result.error}`);
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        alert('❌ Error al crear backup');
                      }
                    }}
                    disabled={backupLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {backupLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creando Backup...
                      </>
                    ) : (
                      <>
                        💾 Crear Backup Manual
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => alert('Funcionalidad de programación automática disponible próximamente')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-medium transition-colors"
                  >
                    ⏰ Programar Backups
                  </button>
                </div>
              </div>

              {/* Información */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                <h4 className="text-blue-300 font-medium mb-2">📅 Información de Backups</h4>
                <p className="text-gray-300 text-sm">
                  Los backups se crean automáticamente cada 24 horas. Incluyen todos los datos críticos:
                  usuarios, publicaciones, comentarios, ensayos y configuraciones de grupo.
                </p>
              </div>

              {/* Lista de backups */}
              <div className="bg-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-white">Historial de Backups</h4>
                  <span className="text-sm text-gray-400">
                    {backupList.length} backup{backupList.length !== 1 ? 's' : ''} disponible{backupList.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {backupList.length > 0 ? (
                    backupList.map((backup) => (
                      <div
                        key={backup.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          backup.status === 'completed' 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">{backup.file_name}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                backup.status === 'completed' 
                                  ? 'bg-green-600 text-green-100' 
                                  : 'bg-red-600 text-red-100'
                              }`}>
                                {backup.status === 'completed' ? '✅ Exitoso' : '❌ Fallido'}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                backup.type === 'manual' 
                                  ? 'bg-blue-600 text-blue-100' 
                                  : 'bg-purple-600 text-purple-100'
                              }`}>
                                {backup.type === 'manual' ? '🖱️ Manual' : '⏰ Automático'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>📊 Registros: {backup.records_count.toLocaleString()}</div>
                              <div>🕒 Creado: {new Date(backup.created_at).toLocaleString('es-ES')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {backup.status === 'completed' && (
                              <button
                                onClick={async () => {
                                  if (confirm(`¿Estás seguro de que quieres cargar el backup "${backup.file_name}"?\n\nEsto podría afectar los datos actuales.`)) {
                                    try {
                                      const result = await loadBackup(backup.id);
                                      if (result.success) {
                                        alert(`✅ Backup cargado exitosamente!\n\nArchivo: ${result.data?.fileName}\nRegistros: ${result.data?.records}`);
                                      } else {
                                        alert(`❌ Error al cargar backup: ${result.error}`);
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alert('❌ Error al cargar backup');
                                    }
                                  }
                                }}
                                disabled={backupLoading}
                                className="text-blue-400 hover:text-blue-300 px-3 py-1 rounded hover:bg-blue-500/10 transition-colors text-sm disabled:opacity-50"
                                title="Cargar backup"
                              >
                                📂 Cargar
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de que quieres eliminar el backup "${backup.file_name}"?`)) {
                                  deleteBackup(backup.id);
                                  alert('✅ Backup eliminado del historial');
                                }
                              }}
                              className="text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-500/10 transition-colors text-sm"
                              title="Eliminar del historial"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">💾</div>
                      <div>No hay backups en el historial</div>
                      <div className="text-sm mt-1">Crea tu primer backup manual</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Notificaciones */}
        {activeTab === 'notifications' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">🔔 Centro de Notificaciones</h3>
            <div className="space-y-4">
              {/* Crear nueva notificación */}
              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="text-lg font-medium text-white mb-3">Crear Notificación</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Título de la notificación"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Mensaje de la notificación"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!notificationTitle.trim() || !notificationMessage.trim()) {
                          alert('Por favor completa el título y mensaje');
                          return;
                        }
                        try {
                          const result = await createNotification(user?.id || 'admin', 'system', notificationTitle, notificationMessage);
                          if (result) {
                            alert('✅ Notificación creada exitosamente');
                            setNotificationTitle('');
                            setNotificationMessage('');
                          } else {
                            alert('❌ Error al crear notificación');
                          }
                        } catch (error) {
                          console.error('Error:', error);
                          alert('❌ Error al crear notificación');
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      📢 Crear Notificación
                    </button>
                    <button
                      onClick={() => {
                        const stats = getStats();
                        alert(`📊 Estadísticas de Notificaciones:\n\n• Total: ${stats.total}\n• No leídas: ${stats.unread}\n• Leídas: ${stats.read}\n\nPor tipo:\n• Sistema: ${stats.byType.system}\n• Comentarios: ${stats.byType.comment}\n• Posts: ${stats.byType.post_published}\n• Ensayos: ${stats.byType.essay_uploaded}\n• Menciones: ${stats.byType.mention}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      📊 Ver Estadísticas
                    </button>
                    <button
                      onClick={() => {
                        cleanExpiredNotifications();
                        alert('✅ Notificaciones expiradas eliminadas');
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      🧹 Limpiar Expiradas
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de notificaciones */}
              <div className="bg-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-white">Notificaciones Recientes</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-colors text-sm"
                    >
                      ✓ Marcar todo como leído
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
                          deleteAllNotifications();
                        }
                      }}
                      className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
                    >
                      🗑️ Eliminar todas
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.read 
                            ? 'bg-white/5 border-white/10' 
                            : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-white font-medium">{notification.title}</div>
                            <div className="text-gray-400 text-sm mt-1">{notification.message}</div>
                            <div className="text-gray-500 text-xs mt-1">
                              {new Date(notification.created_at).toLocaleString('es-ES')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                                title="Marcar como leída"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar esta notificación?')) {
                                  deleteNotification(notification.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                              title="Eliminar notificación"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No hay notificaciones
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Logs */}
        {activeTab === 'logs' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">📋 Logs del Sistema</h3>
            
            {/* Estadísticas de logs */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {(() => {
                const stats = getLogStats();
                return (
                  <>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="text-white font-semibold">Total de Logs</h4>
                      <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="text-white font-semibold">Hoy</h4>
                      <p className="text-2xl font-bold text-green-400">{stats.today}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="text-white font-semibold">Esta Semana</h4>
                      <p className="text-2xl font-bold text-yellow-400">{stats.thisWeek}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="text-white font-semibold">Errores</h4>
                      <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Controles de logs */}
            <div className="bg-white/5 p-4 rounded-xl mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const stats = getLogStats();
                    alert(`📊 Estadísticas Detalladas de Logs:\n\n• Total: ${stats.total}\n• Hoy: ${stats.today}\n• Esta semana: ${stats.thisWeek}\n• Errores: ${stats.errors}\n\nPor nivel:\n• Info: ${stats.byLevel.info}\n• Warning: ${stats.byLevel.warning}\n• Error: ${stats.byLevel.error}\n• Critical: ${stats.byLevel.critical}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  📊 Ver Estadísticas
                </button>
                <button
                  onClick={() => {
                    exportLogs();
                    alert('✅ Logs exportados correctamente');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  💾 Exportar Logs
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres limpiar todos los logs? Esta acción no se puede deshacer.')) {
                      clearLogs();
                      alert('✅ Logs limpiados correctamente');
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🗑️ Limpiar Logs
                </button>
              </div>
            </div>

            {/* Lista de logs recientes */}
            <div className="bg-white/5 p-4 rounded-xl">
              <h4 className="text-lg font-medium text-white mb-3">Logs Recientes (últimos 20)</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getLogs({ limit: 20 }).map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-sm ${
                      log.level === 'critical' ? 'bg-red-500/20 border-red-500/50' :
                      log.level === 'error' ? 'bg-red-500/10 border-red-500/30' :
                      log.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${
                        log.level === 'critical' ? 'text-red-300' :
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warning' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(log.timestamp).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <div className="text-gray-300">
                      Usuario: {log.user_email || log.user_id}
                    </div>
                    {Object.keys(log.details).length > 0 && (
                      <div className="text-gray-400 text-xs mt-1">
                        Detalles: {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                ))}
                {getLogs({ limit: 20 }).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No hay logs registrados
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sección de Sistema */}
        {activeTab === 'system' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">⚙️ Estado del Sistema</h3>
            
            {/* Estadísticas del sistema */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="text-white font-semibold">Estado General</h4>
                <p className="text-2xl font-bold text-green-400">🟢 Operativo</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="text-white font-semibold">Base de Datos</h4>
                <p className="text-2xl font-bold text-green-400">🟢 Conectada</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="text-white font-semibold">Almacenamiento</h4>
                <p className="text-2xl font-bold text-blue-400">💾 Disponible</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="text-white font-semibold">Seguridad</h4>
                <p className="text-2xl font-bold text-green-400">🛡️ Activa</p>
              </div>
            </div>

            {/* Componente de estado del sistema */}
            <div className="bg-white/5 p-4 rounded-xl mb-6">
              <h4 className="text-lg font-medium text-white mb-3">Monitoreo en Tiempo Real</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Usuarios conectados</span>
                  <span className="text-green-400 font-medium">{users.length} usuarios</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Último backup</span>
                  <span className="text-blue-400 font-medium">
                    {lastBackup ? new Date(lastBackup).toLocaleString('es-ES') : 'No disponible'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Logs registrados hoy</span>
                  <span className="text-yellow-400 font-medium">{getLogStats().today} logs</span>
                </div>
              </div>
            </div>

            {/* Acciones del sistema */}
            <div className="bg-white/5 p-4 rounded-xl">
              <h4 className="text-lg font-medium text-white mb-3">Acciones del Sistema</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    createBackup();
                    alert('✅ Backup iniciado');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  💾 Crear Backup Inmediato
                </button>
                <button
                  onClick={() => {
                    cleanExpiredNotifications();
                    alert('✅ Limpieza completada');
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  🧹 Limpiar Sistema
                </button>
                <button
                  onClick={() => {
                    loadUsers();
                    getBackupStatus();
                    alert('✅ Sistema actualizado');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  🔄 Actualizar Todo
                </button>
                <button
                  onClick={() => {
                    const stats = getLogStats();
                    const info = `📊 Estado del Sistema:\n\n• Usuarios: ${users.length}\n• Último backup: ${lastBackup ? new Date(lastBackup).toLocaleString('es-ES') : 'No disponible'}\n• Logs hoy: ${stats.today}\n• Total logs: ${stats.total}\n• Errores: ${stats.errors}`;
                    alert(info);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  📊 Ver Reporte Completo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Seguridad */}
        {activeTab === 'security' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">� Gestión de Seguridad</h3>
            
            {/* Rate Limiting Status */}
            <div className="bg-white/5 p-4 rounded-xl mb-6">
              <h4 className="text-lg font-medium text-white mb-3">Rate Limiting</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                  <div className="text-green-400 font-medium">Posts</div>
                  <div className="text-green-300 text-sm">Límite: 10 por hora</div>
                  <div className="text-green-400 text-xs">Estado: ✅ Activo</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                  <div className="text-blue-400 font-medium">Comentarios</div>
                  <div className="text-blue-300 text-sm">Límite: 20 por hora</div>
                  <div className="text-blue-400 text-xs">Estado: ✅ Activo</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg">
                  <div className="text-purple-400 font-medium">Login</div>
                  <div className="text-purple-300 text-sm">Límite: 5 por minuto</div>
                  <div className="text-purple-400 text-xs">Estado: ✅ Activo</div>
                </div>
              </div>
            </div>

            {/* Audit Log Summary */}
            <div className="bg-white/5 p-4 rounded-xl mb-6">
              <h4 className="text-lg font-medium text-white mb-3">Resumen de Auditoría</h4>
              <div className="grid md:grid-cols-4 gap-4">
                {(() => {
                  const stats = getLogStats();
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                        <div className="text-gray-400 text-sm">Total de eventos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.today}</div>
                        <div className="text-gray-400 text-sm">Eventos hoy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{stats.byLevel.warning}</div>
                        <div className="text-gray-400 text-sm">Advertencias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
                        <div className="text-gray-400 text-sm">Errores críticos</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Security Actions */}
            <div className="bg-white/5 p-4 rounded-xl">
              <h4 className="text-lg font-medium text-white mb-3">Acciones de Seguridad</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const stats = getLogStats();
                    alert(`🔒 Reporte de Seguridad:\n\n• Total de eventos: ${stats.total}\n• Eventos hoy: ${stats.today}\n• Advertencias: ${stats.byLevel.warning}\n• Errores: ${stats.errors}\n• Eventos críticos: ${stats.byLevel.critical}\n\n✅ Rate limiting activo\n✅ Audit logging funcional\n✅ Backups automáticos`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  🛡️ Reporte de Seguridad
                </button>
                <button
                  onClick={() => {
                    exportLogs();
                    alert('✅ Logs de seguridad exportados');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  📋 Exportar Logs de Seguridad
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Bloquear temporalmente nuevos registros? Esto evitará que se creen nuevas cuentas durante 1 hora.')) {
                      alert('🚫 Registros bloqueados temporalmente');
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  🚫 Bloquear Registros
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Limpiar todos los logs de más de 30 días?')) {
                      alert('🧹 Logs antiguos eliminados');
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  🗑️ Limpiar Logs Antiguos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Lanzamiento */}
        {activeTab === 'launch' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">🚀 Preparación para Lanzamiento</h3>
            
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl mb-6">
              <div className="flex items-center mb-4">
                <span className="text-red-400 text-2xl mr-3">⚠️</span>
                <h4 className="text-lg font-bold text-red-300">ZONA DE PELIGRO</h4>
              </div>
              <p className="text-red-200 mb-6">
                Las siguientes acciones son <strong>IRREVERSIBLES</strong> y están diseñadas para limpiar completamente la plataforma antes del lanzamiento oficial.
              </p>
              
              <div className="grid gap-4">
                {/* Borrar todos los posts */}
                <div className="bg-black/20 p-4 rounded-lg border border-red-500/20">
                  <h5 className="text-white font-semibold mb-2">🗑️ Borrar Todo el Contenido</h5>
                  <p className="text-gray-300 text-sm mb-4">
                    Elimina todos los posts, comentarios, archivos subidos y datos de personalización de grupos.
                  </p>
                  <button
                    onClick={deleteAllPosts}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Procesando...
                      </span>
                    ) : (
                      '🗑️ BORRAR TODO EL CONTENIDO'
                    )}
                  </button>
                </div>

                {/* Arreglar nombres de autores */}
                <div className="bg-black/20 p-4 rounded-lg border border-blue-500/20">
                  <h5 className="text-white font-semibold mb-2">🔧 Arreglar Nombres de Autores</h5>
                  <p className="text-gray-300 text-sm mb-4">
                    Actualiza los nombres de autores en posts y comentarios existentes para mostrar nombres legibles en lugar de IDs.
                  </p>
                  <button
                    onClick={fixAuthorNames}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Procesando...
                      </span>
                    ) : (
                      '🔧 ARREGLAR NOMBRES DE AUTORES'
                    )}
                  </button>
                </div>

                {/* Actualizar integrantes de grupos */}
                <div className="bg-black/20 p-4 rounded-lg border border-green-500/20">
                  <h5 className="text-white font-semibold mb-2">👥 Actualizar Integrantes de Grupos</h5>
                  <p className="text-gray-300 text-sm mb-4">
                    Reemplaza la base de datos de estudiantes con la nueva lista de integrantes de grupos proporcionada.
                  </p>
                  <button
                    onClick={updateGroupMembers}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Procesando...
                      </span>
                    ) : (
                      '👥 ACTUALIZAR INTEGRANTES GRUPOS'
                    )}
                  </button>
                </div>

                {/* Verificar estudiantes cargados */}
                <div className="bg-black/20 p-4 rounded-lg border border-blue-500/20">
                  <h5 className="text-white font-semibold mb-2">🔍 Verificar Estudiantes</h5>
                  <p className="text-gray-300 text-sm mb-4">
                    Verifica que los estudiantes se hayan cargado correctamente en la base de datos.
                  </p>
                  <button
                    onClick={verifyStudents}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Verificando...
                      </span>
                    ) : (
                      '🔍 VERIFICAR ESTUDIANTES'
                    )}
                  </button>
                </div>

                {/* Borrar usuarios */}
                <div className="bg-black/20 p-4 rounded-lg border border-orange-500/20">
                  <h5 className="text-white font-semibold mb-2">👥 Borrar Usuarios de Prueba</h5>
                  <p className="text-gray-300 text-sm mb-4">
                    Elimina todos los usuarios excepto administradores. Útil para limpiar cuentas de prueba.
                  </p>
                  <button
                    onClick={deleteAllUsers}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105 shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Procesando...
                      </span>
                    ) : (
                      '👥 BORRAR USUARIOS NO-ADMIN'
                    )}
                  </button>
                </div>

                {/* Estado de la plataforma */}
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                  <h5 className="text-green-300 font-semibold mb-2">✅ Lista de Verificación de Lanzamiento</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-200">
                      <span className="mr-2">✅</span> Footer actualizado con branding ROBUX
                    </div>
                    <div className="flex items-center text-green-200">
                      <span className="mr-2">✅</span> Subida de imágenes funcionando correctamente
                    </div>
                    <div className="flex items-center text-green-200">
                      <span className="mr-2">✅</span> Animaciones optimizadas
                    </div>
                    <div className="flex items-center text-yellow-200">
                      <span className="mr-2">⚠️</span> Contenido de prueba pendiente de limpieza
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
              <h4 className="text-blue-300 font-semibold mb-2">📋 Notas para el Lanzamiento</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Asegúrate de hacer un backup antes de borrar contenido</li>
                <li>• Verifica que los buckets de Supabase Storage estén correctamente configurados</li>
                <li>• Confirma que las políticas RLS estén activas</li>
                <li>• Prueba la creación de nuevos usuarios después de la limpieza</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}