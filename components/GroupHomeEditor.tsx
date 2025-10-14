'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabaseClient';

interface GroupHomeData {
  id: string;
  group_id: number;
  title: string;
  description: string;
  background_image?: string;
  logo_image?: string;
  custom_sections: Array<{
    id: string;
    type: 'text' | 'image' | 'video' | 'announcement';
    title: string;
    content: string;
    image_url?: string;
    order: number;
  }>;
  theme_color: string;
  created_at: string;
  updated_at: string;
}

interface GroupHomeEditorProps {
  groupId: number;
  currentUser: any;
  isEditMode: boolean;
  onToggleEdit: () => void;
  groupTopic: string;
}

export default function GroupHomeEditor({
  groupId,
  currentUser,
  isEditMode,
  onToggleEdit,
  groupTopic,
}: GroupHomeEditorProps) {
  const [homeData, setHomeData] = useState<GroupHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null); // ✅
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const [newSection, setNewSection] = useState({
    type: 'text' as const,
    title: '',
    content: '',
  });

  // ===== LOAD DATA =====
  useEffect(() => {
    loadHomeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadHomeData = async () => {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('group_home_data')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (error) {
        console.log('No hay datos o tabla no existe, usando defaults:', error.message);
        const defaultData: GroupHomeData = {
          id: `temp_${groupId}`,
          group_id: groupId,
          title: `Grupo ${groupId}`,
          description: groupTopic,
          custom_sections: [
            {
              id: 'welcome',
              type: 'announcement',
              title: '¡Bienvenidos!',
              content:
                'Los delegados del grupo están trabajando en personalizar esta página.',
              order: 0,
            },
          ],
          theme_color: '#7C3AED',
          background_image: undefined,
          logo_image: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setHomeData(defaultData);
        return;
      }

      if (data) setHomeData(data as GroupHomeData);
    } catch (err) {
      console.error('Error in loadHomeData:', err);
      const fallbackData: GroupHomeData = {
        id: `fallback_${groupId}`,
        group_id: groupId,
        title: `Grupo ${groupId}`,
        description: groupTopic,
        custom_sections: [],
        theme_color: '#7C3AED',
        background_image: undefined,
        logo_image: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setHomeData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // ===== SAVE (debounced) =====
  const updateHomeData = async (updates: Partial<GroupHomeData>) => {
    if (!homeData) return;

    console.log('🔄 Guardando cambios:', updates);
    setIsSaving(true);

    // Si es temporal/fallback, guarda localmente
    if (homeData.id.startsWith('temp_') || homeData.id.startsWith('fallback_')) {
      const updatedData = {
        ...homeData,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      setHomeData(updatedData);
      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
      setIsSaving(false);
      return;
    }

    try {
      const supabase = getSupabase();

      const { id, group_id, ...homeDataWithoutId } = homeData;
      const finalId =
        homeData.id.startsWith('temp_') || homeData.id.startsWith('fallback_')
          ? `group_${homeData.group_id}`
          : homeData.id;

      const dataToUpsert = {
        id: finalId,
        group_id: homeData.group_id,
        ...homeDataWithoutId,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Datos a guardar en Supabase:', dataToUpsert);

      const { error } = await supabase
        .from('group_home_data')
        .upsert(dataToUpsert, {
          onConflict: 'group_id',
          ignoreDuplicates: false,
        });

      if (error) throw error;

      const updatedData = {
        ...homeData,
        ...updates,
        id: dataToUpsert.id,
        updated_at: new Date().toISOString(),
      };
      setHomeData(updatedData);
      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      alert('❌ Error al guardar los cambios: ' + (err?.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = useCallback(
    (updates: Partial<GroupHomeData>) => {
      setHasUnsavedChanges(true);
      if (saveTimeout) clearTimeout(saveTimeout);
      const t = setTimeout(() => {
        updateHomeData(updates);
      }, 1000);
      setSaveTimeout(t);
    },
    [saveTimeout, updateHomeData]
  );

  const saveNow = async () => {
    console.log('💾 Guardado manual iniciado');
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    if (homeData && hasUnsavedChanges) {
      await updateHomeData(homeData);
    } else {
      console.log('⚠️ No hay cambios para guardar o homeData es null');
    }
  };

  // ===== Upload helpers =====
  const uploadImage = async (
    file: File,
    type: 'background' | 'logo' | 'section'
  ) => {
    if (!file) return null;

    setUploading(true);
    try {
      const supabase = getSupabase();

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB.');
      }
      const allowed = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      if (!allowed.includes(file.type)) {
        throw new Error(
          'Tipo de archivo no válido. Solo imágenes (JPG, PNG, WebP, GIF).'
        );
      }

      const fileName = `${type}_${groupId}_${Date.now()}_${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        '_'
      )}`;
      const filePath = `group-decoration/${fileName}`;

      let bucket = 'grupos';
      let uploadResult = await supabase.storage.from(bucket).upload(filePath, file);
      if (uploadResult.error) {
        console.log('❌ Error bucket "grupos", probando "public"');
        bucket = 'public';
        uploadResult = await supabase.storage.from(bucket).upload(filePath, file);
        if (uploadResult.error) throw uploadResult.error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('❌ Error al subir imagen:', err);
      alert(`❌ Error al subir la imagen: ${err?.message || String(err)}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleBackgroundUpload = async (file: File) => {
    const imageUrl = await uploadImage(file, 'background');
    if (imageUrl) updateHomeData({ background_image: imageUrl });
  };

  const handleLogoUpload = async (file: File) => {
    const imageUrl = await uploadImage(file, 'logo');
    if (imageUrl) updateHomeData({ logo_image: imageUrl });
  };

  const addSection = async () => {
    if (!homeData || !newSection.title.trim()) return;
    const section = {
      id: `section_${Date.now()}`,
      type: newSection.type,
      title: newSection.title,
      content: newSection.content,
      order: homeData.custom_sections.length,
      image_url: undefined,
    };
    const updatedSections = [...homeData.custom_sections, section];
    await updateHomeData({ custom_sections: updatedSections });
    setNewSection({ type: 'text', title: '', content: '' });
  };

  const removeSection = async (sectionId: string) => {
    if (!homeData) return;
    const updatedSections = homeData.custom_sections.filter((s) => s.id !== sectionId);
    await updateHomeData({ custom_sections: updatedSections });
  };

  const addSectionImage = async (sectionId: string, file: File) => {
    if (!homeData) return;
    const imageUrl = await uploadImage(file, 'section');
    if (imageUrl) {
      const updatedSections = homeData.custom_sections.map((s) =>
        s.id === sectionId ? { ...s, image_url: imageUrl } : s
      );
      await updateHomeData({ custom_sections: updatedSections });
    }
  };

  // ===== PERMISSIONS =====
  const canEdit =
    currentUser &&
    (currentUser.role === 'admin' ||
      (currentUser.role === 'delegado' && currentUser.group === groupId));

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // ✅ estrechamiento: desde aquí homeData NO es null
  if (!homeData) {
    return (
      <div className="post-card p-6">
        <p className="text-white">No se pudo cargar la portada del grupo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles de edición */}
      {canEdit && (
        <div className="post-card p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isEditMode ? 'bg-red-500' : 'bg-green-500'
                }`}
              ></div>
              <span className="text-white font-medium">
                {isEditMode ? 'Modo Edición Activo' : 'Modo Vista'}
              </span>
              {hasUnsavedChanges && (
                <span className="text-yellow-400 text-sm">• Cambios sin guardar</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleEdit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isEditMode ? '✅ Finalizar Edición' : '✏️ Editar Página'}
              </button>
            </div>
          </div>

          {isEditMode && (
            <div
              className="flex justify-between items-center pt-2 border-t"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center space-x-4">
                <button
                  onClick={saveNow}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={`px-6 py-2 rounded-lg font-medium transition-all transform ${
                    hasUnsavedChanges && !isSaving
                      ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 shadow-lg'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>💾</span>
                      <span>Guardar Cambios</span>
                    </span>
                  )}
                </button>

                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm">
                  🔍 Debug
                </button>

                {showSaveSuccess && (
                  <div className="flex items-center space-x-2 text-green-400 animate-pulse">
                    <span>✅</span>
                    <span className="text-sm">¡Guardado exitosamente!</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400">
                {hasUnsavedChanges ? (
                  <span>Los cambios se guardan automáticamente</span>
                ) : (
                  <span>Todos los cambios están guardados</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <div
        className="relative rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center post-card"
        style={{
          backgroundImage: homeData.background_image
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${homeData.background_image})`
            : `linear-gradient(135deg, ${homeData.theme_color}20, ${homeData.theme_color}40)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center z-10">
          {homeData.logo_image && (
            <img
              src={homeData.logo_image}
              alt="Logo del grupo"
              className="mx-auto mb-6 h-24 w-24 object-cover rounded-full"
            />
          )}

          {isEditMode ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="post-card p-6">
                <label className="block text-white text-sm font-medium mb-2">
                  📝 Título del Grupo
                </label>
                <input
                  type="text"
                  value={homeData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setHomeData({ ...homeData, title: newTitle });
                    debouncedSave({ title: newTitle });
                  }}
                  className="w-full text-2xl font-bold text-white bg-white/10 border-2 border-white/30 rounded-lg px-4 py-3 text-center placeholder-white/50 focus:border-white/70 focus:outline-none"
                  placeholder="Escribe el título de tu grupo..."
                />
              </div>

              <div className="post-card p-6">
                <label className="block text-white text-sm font-medium mb-2">
                  📖 Descripción del Grupo
                </label>
                <textarea
                  value={homeData.description}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    setHomeData({ ...homeData, description: newDescription });
                    debouncedSave({ description: newDescription });
                  }}
                  className="w-full text-lg text-white bg-white/10 border-2 border-white/30 rounded-lg px-4 py-3 text-center placeholder-white/50 focus:border-white/70 focus:outline-none"
                  placeholder="Describe de qué trata tu grupo..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-white mb-4">{homeData.title}</h1>
              <p className="text-xl text-white/90 max-w-2xl">{homeData.description}</p>
            </>
          )}
        </div>

        {/* Botones de subida de imágenes */}
        {isEditMode && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-white text-xs mb-2 text-center">🎨 Personalizar</p>
              <div className="space-y-2">
                <label
                  className={`flex items-center space-x-2 px-3 py-2 text-white text-sm rounded-lg cursor-pointer transition-colors ${
                    uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <span>🖼️</span>
                      <span>Cambiar Fondo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleBackgroundUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>

                <label
                  className={`flex items-center space-x-2 px-3 py-2 text-white text-sm rounded-lg cursor-pointer transition-colors ${
                    uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <span>🏷️</span>
                      <span>Subir Logo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secciones personalizadas */}
      <div className="space-y-6">
        {homeData.custom_sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.id} className="post-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="space-y-2">
                      <label className="block text-white text-sm font-medium">
                        ✏️ Título de la Sección
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updatedSections = homeData.custom_sections.map((s) =>
                            s.id === section.id ? { ...s, title: e.target.value } : s
                          );
                          setHomeData({ ...homeData, custom_sections: updatedSections });
                          debouncedSave({ custom_sections: updatedSections });
                        }}
                        className="w-full text-lg font-bold text-white bg-slate-700/50 border-2 border-slate-500 rounded-lg px-3 py-2 placeholder-slate-400 focus:border-blue-400 focus:outline-none"
                        placeholder="Escribe el título de la sección..."
                      />
                    </div>
                  ) : (
                    <h3 className="text-xl font-bold text-white">{section.title}</h3>
                  )}
                </div>

                {isEditMode && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <label className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg cursor-pointer transition-colors">
                      <span>📷</span>
                      <span>Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] && addSectionImage(section.id, e.target.files[0])
                        }
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                    >
                      <span>🗑️</span>
                      <span>Eliminar</span>
                    </button>
                  </div>
                )}
              </div>

              {section.image_url && (
                <div className="section-image-wrapper">
                  <img src={section.image_url} alt={section.title} className="section-image" />
                </div>
              )}

              {isEditMode ? (
                <div className="space-y-2">
                  <label className="block text-white text-sm font-medium">
                    📝 Contenido de la Sección
                  </label>
                  <textarea
                    value={section.content}
                    onChange={(e) => {
                      const updatedSections = homeData.custom_sections.map((s) =>
                        s.id === section.id ? { ...s, content: e.target.value } : s
                      );
                      setHomeData({ ...homeData, custom_sections: updatedSections });
                      debouncedSave({ custom_sections: updatedSections });
                    }}
                    className="w-full bg-slate-700/50 text-white rounded-lg p-3 border-2 border-slate-500 placeholder-slate-400 focus:border-blue-400 focus:outline-none"
                    rows={4}
                    placeholder="Escribe el contenido de esta sección..."
                  />
                  <p className="text-xs text-slate-400">
                    💡 Tip: Puedes usar saltos de línea para organizar mejor tu contenido
                  </p>
                </div>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap">{section.content}</p>
              )}
            </div>
          ))}

        {/* Agregar nueva sección */}
        {isEditMode && (
          <div className="post-card p-6 border-dashed" style={{ borderWidth: 2 }}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-600 rounded-full p-2">
                <span className="text-xl">➕</span>
              </div>
              <h4 className="text-xl font-semibold text-white">Agregar Nueva Sección</h4>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    ✏️ Título de la Nueva Sección
                  </label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    placeholder="Ej: Bienvenida, Objetivos, Recursos..."
                    className="w-full bg-slate-700/70 text-white rounded-lg p-3 border-2 border-slate-500 placeholder-slate-400 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    🎨 Tipo de Sección
                  </label>
                  <select
                    value={newSection.type}
                    onChange={(e) =>
                      setNewSection({ ...newSection, type: e.target.value as any })
                    }
                    className="w-full bg-slate-700/70 text-white rounded-lg p-3 border-2 border-slate-500 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="text">📝 Texto Normal</option>
                    <option value="announcement">📢 Anuncio Destacado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  📝 Contenido Inicial (Opcional)
                </label>
                <textarea
                  value={newSection.content}
                  onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                  placeholder="Escribe el contenido inicial para esta sección..."
                  className="w-full bg-slate-700/70 text-white rounded-lg p-3 border-2 border-slate-500 placeholder-slate-400 focus:border-blue-400 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-slate-400 text-sm">
                  💡 Tip: Puedes editar y personalizar cada sección después de crearla
                </p>
                <button
                  onClick={addSection}
                  disabled={!newSection.title.trim()}
                  className={`px-6 py-3 rounded-lg font-medium transition-all transform ${
                    newSection.title.trim()
                      ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 shadow-lg'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>✨</span>
                    <span>Crear Sección</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay de subida */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white">Subiendo imagen...</p>
          </div>
        </div>
      )}
    </div>
  );
}
