import React from 'react';
import SystemStatusSimple from '../../components/SystemStatusSimple';

export default function StatusPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-2 py-4">
      <div className="w-full max-w-md sm:max-w-2xl mx-auto px-2 sm:px-4 py-6">
        <SystemStatusSimple />
      </div>
    </div>
  );
}