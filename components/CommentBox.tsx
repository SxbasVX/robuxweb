'use client';
import { useState, memo } from 'react';

const CommentBox = memo(function CommentBox({ onSubmit, placeholder = 'Escribe un comentario…' }: { onSubmit: (text: string) => Promise<void> | void; placeholder?: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setLoading(true);
      await onSubmit(text.trim());
      setText('');
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
      className="flex gap-2 animate-fade-in gpu-accelerated"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 transition-all duration-300"
      />
      <button 
        type="submit" 
        disabled={loading || !text.trim()}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
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
    </form>
  );
});

export default CommentBox;