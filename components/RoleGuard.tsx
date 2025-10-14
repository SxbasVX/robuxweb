'use client';
import { ReactNode } from 'react';
import { useAuth, Role } from '../lib/auth-context';

export default function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) return <div className="text-sm text-gray-400">Cargando…</div>;
  if (!role || !allow.includes(role)) return <div className="text-sm text-red-300">No tienes acceso a esta función.</div>;
  return <>{children}</>;
}
