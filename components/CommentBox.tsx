'use client';
import { useState, memo } from 'react';

interface CommentBoxProps {
  onSubmit: (text: string, authorName?: string) => Promise<void> | void;
  placeholder?: string;
  allowAnonymous?: boolean;
}

const CommentBox = memo(function CommentBox({ 
  onSubmit, 
  placeholder = 'Escribe un comentario…',
  allowAnonymous = true 
}: CommentBoxProps) {
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    try {
      setLoading(true);
      const nameToSend = isAnonymous ? undefined : authorName.trim() || undefined;
      await onSubmit(text.trim(), nameToSend);
      setText('');
      setAuthorName('');
      setSubmitted(true);
      // Reset submitted state after animation
      setTimeout(() => setSubmitted(false), 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={submit} 
      className="space-y-3 animate-fade-in gpu-accelerated"
    >
      {/* Toggle Anónimo/Con Nombre */}
      {allowAnonymous && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsAnonymous(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isAnonymous 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            👤 Anónimo
          </button>
          <button
            type="button"
            onClick={() => setIsAnonymous(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !isAnonymous 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            ✍️ Con mi nombre
          </button>
        </div>
      )}

      {/* Campo de nombre (solo si no es anónimo) */}
      {!isAnonymous && (
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Tu nombre (opcional)"
          disabled={loading}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300"
        />
      )}

      {/* Campo de comentario y botón */}
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          rows={2}
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 transition-all duration-300 resize-none"
        />
        <button 
          type="submit" 
          disabled={loading || !text.trim()}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 self-end ${
            submitted 
              ? 'bg-green-500 text-white' 
              : 'bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
        >
          {loading ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Enviando...
            </span>
          ) : submitted ? (
            <span className="flex items-center animate-fade-in">
              ✓ Enviado
            </span>
          ) : (
            'Enviar'
          )}
        </button>
      </div>

      {/* Info sobre anonimato */}
      {isAnonymous && (
        <p className="text-xs text-gray-400">
          💡 Tu comentario será anónimo. Nadie sabrá quién lo escribió.
        </p>
      )}
    </form>
  );
});

export default CommentBox;