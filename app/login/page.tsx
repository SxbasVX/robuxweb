'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Mostrar mensaje de éxito
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      message.textContent = 'Sesión iniciada correctamente';
      document.body.appendChild(message);
      
      setTimeout(() => {
        if (document.body.contains(message)) {
          document.body.removeChild(message);
        }
      }, 2000);
      
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    // Simplemente redirigir al home, el auth context manejará crear el usuario anónimo
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-md w-full">
        <div className="glass bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎓</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Plataforma Académica
            </h1>
            <p className="text-gray-400 mt-2">Inicia sesión para acceder como admin o delegado</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                className="w-full bg-slate-800/50 backdrop-blur rounded-lg px-4 py-3 outline-none border border-slate-700/50 focus:border-indigo-500/50 text-white placeholder-gray-400 transition-colors"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full bg-slate-800/50 backdrop-blur rounded-lg px-4 py-3 outline-none border border-slate-700/50 focus:border-indigo-500/50 text-white placeholder-gray-400 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading} 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 font-medium transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            {error && (
              <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                ¿No tienes cuenta o prefieres navegar como estudiante?
              </p>
              <button
                onClick={continueAsGuest}
                className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 hover:text-white rounded-lg py-3 font-medium transition-all duration-200 border border-slate-600/50"
              >
                Continuar como Estudiante
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Como estudiante puedes ver las publicaciones pero con funciones limitadas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
