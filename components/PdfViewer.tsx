'use client';
import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type Props = {
  url: string;
  className?: string;
  title?: string;
  studentName?: string;
  showFullscreen?: boolean;
};

export default function PdfViewer({ url, className = '', title, studentName, showFullscreen = true }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitToWidth, setFitToWidth] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: any) => {
    console.error('Error loading PDF:', error);
    setError('Error al cargar el PDF');
    setLoading(false);
  }, []);

  const goToPrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) setPageNumber(pageNumber + 1);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
    setFitToWidth(false);
  };

  const toggleFitToWidth = () => {
    setFitToWidth(!fitToWidth);
    if (!fitToWidth) {
      setScale(1.2);
    } else {
      setScale(1.0);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title ? `${title}.pdf` : url.split('/').pop() || 'ensayo.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className={`glass p-6 rounded-2xl text-center ${className}`}>
        <div className="text-red-400 mb-4">❌ {error}</div>
        <a 
          href={url} 
          target="_blank" 
          rel="noreferrer" 
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Ver PDF en nueva pestaña
        </a>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      <div className={`glass rounded-2xl overflow-hidden ${isFullscreen ? 'h-full' : className}`}>
        {/* PDF Header */}
        {(title || studentName) && (
          <div className="p-4 bg-purple-600/20 border-b border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                {title && <h3 className="text-white font-semibold">{title}</h3>}
                {studentName && <p className="text-gray-300 text-sm">Estudiante: {studentName}</p>}
              </div>
              {showFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded text-sm text-white"
                  title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                >
                  {isFullscreen ? "🗗" : "🗖"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* PDF Controls */}
        <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
            >
              ⬅️
            </button>
            <span className="text-sm px-2">
              {numPages ? `${pageNumber} / ${numPages}` : '---'}
            </span>
            <button
              onClick={goToNextPage}
              disabled={!numPages || pageNumber >= numPages}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
            >
              ➡️
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
              title="Reducir zoom"
            >
              🔍-
            </button>
            <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
              title="Aumentar zoom"
            >
              🔍+
            </button>
            <button
              onClick={toggleFitToWidth}
              className={`px-2 py-1 rounded text-sm ${fitToWidth ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}
              title="Ajustar al ancho"
            >
              📏
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
              title="Zoom normal"
            >
              100%
            </button>
            <button
              onClick={downloadPdf}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm"
              title="Descargar PDF"
            >
              📥
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className={`relative overflow-auto bg-gray-100 ${isFullscreen ? 'flex-1' : 'max-h-96'}`}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cargando ensayo...
              </div>
            </div>
          )}
          
          <div className="flex justify-center p-4">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
                width={fitToWidth ? undefined : undefined}
              />
            </Document>
          </div>
        </div>

        {/* Page Info */}
        {numPages && (
          <div className="p-2 bg-black/20 border-t border-white/10 text-center text-xs text-gray-400">
            📄 Ensayo PDF • {numPages} página{numPages !== 1 ? 's' : ''} • Última actualización: {new Date().toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}