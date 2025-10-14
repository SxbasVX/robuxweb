'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { memo, useState, useEffect } from 'react';
import TutorialOverlay from '../components/TutorialOverlay';

// Grupos ROBUX con diseño limpio
const robuxUnits = [
  { 
    id: 1, 
    name: 'Bienestar', 
    description: 'Red de orientación en bienestar integral',
    members: 25,
    color: 'blue',
    icon: '🏥'
  },
  { 
    id: 2, 
    name: 'Salud', 
    description: 'Unidades especializadas en salud digital',
    members: 18,
    color: 'pink',
    icon: '⚕️'
  },
  { 
    id: 3, 
    name: 'Educación', 
    description: 'Transformación educativa con tecnología',
    members: 22,
    color: 'yellow',
    icon: '📚'
  }
];

// Servicios ROBUX
const services = [
  {
    title: 'Orientación en Bienestar',
    description: 'Profesionales certificados en bienestar integral',
    icon: '🏥',
    color: 'blue'
  },
  {
    title: 'Unidades de Salud',
    description: 'Tecnología médica de vanguardia',
    icon: '⚕️',
    color: 'pink'
  },
  {
    title: 'Recursos Educativos',
    description: 'Plataforma educativa especializada',
    icon: '📚',
    color: 'yellow'
  },
  {
    title: 'Análisis Avanzado',
    description: 'Métricas y seguimiento profesional',
    icon: '📊',
    color: 'green'
  },
  {
    title: 'Seguridad Médica',
    description: 'Protección de datos especializada',
    icon: '🔒',
    color: 'orange'
  },
  {
    title: 'Acceso Universal',
    description: 'Multiplataforma optimizada',
    icon: '🌐',
    color: 'blue'
  }
];

const HomePage = memo(function HomePage() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted && user) {
      setTimeout(() => setShowTutorial(true), 1500);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Tutorial Overlay */}
      <TutorialOverlay 
        isVisible={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      {/* Hero Section */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-8 animate-fade-in-up">
            {/* Logo y título principal */}
            <div className="space-y-4">
              <h1 className="title-xl">
                <span className="text-blue-600 font-black">ROBUX</span>
              </h1>
              <h2 className="title-lg text-gray-700">
                Red de Orientación en
                <br />
                <span className="text-blue-600">Bienestar y Unidades</span>
                <br />
                de Experiencia
              </h2>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-4">
              <span className="badge badge-blue">bienestar</span>
              <span className="badge badge-pink">salud</span>
              <span className="badge badge-yellow">educación</span>
            </div>

            {/* Descripción */}
            <p className="text-lg max-w-2xl mx-auto">
              Conectando profesionales para transformar el bienestar y la salud en experiencias excepcionales
            </p>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <div className="text-center space-y-6">
                  <div className="card max-w-md mx-auto">
                    <h3 className="title-md text-blue-600 mb-2">¡Bienvenido!</h3>
                    <p className="text-lg font-semibold text-gray-700">{user.email}</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Link href="/perfil" className="btn-primary">
                      👤 Mi Perfil
                    </Link>
                    <Link href="/admin" className="btn-secondary">
                      ⚙️ Admin
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link href="/login" className="btn-primary">
                    🚀 Iniciar Sesión
                  </Link>
                  <Link href="/ayuda" className="btn-secondary">
                    💡 Conocer Más
                  </Link>
                </div>
              )}
            </div>

            {/* Tutorial button */}
            <div className="pt-4">
              <button
                onClick={() => setShowTutorial(true)}
                className="btn-secondary"
              >
                🎯 Ver Tutorial Interactivo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Unidades Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center space-y-8 mb-12">
            <h2 className="title-lg">Unidades de Experiencia</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre nuestras unidades especializadas donde el bienestar se convierte en experiencias transformadoras
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {robuxUnits.map((unit, index) => (
              <Link 
                key={unit.id} 
                href={`/grupo/${unit.id}`}
                className={`card card-${unit.color} group cursor-pointer`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-bounce-subtle">
                    {unit.icon}
                  </div>
                  <h3 className="title-md">{unit.name}</h3>
                  <p className="text-lg opacity-90">{unit.description}</p>
                  <div className="flex justify-center items-center space-x-2 pt-4">
                    <span className="text-2xl font-bold">{unit.members}</span>
                    <span className="text-sm opacity-75">profesionales</span>
                  </div>
                  <div className="flex justify-center items-center space-x-2 pt-2 group-hover:translate-x-2 transition-transform">
                    <span className="font-semibold">Explorar</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-8 mb-12">
            <h2 className="title-lg">¿Por qué elegir ROBUX?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Herramientas y servicios diseñados específicamente para el bienestar y la salud integral
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div 
                key={index}
                className="card group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${service.color}-100 text-3xl`}>
                    {service.icon}
                  </div>
                  <h3 className="title-md text-gray-800">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section bg-blue-600 text-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="title-lg">Sobre ROBUX</h2>
              <p className="text-lg opacity-90">
                Somos una red especializada en orientación de bienestar y unidades de experiencia, 
                comprometida con transformar la manera en que las personas acceden y experimentan 
                los servicios de salud y bienestar.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Profesionales certificados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Tecnología de vanguardia</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Enfoque integral</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block p-8 bg-white/10 rounded-3xl backdrop-blur-sm">
                <div className="text-8xl mb-4">🏥</div>
                <p className="text-xl font-semibold">Tu bienestar es nuestra prioridad</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default HomePage;