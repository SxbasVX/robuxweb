'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { memo, useMemo } from 'react';

// Memoize grupos para evitar re-creación
const academicGroups = [
  { 
    id: 1, 
    name: 'Grupo 1', 
    description: 'Investigación en Tecnologías Emergentes',
    topic: 'Inteligencia Artificial y Machine Learning',
    members: ['Ana García', 'Luis Martínez', 'Sofia Rodríguez', 'Carlos López'],
    color: 'from-blue-500 to-cyan-600',
    icon: '🤖'
  },
  { 
    id: 2, 
    name: 'Grupo 2', 
    description: 'Desarrollo Sostenible y Medio Ambiente',
    topic: 'Energías Renovables y Conservación',
    members: ['María Hernández', 'Diego Morales', 'Elena Vega', 'Roberto Silva'],
    color: 'from-green-500 to-emerald-600',
    icon: '🌱'
  },
  { 
    id: 3, 
    name: 'Grupo 3', 
    description: 'Innovación en Salud Digital',
    topic: 'Telemedicina y Aplicaciones Médicas',
    members: ['Carmen Ruiz', 'Andrés Torres', 'Lucía Jiménez', 'Fernando Castro'],
    color: 'from-purple-500 to-violet-600',
    icon: '⚕️'
  },
  { 
    id: 4, 
    name: 'Grupo 4', 
    description: 'Educación Digital y Nuevas Metodologías',
    topic: 'Plataformas de Aprendizaje Interactivo',
    members: ['Patricia Mendoza', 'Javier Santos', 'Isabella Ramos', 'Miguel Ortega'],
    color: 'from-pink-500 to-rose-600',
    icon: '📚'
  },
  { 
    id: 5, 
    name: 'Grupo 5', 
    description: 'Blockchain y Criptoeconomía',
    topic: 'Aplicaciones Descentralizadas y DeFi',
    members: ['Valentina Cruz', 'Sebastián Vargas', 'Camila Delgado', 'Nicolás Pérez'],
    color: 'from-orange-500 to-amber-600',
    icon: '⛓️'
  },
];

// Componente de grupo memoizado para evitar re-renders innecesarios
const GroupCard = memo(function GroupCard({ group, index }: { group: typeof academicGroups[0], index: number }) {
  return (
    <div 
      className="group gpu-accelerated"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <Link href={`/grupo/${group.id}`}>
        <div className="glass bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-white/20 hover:border-white/30 hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${group.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg backdrop-blur-sm`}>
            <span className="text-3xl">{group.icon}</span>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
            {group.name}
          </h3>
          
          <h4 className="text-lg font-semibold text-blue-300 mb-3">
            {group.topic}
          </h4>
          
          <p className="text-gray-400 mb-6 text-base leading-relaxed">
            {group.description}
          </p>
          
          <div className="glass bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4">
            <h5 className="text-sm font-semibold text-white mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Integrantes ({group.members.length})
            </h5>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
              {group.members.map((member, idx) => (
                <div key={idx} className="truncate">{member}</div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full shadow-sm"></div>
              <span className="font-medium">Ensayos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full shadow-sm"></div>
              <span className="font-medium">Videos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full shadow-sm"></div>
              <span className="font-medium">Intervención</span>
            </div>
          </div>
          
          <div className="mt-6 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>
    </div>
  );
});

// Componente de feature memoizado
const FeatureCard = memo(function FeatureCard({ feature, index }: { feature: any, index: number }) {
  return (
    <div 
      className="text-center group gpu-accelerated hover:scale-105 transition-transform duration-300"
      style={{ animationDelay: `${1.9 + index * 0.1}s` }}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300 glass backdrop-blur-sm border border-white/20`}>
        <span className="text-2xl">{feature.icon}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
    </div>
  );
});

const HomePage = memo(function HomePage() {
  const { user } = useAuth();

  // Memoize las features para evitar re-creación
  const features = useMemo(() => [
    { 
      icon: '📝', 
      title: 'Ensayos Individuales', 
      desc: 'Cada integrante desarrolla ensayos académicos sobre el tema del grupo',
      gradient: 'from-blue-500 to-purple-500'
    },
    { 
      icon: '🎥', 
      title: 'Videos Explicativos', 
      desc: 'Contenido audiovisual que complementa la investigación de cada miembro',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      icon: '🤝', 
      title: 'Intervención Grupal', 
      desc: 'Proyecto final colaborativo con conclusiones y evidencias fotográficas',
      gradient: 'from-pink-500 to-red-500'
    },
    { 
      icon: '📄', 
      title: 'Visor de Documentos', 
      desc: 'Visualización integrada de PDFs y documentos académicos sin descargas',
      gradient: 'from-orange-500 to-amber-500'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative overflow-hidden">
      {/* Floating Illustrations - CSS animations for performance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-12 w-20 h-24 glass-card bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg animate-float-slow gpu-accelerated">
          <div className="p-3 text-center">
            <div className="text-xl mb-1 text-white">📝</div>
            <div className="text-xs font-medium text-white/80">Ensayos</div>
          </div>
        </div>

        <div className="absolute top-32 right-16 w-20 h-24 glass-card bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg animate-float-medium gpu-accelerated">
          <div className="p-3 text-center">
            <div className="text-xl mb-1 text-white">🎥</div>
            <div className="text-xs font-medium text-white/80">Videos</div>
          </div>
        </div>

        <div className="absolute bottom-40 left-16 w-20 h-24 glass-card bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg animate-float-fast gpu-accelerated">
          <div className="p-3 text-center">
            <div className="text-xl mb-1 text-white">🤝</div>
            <div className="text-xs font-medium text-white/80">Grupo</div>
          </div>
        </div>

        <div className="absolute bottom-32 right-12 w-20 h-24 glass-card bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg animate-float-slow gpu-accelerated">
          <div className="p-3 text-center">
            <div className="text-xl mb-1 text-white">📊</div>
            <div className="text-xs font-medium text-white/80">Datos</div>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center z-10 animate-fade-in">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-8 text-white leading-tight animate-slide-up">
            Proyectos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Académicos</span> 
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Innovadores</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up-delay">
            Plataforma académica donde cada grupo presenta sus investigaciones, ensayos individuales, videos explicativos y proyectos de intervención grupal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-delay">
            {user ? (
              <div className="text-gray-400 text-lg font-medium">
                ¡Bienvenido de vuelta! Explora los grupos abajo 👇
              </div>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/25 glass backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105">
                    Empezar Ahora
                  </button>
                </Link>
                <button className="px-8 py-4 glass bg-white/10 backdrop-blur-xl border border-white/30 hover:bg-white/20 text-white rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105">
                  Ver Todos Los Grupos
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Groups Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-white animate-slide-up">
            Grupos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Investigación</span>
          </h2>
          
          <p className="text-center text-gray-400 text-lg mb-16 max-w-2xl mx-auto animate-slide-up-delay">
            Cada grupo desarrolla un proyecto académico específico con ensayos individuales, videos explicativos y una intervención grupal final.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {academicGroups.map((group, index) => (
              <GroupCard key={group.id} group={group} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 glass bg-slate-800/30 backdrop-blur-xl border-y border-white/10 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6 animate-slide-up">
            Componentes <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Académicos</span>
          </h2>
          
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto animate-slide-up-delay">
            Cada grupo académico integra múltiples formatos de contenido para una experiencia de aprendizaje completa.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-gray-400 border-t border-white/10 glass bg-slate-800/20 backdrop-blur-xl relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Plataforma Académica
            </h3>
          </div>
          <p className="text-gray-300 mb-4">Compartiendo conocimiento e investigación académica</p>
          <p className="text-sm">&copy; 2024 Plataforma Académica. Desarrollado para la presentación de proyectos de investigación.</p>
        </div>
      </footer>
    </div>
  );
});

export default HomePage;