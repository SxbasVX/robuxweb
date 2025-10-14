'use client';
import { useState, useRef, memo } from 'react';
import { useAuth } from '../lib/auth-context';

interface EssayManagerProps {
  groupId: number;
  members: string[];
  topic: string;
}

interface Essay {
  id: string;
  title: string;
  author: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt: Date;
  status: 'draft' | 'submitted' | 'reviewed';
  feedback?: string;
  grade?: number;
}

const EssayManager = memo(function EssayManager({ groupId, members, topic }: EssayManagerProps) {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  const mockEssays: Essay[] = members.map((member, index) => ({
    id: `essay-${groupId}-${index}`,
    title: `Ensayo sobre ${topic}`,
    author: member,
    content: `Este es un ensayo sobre ${topic} desarrollado por ${member}. El ensayo explora los conceptos fundamentales y presenta un análisis detallado del tema.`,
    fileUrl: index % 2 === 0 ? `https://example.com/essays/essay-${index}.pdf` : undefined,
    fileName: index % 2 === 0 ? `${member.replace(/\s+/g, '_')}_${topic.replace(/\s+/g, '_')}.pdf` : undefined,
    uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    status: ['draft', 'submitted', 'reviewed'][index % 3] as Essay['status'],
    feedback: index % 3 === 2 ? 'Excelente trabajo. Se nota el esfuerzo y la investigación realizada.' : undefined,
    grade: index % 3 === 2 ? Math.floor(Math.random() * 3) + 8 : undefined,
  }));

  const handleFileUpload = async (file: File, author: string) => {
    setIsUploading(true);
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Uploading file for ${author}:`, file.name);
      
      const newEssay: Essay = {
        id: `essay-${Date.now()}`,
        title: `Ensayo sobre ${topic}`,
        author,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date(),
        status: 'submitted'
      };
      
      setEssays(prev => [...prev, newEssay]);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: Essay['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300';
      case 'submitted': return 'bg-blue-500/20 text-blue-300';
      case 'reviewed': return 'bg-green-500/20 text-green-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: Essay['status']) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'submitted': return 'Enviado';
      case 'reviewed': return 'Revisado';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista simple de ensayos */}
      {members.map((member, idx) => {
        const essay = mockEssays.find(e => e.author === member);
        return (
          <div
            key={member}
            className="bg-white/5 border border-white/10 rounded-xl p-4 animate-fade-in"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {member.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-white">{member}</h4>
                  <p className="text-sm text-gray-400">Ensayo sobre {topic}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(essay?.status || 'draft')}`}>
                  {getStatusText(essay?.status || 'draft')}
                </span>
                
                {essay?.fileUrl ? (
                  <a
                    href={essay.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Ver Ensayo
                  </a>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Subir Ensayo
                  </button>
                )}
              </div>
            </div>
            
            {essay?.grade && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Calificación:</span>
                  <span className="text-green-400 font-bold">{essay.grade}/10</span>
                </div>
                {essay.feedback && (
                  <p className="text-sm text-gray-300 mt-2 italic">"{essay.feedback}"</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Input oculto para subir archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'Usuario Actual');
        }}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />
      
      {isUploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
          <p className="text-gray-400 mt-2">Subiendo archivo...</p>
        </div>
      )}
    </div>
  );
});

export default EssayManager;