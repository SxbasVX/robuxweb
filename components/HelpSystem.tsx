'use client';
import { useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';

export default function HelpSystem() {
  const [activeSection, setActiveSection] = useState('general');
  const { role } = useAuth();

  const helpSections = {
    general: {
      title: '📖 Ayuda General',
      items: [
        {
          question: '¿Cómo creo una cuenta?',
          answer: 'Haz clic en "Iniciar Sesión" y luego en "Registrarse". Completa tus datos y verifica tu email.'
        },
        {
          question: '¿Cómo me uno a un grupo?',
          answer: 'Un administrador o delegado debe asignarte a un grupo. Contacta a tu profesor.'
        },
        {
          question: '¿Cómo subo un ensayo?',
          answer: 'Ve a tu grupo, pestaña "Integrantes", busca tu perfil y usa el botón "Subir Ensayo".'
        }
      ]
    },
    students: {
      title: '👨‍🎓 Para Estudiantes',
      items: [
        {
          question: '¿Cómo publico contenido?',
          answer: 'Ve a tu grupo, pestaña "Publicaciones" y usa el compositor para crear posts.'
        },
        {
          question: '¿Puedo editar mis publicaciones?',
          answer: 'Solo puedes crear borradores. Un delegado debe aprobar las publicaciones.'
        },
        {
          question: '¿Cómo veo mi progreso?',
          answer: 'Ve a "Perfil" para ver estadísticas de tus ensayos, posts y actividad.'
        }
      ]
    },
    delegates: {
      title: '👨‍🏫 Para Delegados',
      items: [
        {
          question: '¿Cómo gestiono estudiantes?',
          answer: 'En tu grupo, pestaña "Integrantes", puedes ver y gestionar todo el contenido de estudiantes.'
        },
        {
          question: '¿Cómo publico posts de estudiantes?',
          answer: 'En "Publicaciones", verás borradores que puedes aprobar y publicar.'
        },
        {
          question: '¿Cómo edito el inicio del grupo?',
          answer: 'En "Inicio" del grupo, activa el modo edición si tienes permisos.'
        }
      ]
    },
    admins: {
      title: '⚙️ Para Administradores',
      items: [
        {
          question: '¿Cómo gestiono usuarios?',
          answer: 'Ve a "/admin" para acceder al panel completo de administración.'
        },
        {
          question: '¿Cómo hago backups?',
          answer: 'En el panel de admin, pestaña "Backups", puedes crear y restaurar backups.'
        },
        {
          question: '¿Cómo envío notificaciones?',
          answer: 'En el panel de admin, pestaña "Notificaciones", puedes crear notificaciones del sistema.'
        }
      ]
    }
  };

  const contactInfo = {
    email: 'soporte@foro-academico.com',
    phone: '+1 (555) 123-4567',
    hours: 'Lunes a Viernes: 9:00 AM - 6:00 PM'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🆘 Centro de Ayuda</h1>
          <p className="text-gray-300">Encuentra respuestas a tus preguntas más frecuentes</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navegación lateral */}
          <div className="lg:col-span-1">
            <div className="glass bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Categorías</h3>
              <div className="space-y-2">
                {Object.entries(helpSections).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                      activeSection === key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Información de contacto */}
            <div className="glass bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">📞 Contacto</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Email:</span>
                  <div className="text-blue-400">{contactInfo.email}</div>
                </div>
                <div>
                  <span className="text-gray-400">Teléfono:</span>
                  <div className="text-white">{contactInfo.phone}</div>
                </div>
                <div>
                  <span className="text-gray-400">Horarios:</span>
                  <div className="text-white">{contactInfo.hours}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <div className="glass bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {helpSections[activeSection as keyof typeof helpSections].title}
              </h2>

              <div className="space-y-6">
                {helpSections[activeSection as keyof typeof helpSections].items.map((item, index) => (
                  <div key={index} className="border-b border-white/10 pb-6 last:border-b-0">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {item.question}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sección adicional para administradores */}
              {role === 'admin' && activeSection === 'admins' && (
                <div className="mt-8 p-6 bg-yellow-600/20 border border-yellow-500/50 rounded-lg">
                  <h3 className="text-yellow-300 font-semibold mb-3">⚠️ Funciones Avanzadas</h3>
                  <ul className="text-yellow-100 space-y-2 text-sm">
                    <li>• Acceso completo a la base de datos a través del panel de admin</li>
                    <li>• Capacidad de eliminar usuarios y contenido</li>
                    <li>• Gestión de roles y permisos de todos los usuarios</li>
                    <li>• Creación y restauración de backups del sistema</li>
                    <li>• Envío de notificaciones del sistema a todos los usuarios</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de búsqueda rápida */}
        <div className="mt-8 glass bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🔍 ¿No encuentras lo que buscas?</h3>
          <p className="text-gray-300 mb-4">
            Puedes buscar en todo el contenido o contactarnos directamente.
          </p>
          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
              📧 Enviar Consulta
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
              💬 Chat en Vivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}