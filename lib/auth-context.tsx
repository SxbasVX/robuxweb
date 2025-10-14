'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from './supabaseClient';
import { generateRandomGamertag, generateRandomAvatar } from './gamertag';

export type Role = 'usuario' | 'delegado' | 'admin' | 'anonimo';

type UserProfile = {
  role: Role;
  group?: 1 | 2 | 3 | 4 | 5;
  email?: string;
  displayName?: string;
  avatar?: { color: string; emoji: string };
};

type AuthContextType = {
  user: { id: string; email?: string | null; displayName?: string; avatar?: { color: string; emoji: string } } | null;
  role: Role | null;
  group: 1 | 2 | 3 | 4 | 5 | null;
  loading: boolean;
  isAnonymous: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  group: null,
  loading: true,
  isAnonymous: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string | null; displayName?: string; avatar?: { color: string; emoji: string } } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Función para recuperar usuario anónimo (solo en el cliente)
  const getAnonymousUser = () => {
    if (typeof window === 'undefined') return null; // Evitar SSR
    try {
      const stored = localStorage.getItem('anonymousUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  // Función para crear usuario anónimo (solo en el cliente)
  const createAnonymousUser = () => {
    if (typeof window === 'undefined') return null; // Evitar SSR
    
    const gamertag = generateRandomGamertag();
    const avatar = generateRandomAvatar();
    const anonymousUser = {
      id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      displayName: gamertag,
      avatar: avatar
    };
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('anonymousUser', JSON.stringify(anonymousUser));
    
    return anonymousUser;
  };

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user ?? null;
        
        if (!mounted) return;
        
        if (u) {
          // Usuario autenticado
          setIsAnonymous(false);
          
          // Ensure a profile row exists for RLS checks
          await supabase.from('users').upsert({ id: u.id, email: u.email ?? null }, { onConflict: 'id' });
          const { data: rows } = await supabase.from('users').select('*').eq('id', u.id).limit(1);
          const p = rows?.[0] as UserProfile | undefined;
          console.log('🔍 Auth Debug - Usuario encontrado en DB:', p);
          console.log('🔍 Auth Debug - Email:', u.email, 'Role:', p?.role);
          setProfile(p ?? { role: 'usuario', email: u.email ?? undefined });

          // Derivar displayName amigable
          const metaName = (u as any)?.user_metadata?.full_name || (u as any)?.user_metadata?.name;
          const derivedName = p?.displayName || metaName || (u.email ? u.email.split('@')[0] : undefined);
          setUser({ id: u.id, email: u.email, displayName: derivedName });
        } else {
          // Usuario anónimo
          let anonymousUser = getAnonymousUser();
          if (!anonymousUser) {
            anonymousUser = createAnonymousUser();
          }
          
          if (anonymousUser) {
            setUser(anonymousUser);
            setIsAnonymous(true);
            setProfile({ 
              role: 'anonimo', 
              displayName: anonymousUser.displayName,
              avatar: anonymousUser.avatar 
            });
          }
        }
      } catch (error) {
        console.error('Error en inicialización de auth:', error);
        // En caso de error, crear usuario anónimo
        const anonymousUser = createAnonymousUser();
        if (anonymousUser && mounted) {
          setUser(anonymousUser);
          setIsAnonymous(true);
          setProfile({ 
            role: 'anonimo', 
            displayName: anonymousUser.displayName,
            avatar: anonymousUser.avatar 
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    init();
    
    // Solo configurar el listener si estamos en el cliente
    if (typeof window === 'undefined') {
      return () => { mounted = false; };
    }
    
    const supabase = getSupabase();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      
      const su = session?.user ?? null;
      if (su) {
        const metaName = (su as any)?.user_metadata?.full_name || (su as any)?.user_metadata?.name;
        const derivedName = metaName || (su.email ? su.email.split('@')[0] : undefined);
        setUser({ id: su.id, email: su.email, displayName: derivedName });
        setIsAnonymous(false);
      } else {
        // Crear usuario anónimo cuando se desloguea
        let anonymousUser = getAnonymousUser();
        if (!anonymousUser) {
          anonymousUser = createAnonymousUser();
        }
        
        if (anonymousUser) {
          setUser(anonymousUser);
          setIsAnonymous(true);
          setProfile({ 
            role: 'anonimo', 
            displayName: anonymousUser.displayName,
            avatar: anonymousUser.avatar 
          });
        }
      }
    });
    
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: profile?.role ?? null,
      group: (profile?.group as any) ?? null,
      loading,
      isAnonymous,
    }),
    [user?.id, user?.email, profile?.role, profile?.group, loading, isAnonymous]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
