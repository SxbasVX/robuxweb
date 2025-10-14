import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  expires_at: string;
}

interface User {
  id: string;
  email: string;
  display_name?: string;
  grupo?: string;
}

const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'system',
    title: '',
    message: '',
    recipient: 'all', // 'all', 'group', 'specific'
    targetGroup: '',
    targetUser: '',
    priority: 'normal'
  });

  // Cargar notificaciones existentes
  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, users!notifications_user_id_fkey(email, display_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, grupo')
        .order('display_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Crear notificación
  const createNotification = async () => {
    if (!createForm.title || !createForm.message) {
      alert('Título y mensaje son requeridos');
      return;
    }

    setLoading(true);
    try {
      const notificationData = {
        type: createForm.type,
        title: createForm.title,
        message: createForm.message,
        data: JSON.stringify({
          priority: createForm.priority,
          created_by: 'admin',
          broadcast: createForm.recipient === 'all'
        })
      };

      if (createForm.recipient === 'all') {
        // Crear notificación para todos los usuarios
        const { data: allUsers } = await supabase
          .from('users')
          .select('id');

        for (const user of allUsers || []) {
          await supabase.rpc('create_notification', {
            p_user_id: user.id,
            p_type: notificationData.type,
            p_title: notificationData.title,
            p_message: notificationData.message,
            p_data: notificationData.data
          });
        }
      } else if (createForm.recipient === 'group' && createForm.targetGroup) {
        // Crear notificación para un grupo específico
        const { data: groupUsers } = await supabase
          .from('users')
          .select('id')
          .eq('grupo', createForm.targetGroup);

        for (const user of groupUsers || []) {
          await supabase.rpc('create_notification', {
            p_user_id: user.id,
            p_type: notificationData.type,
            p_title: notificationData.title,
            p_message: notificationData.message,
            p_data: notificationData.data
          });
        }
      } else if (createForm.recipient === 'specific' && createForm.targetUser) {
        // Crear notificación para un usuario específico
        await supabase.rpc('create_notification', {
          p_user_id: createForm.targetUser,
          p_type: notificationData.type,
          p_title: notificationData.title,
          p_message: notificationData.message,
          p_data: notificationData.data
        });
      }

      // Limpiar formulario
      setCreateForm({
        type: 'system',
        title: '',
        message: '',
        recipient: 'all',
        targetGroup: '',
        targetUser: '',
        priority: 'normal'
      });

      // Recargar notificaciones
      await loadNotifications();
      alert('Notificación(es) creada(s) exitosamente');

    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Error al crear notificación');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta notificación?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error al eliminar notificación');
    }
  };

  // Obtener estadísticas
  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, byType };
  };

  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, []);

  const stats = getStats();
  const groups = Array.from(new Set(users.map(u => u.grupo).filter(Boolean)));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <span className="text-blue-500">⚠️</span>;
      case 'comment': return <span className="text-green-500">💬</span>;
      case 'post_published': return <span className="text-purple-500">📝</span>;
      default: return <span className="text-gray-500">🔔</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Notificaciones</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <span className="text-3xl">🔔</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">No Leídas</p>
              <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
            </div>
            <span className="text-3xl text-red-500">⚠️</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <span className="text-3xl text-green-500">👥</span>
          </div>
        </div>
      </div>

      {/* Formulario de creación */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="mr-2">📤</span>
          Crear Nueva Notificación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="system">Sistema</option>
              <option value="announcement">Anuncio</option>
              <option value="reminder">Recordatorio</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prioridad</label>
            <select
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Destinatario</label>
            <select
              value={createForm.recipient}
              onChange={(e) => setCreateForm({ ...createForm, recipient: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">Todos los usuarios</option>
              <option value="group">Grupo específico</option>
              <option value="specific">Usuario específico</option>
            </select>
          </div>

          {createForm.recipient === 'group' && (
            <div>
              <label className="block text-sm font-medium mb-2">Grupo</label>
              <select
                value={createForm.targetGroup}
                onChange={(e) => setCreateForm({ ...createForm, targetGroup: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Seleccionar grupo...</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          )}

          {createForm.recipient === 'specific' && (
            <div>
              <label className="block text-sm font-medium mb-2">Usuario</label>
              <select
                value={createForm.targetUser}
                onChange={(e) => setCreateForm({ ...createForm, targetUser: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Seleccionar usuario...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.display_name || user.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Título de la notificación..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Mensaje</label>
            <textarea
              value={createForm.message}
              onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
              className="w-full p-2 border rounded-lg h-24"
              placeholder="Contenido de la notificación..."
            />
          </div>
        </div>

        <button
          onClick={createNotification}
          disabled={loading || !createForm.title || !createForm.message}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <span className="mr-2">📤</span>
          {loading ? 'Enviando...' : 'Enviar Notificación'}
        </button>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Notificaciones Recientes</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-5xl opacity-50 mb-4 block">🔔</span>
              <p>No hay notificaciones</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className="p-4 border-b hover:bg-gray-50 flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                          No leída
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()} • {notification.type}
                    </div>
                  </div>
                </div>
                <span 
                  onClick={() => deleteNotification(notification.id)}
                  className="text-red-500 hover:text-red-700 cursor-pointer p-1" 
                  title="Eliminar notificación"
                >
                  ❌
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;