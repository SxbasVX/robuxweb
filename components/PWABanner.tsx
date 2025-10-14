'use client';
import React from 'react';
import { usePWA } from '../lib/usePWA';

export default function PWABanner() {
  const { isInstallable, isOnline, installApp } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log('🎉 App installed successfully!');
    }
  };

  return (
    <>
      {/* Banner de instalación */}
      {isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg z-50 border border-purple-500/30">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📱</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Instalar App</h4>
              <p className="text-xs opacity-90">
                Instala la Plataforma Académica para un acceso más rápido y funcionalidad offline
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={() => {
                  const banner = document.querySelector('[data-pwa-banner]');
                  if (banner) banner.remove();
                }}
                className="text-white/70 hover:text-white text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de estado offline */}
      {!isOnline && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          📴 Sin conexión - Modo offline activo
        </div>
      )}
    </>
  );
}