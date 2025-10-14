'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';

interface PasswordRecoveryProps {
  onClose: () => void;
}

export default function PasswordRecovery({ onClose }: PasswordRecoveryProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setSent(true);
    } catch (error: any) {
      setError(error.message || 'Error al enviar email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700">
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-white mb-3">Email Enviado</h3>
            <p className="text-gray-400 mb-6">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h3 className="text-xl font-bold text-white">Recuperar Contraseña</h3>
          <p className="text-gray-400 text-sm mt-2">
            Te enviaremos un link para restablecer tu contraseña
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu-email@ejemplo.com"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}