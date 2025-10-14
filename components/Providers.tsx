'use client';
import { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '../lib/auth-context';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>{children}</AuthProvider>
    </MotionConfig>
  );
}
