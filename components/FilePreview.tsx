'use client';

type Props = { url: string };

export default function FilePreview({ url }: Props) {
  const lower = url.toLowerCase();

  // Google Drive video preview (soporta /view y /preview)
  if (lower.includes('drive.google.com')) {
    // Extraer el ID del archivo de la URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const fileId = match ? match[1] : null;
    // Siempre usar formato embed /preview
    let embedUrl = url;
    if (fileId) {
      embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }
    // Si el link tiene parámetros extra, quítalos
    embedUrl = embedUrl.split('?')[0];
    return (
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 bg-black/20 text-center">
          <div className="text-gray-400 mb-2">🎬 Video de Google Drive</div>
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">Ver en Drive</a>
        </div>
        <iframe
          src={embedUrl}
          className="w-full h-96"
          allow="autoplay"
          title="Google Drive Video"
          frameBorder="0"
        />
      </div>
    );
  }

  if (lower.endsWith('.pdf')) {
    return (
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 bg-black/20 text-center">
          <div className="text-gray-400 mb-2">📄 Documento PDF</div>
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Ver PDF en nueva pestaña
          </a>
        </div>
        <iframe 
          src={url} 
          className="w-full h-96" 
          title="PDF Viewer"
          frameBorder="0"
        />
      </div>
    );
  }
  
  if (/(jpg|jpeg|png|gif)$/.test(lower)) {
    return (
      <div className="glass rounded-2xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={url} 
          alt="archivo" 
          className="w-full h-auto"
          loading="lazy"
        />
        <div className="p-2 bg-black/20 text-center text-xs text-gray-400">
          Imagen • {url.split('.').pop()?.toUpperCase()}
        </div>
      </div>
    );
  }
  
  if (lower.endsWith('.mp4')) {
    return (
      <div className="glass rounded-2xl overflow-hidden">
        <video src={url} controls className="w-full" />
        <div className="p-2 bg-black/20 text-center text-xs text-gray-400">
          Video MP4
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass p-4 rounded-2xl text-center">
      <div className="text-gray-400 mb-2">📄 Archivo adjunto</div>
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer" 
        className="text-blue-400 hover:text-blue-300 underline break-all"
      >
        Ver archivo
      </a>
    </div>
  );
}
