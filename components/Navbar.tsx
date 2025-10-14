'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { getSupabase } from '../lib/supabaseClient';
import { useCallback, useMemo, useState } from 'react';
import UserAvatar from './UserAvatar';
import NotificationCenter from './NotificationCenter';

const academicGroups = [
  { id: 1, name: 'Grupo 1', topic: 'Inteligencia Artificial y Machine Learning' },
  { id: 2, name: 'Grupo 2', topic: 'Energías Renovables y Conservación' },
  { id: 3, name: 'Grupo 3', topic: 'Telemedicina y Aplicaciones Médicas' },
  { id: 4, name: 'Grupo 4', topic: 'Plataformas de Aprendizaje Interactivo' },
  { id: 5, name: 'Grupo 5', topic: 'Aplicaciones Descentralizadas y DeFi' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = useCallback((path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  }, [pathname]);

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);
    const crumbs: { label: string; href: string; icon: string }[] = [];

    if (paths.length > 0) {
      switch (paths[0]) {
        case 'grupo':
          if (paths[1]) {
            const groupId = parseInt(paths[1]);
            const group = academicGroups.find(g => g.id === groupId);
            if (group) {
              crumbs.push({
                label: group.name,
                href: `/grupo/${groupId}`,
                icon: ''
              });
            }
          }
          break;
        case 'admin':
          crumbs.push({ label: 'Administración', href: '/admin', icon: '' });
          break;
        case 'login':
          crumbs.push({ label: 'Iniciar Sesión', href: '/login', icon: '' });
          break;
        case 'perfil':
          crumbs.push({ label: 'Perfil', href: '/perfil', icon: '' });
          break;
      }
    }

    return crumbs;
  }, [pathname]);

  const handleSignOut = useCallback(async () => {
    try {
      await getSupabase().auth.signOut();
      router.push('/');
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      message.textContent = 'Sesión cerrada. Ahora eres un estudiante.';
      document.body.appendChild(message);
      setTimeout(() => {
        if (document.body.contains(message)) {
          document.body.removeChild(message);
        }
      }, 3000);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const showBackButton = pathname !== '/';

  return (
    <nav className="sticky top-5 sm:top-6 z-50 px-4 navbar">
      <div className="nav-zonecraft max-w-7xl mx-auto rounded-2xl">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Barra principal - layout simplificado */}
          <div className="flex items-center justify-between h-16">
          {/* Zona izquierda: Back + Logo */}
          <div className="flex items-center gap-4 min-w-0">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 rounded-xl transition-all duration-200 nav-link-zonecraft"
                title="Regresar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <h1 className="text-lg font-bold text-white">
                  ROBUX
                </h1>
              </div>
            </Link>
          </div>

          {/* Zona derecha: Enlaces + Usuario (todo junto) */}
          <div className="flex items-center gap-4">
            {/* Breadcrumbs compactos en desktop */}
            {breadcrumbs.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 zonecraft-glass rounded-xl">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-2">
                    {index > 0 && <span className="text-xs text-white/50">›</span>}
                    <span className="text-xs text-white/80 truncate max-w-32">{crumb.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Admin/Perfil links */}
            {(role === 'admin' || role === 'delegado') && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/admin">
                  <div className={`nav-link-zonecraft flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/admin') ? 'active' : ''
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden lg:inline">Admin</span>
                  </div>
                </Link>
                <Link href="/perfil">
                  <div className={`nav-link-zonecraft flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/perfil') ? 'active' : ''
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden lg:inline">Perfil</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Notificaciones */}
            {user && <NotificationCenter />}

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/perfil" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <UserAvatar user={user} role={role} size="sm" showRole={false} />
                  <div className="hidden sm:block text-sm">
                    <div className="font-medium truncate max-w-24 text-white">
                      {user.displayName || user.email || 'Usuario'}
                    </div>
                  </div>
                </Link>
                
                {role === 'anonimo' ? (
                  <Link href="/login">
                    <div className="zonecraft-button px-4 py-2 text-sm font-medium transition-all duration-200">
                      Login
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 text-sm font-medium text-red-300 hover:text-red-200 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-xl transition-all duration-200"
                  >
                    Salir
                  </button>
                )}
              </div>
            ) : null}
          </div>
          </div>
          
          {/* Breadcrumbs móvil */}
          {breadcrumbs.length > 0 && (
            <div className="md:hidden border-t border-white/10 pt-3 pb-2">
              <div className="flex items-center gap-3 overflow-x-auto">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-2 flex-shrink-0">
                    {index > 0 && <span className="text-white/50 text-sm">›</span>}
                    <Link href={crumb.href as any}>
                      <span className="text-sm text-white/80 whitespace-nowrap">{crumb.label}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
