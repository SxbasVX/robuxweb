'use client';
import { useState, useRef, memo } from 'react';
import { useAuth } from '../lib/auth-context';

interface InterventionManagerProps {
  groupId: number;
  members: string[];
  topic: string;
}

interface Intervention {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  methodology: string;
  timeline: {
    phase: string;
    description: string;
    duration: string;
    status: 'completed' | 'in-progress' | 'pending';
  }[];
  photos: {
    id: string;
    url: string;
    caption: string;
    uploadedBy: string;
    uploadedAt: Date;
  }[];
  participants: string[];
  location: string;
  startDate: Date;
  endDate?: Date;
  evidenceSubmitted: boolean;
  approvalStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  feedback?: string;
}

const InterventionManager = memo(function InterventionManager({ groupId, members, topic }: InterventionManagerProps) {
  const { user } = useAuth();
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  const mockIntervention: Intervention = {
    id: `intervention-${groupId}`,
    title: `Intervención Práctica: ${topic}`,
    description: `Implementación de estrategias educativas relacionadas con ${topic}. Esta intervención busca aplicar los conocimientos teóricos en un entorno real, documentando el proceso y los resultados obtenidos.`,
    objectives: [
      `Aplicar conceptos de ${topic} en la práctica`,
      'Documentar el proceso de implementación',
      'Evaluar la efectividad de las estrategias aplicadas',
      'Reflexionar sobre los aprendizajes obtenidos'
    ],
    methodology: 'Investigación-acción participativa con enfoque cualitativo. Se implementarán las estrategias definidas, se documentará el proceso mediante fotografías y observaciones, y se evaluarán los resultados a través de reflexiones grupales.',
    timeline: [
      {
        phase: 'Planificación',
        description: 'Definición de objetivos, metodología y cronograma',
        duration: '1 semana',
        status: 'completed'
      },
      {
        phase: 'Implementación',
        description: 'Ejecución de las estrategias planificadas',
        duration: '2 semanas',
        status: 'in-progress'
      },
      {
        phase: 'Documentación',
        description: 'Recopilación de evidencias fotográficas y observaciones',
        duration: '2 semanas',
        status: 'in-progress'
      },
      {
        phase: 'Evaluación',
        description: 'Análisis de resultados y reflexiones',
        duration: '1 semana',
        status: 'pending'
      }
    ],
    photos: [
      {
        id: 'photo-1',
        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
        caption: 'Inicio de la sesión de trabajo colaborativo',
        uploadedBy: members[0] || 'Usuario',
        uploadedAt: new Date('2024-01-15')
      },
      {
        id: 'photo-2',
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        caption: 'Participantes trabajando en grupos pequeños',
        uploadedBy: members[1] || 'Usuario',
        uploadedAt: new Date('2024-01-16')
      }
    ],
    participants: members,
    location: 'Aula 205, Edificio Principal',
    startDate: new Date('2024-01-15'),
    evidenceSubmitted: false,
    approvalStatus: 'draft'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300';
      case 'in-progress': return 'bg-blue-500/20 text-blue-300';
      case 'pending': return 'bg-gray-500/20 text-gray-300';
      case 'approved': return 'bg-green-500/20 text-green-300';
      case 'submitted': return 'bg-yellow-500/20 text-yellow-300';
      case 'rejected': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'in-progress': return 'En Progreso';
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'submitted': return 'Enviada';
      case 'rejected': return 'Rechazada';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setNewPhotoFiles(prev => [...prev, ...imageFiles]);
  };

  const handleAddEvidence = () => {
    if (newPhotoFiles.length === 0) return;
    
    console.log('Adding evidence photos:', newPhotoFiles);
    console.log('Caption:', newPhotoCaption);
    
    // Reset form
    setNewPhotoFiles([]);
    setNewPhotoCaption('');
    setIsAddingEvidence(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhotoFile = (index: number) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitEvidence = () => {
    console.log('Submitting intervention evidence for approval');
    // Here you would update the approval status
  };

  return (
    <div className="space-y-4">
      {/* Información básica del proyecto */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">{mockIntervention.title}</h3>
        <p className="text-gray-300 mb-4">{mockIntervention.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-400">Ubicación:</span>
            <span className="text-white ml-2">{mockIntervention.location}</span>
          </div>
          <div>
            <span className="text-gray-400">Estado:</span>
            <span className={`ml-2 px-2 py-1 rounded-lg text-xs ${getStatusColor(mockIntervention.approvalStatus)}`}>
              {getStatusText(mockIntervention.approvalStatus)}
            </span>
          </div>
        </div>

        {/* Objetivos simplificados */}
        <div className="mb-4">
          <h4 className="font-medium text-white mb-2">Objetivos:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            {mockIntervention.objectives.slice(0, 2).map((objective, index) => (
              <li key={index} className="flex items-start">
                <span className="text-pink-400 mr-2">•</span>
                {objective}
              </li>
            ))}
          </ul>
        </div>

        {/* Participantes */}
        <div className="mb-4">
          <h4 className="font-medium text-white mb-2">Integrantes:</h4>
          <div className="flex flex-wrap gap-2">
            {mockIntervention.participants.map((participant, index) => (
              <span key={index} className="text-sm text-gray-300 bg-white/5 rounded-lg px-3 py-1">
                {participant}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Evidencias fotográficas simplificadas */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-white">Evidencias Fotográficas</h4>
          <button
            onClick={() => setIsAddingEvidence(!isAddingEvidence)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
          >
            {isAddingEvidence ? 'Cancelar' : 'Agregar Foto'}
          </button>
        </div>

        {/* Formulario simple para agregar evidencias */}
        {isAddingEvidence && (
          <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="mb-3 w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-500 file:text-white"
            />
            <input
              type="text"
              placeholder="Descripción de la evidencia..."
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 mb-3"
            />
            <button
              onClick={handleAddEvidence}
              disabled={newPhotoFiles.length === 0}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Subir Evidencia
            </button>
          </div>
        )}

        {/* Galería simple de fotos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mockIntervention.photos.map((photo) => (
            <div key={photo.id} className="bg-white/5 rounded-lg overflow-hidden">
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <p className="text-xs text-gray-300">{photo.caption}</p>
                <p className="text-xs text-gray-500 mt-1">{photo.uploadedBy}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Botón de envío simplificado */}
        {!mockIntervention.evidenceSubmitted && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={submitEvidence}
              className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Enviar Proyecto para Revisión
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default InterventionManager;