'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { getSupabase } from '../lib/supabaseClient';

interface HomePageEditorProps {
  isEditMode: boolean;
  onToggleEdit: () => void;
}

export default function HomePageEditor({ isEditMode, onToggleEdit }: HomePageEditorProps) {
  const { user, role } = useAuth();
  const [homeContent, setHomeContent] = useState({
    title: 'Foro Académico',
  subtitle: 'Robux: plataforma colaborativa para grupos y proyectos',
    welcomeMessage: 'Explora los diferentes grupos académicos y participa en las discusiones'
  });
  const [loading, setLoading] = useState(false);

  // Solo administradores pueden editar la página de inicio principal
  const canEdit = role === 'admin';

  const handleSave = async () => {
    if (!canEdit) return;
    
    setLoading(true);
    try {
      // Simular guardado (podrías usar localStorage o una tabla de configuración)
      localStorage.setItem('homePageContent', JSON.stringify(homeContent));
      alert('✅ Contenido de la página de inicio guardado');
      onToggleEdit();
    } catch (error) {
      console.error('Error saving home content:', error);
      alert('❌ Error al guardar el contenido');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Recargar desde localStorage si existe
    const saved = localStorage.getItem('homePageContent');
    if (saved) {
      setHomeContent(JSON.parse(saved));
    }
    onToggleEdit();
  };

  // Cargar contenido guardado al montar
  useEffect(() => {
    const saved = localStorage.getItem('homePageContent');
    if (saved) {
      setHomeContent(JSON.parse(saved));
    }
  }, []);

  if (!canEdit && !isEditMode) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Botón de edición para admins/delegados */}
      {canEdit && !isEditMode && (
        <div className="text-center mb-4">
          <button
            onClick={onToggleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ✏️ Editar Página de Inicio
          </button>
        </div>
      )}

      {/* Panel de edición */}
      {isEditMode && canEdit && (
        <div className="glass p-6 rounded-2xl border border-blue-500/30 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">✏️ Editar Contenido de Inicio</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Título Principal</label>
              <input
                type="text"
                value={homeContent.title}
                onChange={(e) => setHomeContent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Subtítulo</label>
              <input
                type="text"
                value={homeContent.subtitle}
                onChange={(e) => setHomeContent(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Mensaje de Bienvenida</label>
              <textarea
                value={homeContent.welcomeMessage}
                onChange={(e) => setHomeContent(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa del contenido (solo visible en modo edición) */}
      {isEditMode && (
        <div className="glass p-6 rounded-2xl border border-purple-500/30">
          <h4 className="text-lg font-medium text-white mb-4">👁️ Vista Previa</h4>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black text-white">
              {homeContent.title.split(' ').map((word, i) => 
                i === 1 ? (
                  <span key={i} className="bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                    {word}
                  </span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </h1>
            <p className="text-xl text-gray-300">{homeContent.subtitle}</p>
            <p className="text-gray-400">{homeContent.welcomeMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}