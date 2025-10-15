'use client';
import { notFound } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import dynamic from 'next/dynamic';

// Cargar GroupBoard solo del lado del cliente para evitar problemas de SSR
const GroupBoard = dynamic(() => import('../../../components/GroupBoard'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  )
});

type Params = { params: { id: string } };

export default function GrupoPage({ params }: Params) {
  const id = Number(params.id);
  if (![1, 2, 3, 4, 5].includes(id)) return notFound();

  const groupTopics = [
    'Inteligencia Artificial y Machine Learning',
    'Energías Renovables y Conservación', 
    'Telemedicina y Aplicaciones Médicas',
    'Plataformas de Aprendizaje Interactivo',
    'Aplicaciones Descentralizadas y DeFi'
  ];
  const groupTopic = groupTopics[id - 1];

  return (
    <div className="min-h-screen flex flex-col items-center px-2 py-4">
      <div className="w-full max-w-3xl sm:max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Header del grupo */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-token mb-2">
            Grupo {id}
          </h1>
          <p className="muted-token text-base sm:text-lg">
            {groupTopic}
          </p>
        </div>
        {/* Contenido del grupo */}
        <div className="transition-all duration-300 w-full">
          <GroupBoard groupId={id} />
        </div>
      </div>
    </div>
  );
}
