'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { memo, useEffect, useState } from 'react';
import TutorialOverlay from '../components/TutorialOverlay';

// No se usan secciones de "About/Unidades/Servicios" en esta vista; solo Hero y Acceso a Grupos

const HomePage = memo(function HomePage() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Apply theme to html
  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const next = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const finalTheme = theme ?? next;
      if (finalTheme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      localStorage.setItem('theme', finalTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [mounted, theme]);

  // Tutorial: abrir solo cuando el usuario presiona el botón (sin auto-open)

  // Smooth scroll to grupos section
  const handleScrollToGrupos = () => {
    const gruposSection = document.getElementById('grupos');
    if (gruposSection) {
      gruposSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Tutorial Overlay */}
      <TutorialOverlay isVisible={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Hero estilo Dr. Friend */}
      <section className="section hero-drfriend hero-section">
        <div className="container">
          <div className="hero-panel animate-fade-in-up">
            {/* blobs decorativos */}
            <div className="curve-blob blob-1" />
            <div className="curve-blob blob-2" />

            <div className="text-center space-y-6 relative">
              <div className="flex flex-wrap justify-center gap-3">
                <span className="sticker blue">ROBUX</span>
                <span className="sticker pink">orientación</span>
                <span className="sticker green">experiencia</span>
              </div>

              <h1 className="hero-title">
                Red de Orientación en Bienestar
                <br />
                y Unidades de Experiencia
              </h1>

              <p className="text-lg max-w-2xl mx-auto text-white/90">
                <span className="text-white bg-blue-900/60 px-3 py-1 rounded-lg">También nos puedes llamar:</span> <strong className="text-yellow-300 bg-blue-900/40 px-3 py-1 rounded-lg ml-2">ROBUX</strong>.
              </p>

              {/* Botones principales y toggle de tema en fila, pero en móvil en columna y con separación */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4 w-full">
                <div className="flex flex-row gap-3 w-full sm:w-auto">
                  <button
                    className="btn-secondary w-full sm:w-auto"
                    onClick={() => setShowTutorial(true)}
                    aria-label="Abrir tutorial"
                  >
                    💎 Tutorial
                  </button>
                  <button
                    className="btn-primary w-full sm:w-auto text-center"
                    onClick={handleScrollToGrupos}
                    aria-label="Ver grupos"
                  >
                    Ver grupos
                  </button>
                </div>
                {mounted && (
                  <button
                    className="btn-secondary w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                    aria-label="Cambiar tema"
                    style={{ zIndex: 10 }}
                  >
                    <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                    <span className="sr-only">Cambiar tema</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grupos (acceso rápido) */}
      <section className="section" id="grupos">
        <div className="container">
          <div className="text-center space-y-3 mb-10">
            <span className="badge badge-green">Grupos</span>
            <h2 className="title-lg">Accede a tus grupos</h2>
            <p className="text-lg max-w-2xl mx-auto">Entra directamente al tablero de cada grupo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3,4,5].map((id) => (
              <Link key={id} href={`/grupo/${id}`} className="card" style={{borderColor:'var(--card-border)'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="title-md">Grupo {id}</h3>
                    <p className="text-lg" style={{color:'var(--muted-color)'}}>Tablero y recursos</p>
                  </div>
                  <div className="blob-pill text-2xl" style={{background:'rgba(59,130,246,.15)', color:'var(--text-color)'}}>➡️</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
});

export default HomePage;