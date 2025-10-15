'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { memo, useState, useEffect } from 'react';
import TutorialOverlay from '../components/TutorialOverlay';

// Grupos académicos con diseño vibrante
const academicGroups = [
  { 
    id: 1, 
    name: 'Grupo 1', 
    topic: 'Inteligencia Artificial',
    description: '🤖 Explorando el futuro de la IA y Machine Learning',
    members: ['Ana García', 'Luis Martínez', 'Sofia Rodríguez', 'Carlos López'],
    color: 'from-purple-500 via-pink-500 to-red-500',
    bgColor: 'bg-gradient-to-br from-purple-100 to-pink-100',
    icon: '🤖',
    badge: 'AI'
  },
  { 
    id: 2, 
    name: 'Grupo 2', 
    topic: 'Energías Renovables',
    description: '🌱 Innovación en sostenibilidad y medio ambiente',
    members: ['María Hernández', 'Diego Morales', 'Elena Vega', 'Roberto Silva'],
    color: 'from-green-500 via-emerald-500 to-teal-500',
    bgColor: 'bg-gradient-to-br from-green-100 to-emerald-100',
    icon: '🌱',
    badge: 'ECO'
  },
  { 
    id: 3, 
    name: 'Grupo 3', 
    topic: 'Telemedicina',
    description: '⚕️ Salud digital y aplicaciones médicas innovadoras',
    members: ['Carmen Ruiz', 'Andrés Torres', 'Lucía Jiménez', 'Fernando Castro'],
    color: 'from-blue-500 via-cyan-500 to-teal-500',
    bgColor: 'bg-gradient-to-br from-blue-100 to-cyan-100',
    icon: '⚕️',
    badge: 'MED'
  },
  { 
    id: 4, 
    name: 'Grupo 4', 
    topic: 'Educación Digital',
    description: '📚 Transformando la educación con tecnología',
    members: ['Patricia Mendoza', 'Javier Santos', 'Isabella Ramos', 'Miguel Ortega'],
    color: 'from-orange-500 via-amber-500 to-yellow-500',
    bgColor: 'bg-gradient-to-br from-orange-100 to-amber-100',
    icon: '📚',
    badge: 'EDU'
  },
  { 
    id: 5, 
    name: 'Grupo 5', 
    topic: 'Blockchain y DeFi',
    description: '⛓️ Finanzas descentralizadas y criptomonedas',
    members: ['Valentina Cruz', 'Sebastián Vargas', 'Camila Delgado', 'Nicolás Pérez'],
    color: 'from-indigo-500 via-purple-500 to-pink-500',
    bgColor: 'bg-gradient-to-br from-indigo-100 to-purple-100',
    icon: '⛓️',
    badge: 'WEB3'
  },
];

// Componente de tarjeta de grupo estilo Dr. Friend
const GroupCard = memo(function GroupCard({ group, index }: { group: any, index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.location.href = `/grupo/${group.id}`;
  };

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer animate-slide-in-bounce"
      style={{ animationDelay: `${index * 0.2}s` }}
    >
      <div className="card-rainbow p-8 h-full relative overflow-hidden">
        {/* Badge superior */}
        <div className="absolute top-4 right-4">
          <div className="badge-vibrant animate-wiggle">
            {group.badge}
          </div>
        </div>

        {/* Elementos decorativos flotantes */}
        <div className="absolute top-6 left-6 w-8 h-8 bg-white/20 rounded-full animate-bounce-vibrant"></div>
        <div className="absolute bottom-6 right-8 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse-glow"></div>
        
        <div className="relative z-10">
          <div className="flex items-start space-x-6 mb-8">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${group.color} flex items-center justify-center shadow-2xl transform transition-all duration-500 ${isHovered ? 'scale-110 rotate-12' : ''}`}>
              <span className="text-4xl filter drop-shadow-lg">{group.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-3xl font-black text-white mb-3 animate-shimmer-rainbow">
                {group.name}
              </h3>
              <p className="text-xl font-bold text-white/90 mb-3">{group.topic}</p>
              <p className="text-lg text-white/80 leading-relaxed">{group.description}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Avatares de miembros con efectos */}
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-4">
                {group.members.slice(0, 4).map((member: string, i: number) => (
                  <div 
                    key={i} 
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${group.color} border-4 border-white shadow-xl transform transition-all duration-300 hover:scale-125 hover:z-10`}
                    style={{transitionDelay: `${i * 100}ms`}}
                  >
                    <div className="w-full h-full rounded-full bg-white/30 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {member.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                ))}
                {group.members.length > 4 && (
                  <div className="w-14 h-14 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-sm font-bold text-white shadow-xl">
                    +{group.members.length - 4}
                  </div>
                )}
              </div>
              <div className="text-white/90 font-bold">
                <span className="text-2xl">{group.members.length}</span>
                <span className="text-sm ml-1">miembros activos</span>
              </div>
            </div>
            
            {/* Estadísticas vibrantes */}
            <div className="flex items-center justify-between pt-6 border-t border-white/30">
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2 text-white/90">
                  <span className="text-2xl animate-bounce-vibrant">📝</span>
                  <span className="font-semibold">Ensayos</span>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
                  <span className="text-2xl animate-wiggle">🎥</span>
                  <span className="font-semibold">Videos</span>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
                  <span className="text-2xl animate-pulse-glow">🤝</span>
                  <span className="font-semibold">Proyecto</span>
                </div>
              </div>
              
              <div className="flex items-center text-white font-bold text-lg group-hover:translate-x-3 transition-transform duration-300">
                <span>EXPLORAR</span>
                <svg className="w-6 h-6 ml-2 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      </div>
    </div>
  );
});

const HomePage = memo(function HomePage() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [homeContent, setHomeContent] = useState({
  title: 'Robux',
    subtitle: 'Conectando mentes brillantes para transformar el conocimiento en impacto real ✨',
    welcomeMessage: 'Únete a grupos de investigación especializados y colabora en proyectos que marcan la diferencia en el mundo 🌍'
  });

  useEffect(() => {
    // Mostrar tutorial para usuarios nuevos
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted && user) {
      setTimeout(() => setShowTutorial(true), 1500);
    }
  }, [user]);

  const startTutorial = () => {
    setShowTutorial(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Tutorial Overlay */}
      <TutorialOverlay 
        isVisible={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      {/* Hero Section Vibrante */}
      <section className="hero-section relative py-20 lg:py-32">
        {/* Elementos decorativos flotantes */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-30 animate-bounce-vibrant"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-40 animate-wiggle"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-35 animate-pulse-glow"></div>
        <div className="absolute bottom-32 right-10 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full opacity-45 animate-bounce-vibrant" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-6xl mx-auto text-center space-y-12">
          {/* Glass container principal */}
          <div className="glass-vibrant max-w-4xl mx-auto p-12 space-y-10 animate-slide-in-bounce">
            <div className="space-y-8">
              <h1 className="text-6xl lg:text-8xl font-black text-white leading-tight">
                <span className="block animate-shimmer-rainbow">Robux</span>
              </h1>
              
              <div className="flex justify-center space-x-4 mb-8">
                <div className="badge-vibrant animate-bounce-vibrant">¡NUEVA EXPERIENCIA! 🎉</div>
                <div className="badge-vibrant animate-wiggle" style={{animationDelay: '0.5s'}}>100% GRATUITO 💎</div>
              </div>
              
              <p className="text-2xl lg:text-3xl text-white/95 font-bold max-w-3xl mx-auto leading-relaxed">
                {homeContent.subtitle}
              </p>
            </div>
            
            {/* Botones de acción vibrantes */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {user ? (
                <div className="text-center space-y-8">
                  <div className="glass-vibrant p-8 rounded-3xl border-4 border-white/30">
                    <p className="text-2xl text-white mb-3 font-bold">
                      ¡Bienvenido de vuelta! 🎉
                    </p>
                    <p className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex gap-6 justify-center">
                    <Link href="/perfil" className="btn-vibrant-primary text-xl px-10 py-4">
                      🚀 MI PERFIL
                    </Link>
                    <Link href="/admin" className="btn-vibrant-secondary text-xl px-10 py-4">
                      ⚙️ ADMIN
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex gap-6 justify-center">
                  <Link href="/login" className="btn-vibrant-primary text-xl px-12 py-5">
                    🔥 INICIAR SESIÓN
                  </Link>
                  <Link href="/ayuda" className="btn-vibrant-accent text-xl px-12 py-5">
                    💡 CONOCER MÁS
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mensaje de bienvenida */}
            <div className="glass-vibrant p-8 rounded-3xl border-2 border-white/20">
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-medium">
                {homeContent.welcomeMessage}
              </p>
            </div>

            {/* Botón de tutorial */}
            <div className="flex justify-center">
              <button
                onClick={startTutorial}
                className="btn-vibrant-accent px-8 py-4 text-lg animate-pulse-glow"
              >
                🎯 VER TUTORIAL INTERACTIVO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Grupos Vibrante */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado de sección vibrante */}
          <div className="text-center space-y-8 mb-20">
            <div className="glass-vibrant max-w-3xl mx-auto p-10 animate-slide-in-bounce">
              <h2 className="text-5xl lg:text-6xl font-black text-white mb-6 animate-shimmer-rainbow">
                Grupos de Investigación
              </h2>
              <p className="text-2xl text-white/90 leading-relaxed font-bold">
                Descubre comunidades especializadas donde el conocimiento se convierte en 
                <span className="text-transparent bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text"> innovación increíble</span> ✨
              </p>
              
              <div className="flex justify-center space-x-4 mt-8">
                <div className="badge-vibrant">🔬 5 GRUPOS ACTIVOS</div>
                <div className="badge-vibrant animate-wiggle">👥 50+ MIEMBROS</div>
                <div className="badge-vibrant animate-bounce-vibrant">🚀 PROYECTOS REALES</div>
              </div>
            </div>
          </div>

          {/* Grid de grupos vibrante */}
          <div className="group-cards grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
            {academicGroups.map((group, index) => (
              <GroupCard key={group.id} group={group} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Sección de características vibrante */}
      <section className="features-section py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 mb-20">
            <div className="glass-vibrant max-w-3xl mx-auto p-10 animate-slide-in-bounce">
              <h2 className="text-5xl lg:text-6xl font-black text-white mb-6 animate-shimmer-rainbow">
                ¿Por qué elegir Robux?
              </h2>
              <p className="text-2xl text-white/90 leading-relaxed font-bold">
                Herramientas diseñadas para potenciar la 
                <span className="text-transparent bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text"> colaboración académica</span> 🎓
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: '🚀',
                title: 'Colaboración en Tiempo Real',
                description: 'Trabaja con tu equipo desde cualquier lugar con sincronización instantánea y herramientas avanzadas',
                color: 'from-purple-500 to-pink-500',
                badge: 'REAL-TIME'
              },
              {
                icon: '📚',
                title: 'Gestión de Conocimiento',
                description: 'Organiza, comparte y accede a recursos académicos de forma intuitiva con AI integrada',
                color: 'from-blue-500 to-cyan-500',
                badge: 'AI-POWERED'
              },
              {
                icon: '🔒',
                title: 'Seguridad Avanzada',
                description: 'Protección de datos con cifrado de extremo a extremo y respaldos automáticos en la nube',
                color: 'from-green-500 to-emerald-500',
                badge: 'ULTRA-SECURE'
              },
              {
                icon: '📊',
                title: 'Analytics Inteligente',
                description: 'Métricas detalladas para medir el progreso y el impacto real de tus investigaciones',
                color: 'from-orange-500 to-red-500',
                badge: 'SMART-DATA'
              },
              {
                icon: '🌐',
                title: 'Acceso Universal',
                description: 'Disponible en todos tus dispositivos con experiencia optimizada para Robux',
                color: 'from-indigo-500 to-purple-500',
                badge: 'MULTI-DEVICE'
              },
              {
                icon: '🎯',
                title: 'Enfoque Académico',
                description: 'Diseñado específicamente para las necesidades únicas de la investigación académica moderna',
                color: 'from-pink-500 to-rose-500',
                badge: 'ACADEMIC-FIRST'
              }
            ].map((feature, index) => (
              <div key={index} className="card-rainbow p-10 text-center animate-slide-in-bounce hover:scale-105 transition-all duration-500" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="absolute top-4 right-4">
                  <div className="badge-vibrant text-xs animate-pulse-glow">
                    {feature.badge}
                  </div>
                </div>
                
                <div className={`w-20 h-20 mx-auto mb-8 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center shadow-2xl animate-bounce-vibrant`}>
                  <span className="text-4xl filter drop-shadow-lg">{feature.icon}</span>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-6 animate-shimmer-rainbow">
                  {feature.title}
                </h3>
                
                <p className="text-white/90 leading-relaxed text-lg font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
});

export default HomePage;