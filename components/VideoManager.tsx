'use client';
import { useState, memo } from 'react';
import { useAuth } from '../lib/auth-context';

interface VideoManagerProps {
  groupId: number;
  members: string[];
  topic: string;
}

interface Video {
  id: string;
  author: string;
  title: string;
  description: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  duration: string;
  status: 'planning' | 'recording' | 'editing' | 'published';
  publishedAt?: Date;
  views: number;
}

const VideoManager = memo(function VideoManager({ groupId, members, topic }: VideoManagerProps) {
  const { user } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Mock data for demonstration
  const mockVideos: Video[] = members.map((member, index) => ({
    id: `video-${groupId}-${index}`,
    author: member,
    title: `${topic}: Explicación Práctica`,
    description: `Video explicativo sobre ${topic} desarrollado por ${member}. Incluye ejemplos prácticos y análisis detallado de los conceptos principales.`,
    youtubeUrl: index % 2 === 0 ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ${index}` : undefined,
    thumbnailUrl: `https://img.youtube.com/vi/dQw4w9WgXcQ${index}/maxresdefault.jpg`,
    duration: `${Math.floor(Math.random() * 15) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    status: ['planning', 'recording', 'editing', 'published'][index % 4] as Video['status'],
    publishedAt: index % 4 === 3 ? new Date() : undefined,
    views: Math.floor(Math.random() * 1000) + 50,
  }));

  const getStatusColor = (status: Video['status']) => {
    switch (status) {
      case 'planning': return 'bg-gray-500/20 text-gray-300';
      case 'recording': return 'bg-yellow-500/20 text-yellow-300';
      case 'editing': return 'bg-blue-500/20 text-blue-300';
      case 'published': return 'bg-green-500/20 text-green-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: Video['status']) => {
    switch (status) {
      case 'planning': return 'Planificando';
      case 'recording': return 'Grabando';
      case 'editing': return 'Editando';
      case 'published': return 'Publicado';
      default: return 'Sin estado';
    }
  };

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleAddVideo = (member: string) => {
    if (!newVideoUrl) return;
    
    const videoId = extractVideoId(newVideoUrl);
    if (videoId) {
      console.log(`Adding video for ${member}:`, videoId);
      setNewVideoUrl('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista simple de videos */}
      {members.map((member, idx) => {
        const video = mockVideos.find(v => v.author === member);
        return (
          <div
            key={member}
            className="bg-white/5 border border-white/10 rounded-xl p-4 animate-fade-in"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Thumbnail simple */}
                <div className="w-16 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                  {video?.youtubeUrl ? (
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
                    </div>
                  ) : (
                    <span className="text-gray-400">🎬</span>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-white">{member}</h4>
                  <p className="text-sm text-gray-400">Video sobre {topic}</p>
                  {video?.duration && <p className="text-xs text-gray-500">⏱️ {video.duration}</p>}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(video?.status || 'planning')}`}>
                  {getStatusText(video?.status || 'planning')}
                </span>
                
                {video?.youtubeUrl ? (
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Ver Video
                  </a>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      placeholder="URL de YouTube"
                      value={selectedVideo === video?.id ? newVideoUrl : ''}
                      onChange={(e) => {
                        setSelectedVideo(video?.id || null);
                        setNewVideoUrl(e.target.value);
                      }}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm w-48"
                    />
                    <button
                      onClick={() => handleAddVideo(member)}
                      disabled={!newVideoUrl}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default VideoManager;