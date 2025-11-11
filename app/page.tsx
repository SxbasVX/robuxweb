'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { memo, useEffect, useState } from 'react';
import TutorialOverlay from '../components/TutorialOverlay';
import ImageCarousel from '../components/ImageCarousel';

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
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                <span className="sticker blue">ROBUX</span>
                <span className="sticker pink">orientación</span>
                <span className="sticker green">experiencia</span>
              </div>

              <h1 className="hero-title">
                Red de Orientación en Bienestar
                <br />
                y Unidades de Experiencia
              </h1>

              <p className="text-base md:text-lg max-w-2xl mx-auto text-white/90 px-4">
                <span className="text-white bg-blue-900/60 px-2 md:px-3 py-1 rounded-lg">También nos puedes llamar:</span> <strong className="text-yellow-300 bg-blue-900/40 px-2 md:px-3 py-1 rounded-lg ml-1 md:ml-2">ROBUX</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Quiénes somos? */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-3 mb-6 md:mb-10">
            <span className="badge badge-blue">Sobre Nosotros</span>
            <h2 className="title-lg">¿Quiénes somos?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            <div className="card flex items-center" style={{borderColor:'var(--card-border)', padding: '2rem'}}>
              <div className="space-y-3 md:space-y-4">
                <p className="text-lg md:text-2xl leading-relaxed font-light">
                  Somos estudiantes de primer año de la <strong className="font-semibold text-blue-400">Facultad de Medicina San Fernando</strong> de la <strong className="font-semibold text-blue-400">Universidad Nacional Mayor de San Marcos</strong>.
                </p>
                <p className="text-base md:text-xl leading-relaxed text-gray-300">
                  Pertenecemos a la sección 17 del curso <strong>Lenguaje, Comunicación e Informática Aplicada a las Ciencias de la Salud</strong>.
                </p>
                <p className="text-base md:text-xl leading-relaxed text-gray-300">
                  Este blog es un espacio donde compartimos nuestros trabajos académicos y experiencias de aprendizaje-servicio, centradas en la humanización de la atención en salud.
                </p>
              </div>
            </div>
            <div className="card overflow-hidden h-full min-h-[300px] md:min-h-[400px]" style={{borderColor:'var(--card-border)', padding: 0}}>
              <ImageCarousel 
                images={[
                  "https://i.imgur.com/KDNNUTs.png",
                  "https://media.discordapp.net/attachments/1102376708662906901/1437823668125302845/836621dc-fb7d-41da-992c-2a0404f3df92.jpg?ex=6914a523&is=691353a3&hm=dc5b1407b1f0be1218be917c931e512699ee22360552e7dc972b68d145f87ce8&=&format=webp&width=1141&height=856", // Añade más URLs de imágenes aquí
                  "https://media.discordapp.net/attachments/1102376708662906901/1437823670335705268/a139f190-e660-4034-a538-153ee629e867.jpg?ex=6914a524&is=691353a4&hm=373f890648d3767c7253ed40c019568d2d1ab1100af17a325ca88533b516ccfc&=&format=webp&width=642&height=856",
                  "https://media.discordapp.net/attachments/1102376708662906901/1437823668578422804/e1e1df74-c51e-405b-9513-0367724742f0.jpg?ex=6914a524&is=691353a4&hm=b9ed00ad3abc4e58aa5ce1601c94c63337d9535dfa963fa2d9b7789be1e99123&=&format=webp&width=642&height=856"  // Ejemplo con 3 imágenes
                ]}
                alt="Facultad de Medicina San Fernando"
                autoPlayInterval={5000}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nuestro Propósito */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-3 mb-6 md:mb-10">
            <span className="badge badge-pink">Misión</span>
            <h2 className="title-lg">Nuestro Propósito</h2>
            <p className="text-base md:text-lg max-w-3xl mx-auto px-4" style={{color:'var(--muted-color)'}}>
              Ser un espacio digital que promueva la difusión académica, el debate ético y la salud comunitaria, reflejando el compromiso social de la Facultad de Medicina San Fernando.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="card" style={{borderColor:'var(--card-border)'}}>
              <div className="blob-pill mb-4" style={{background:'rgba(59,130,246,.15)', color:'var(--text-color)', width:'fit-content', fontSize:'1.25rem md:1.5rem', fontWeight:'bold'}}>
                01
              </div>
              <h3 className="title-md mb-3">Difusión Académica y Científica</h3>
              <p className="text-base md:text-lg" style={{color:'var(--muted-color)'}}>
                Publicar los ensayos, mapas conceptuales y videos realizados por los estudiantes, asegurando una presentación clara y bien organizada. También, servir como un lugar donde se reúna el conocimiento generado en el curso.
              </p>
            </div>

            <div className="card" style={{borderColor:'var(--card-border)'}}>
              <div className="blob-pill mb-4" style={{background:'rgba(236,72,153,.15)', color:'var(--text-color)', width:'fit-content', fontSize:'1.25rem md:1.5rem', fontWeight:'bold'}}>
                02
              </div>
              <h3 className="title-md mb-3">Fomento Ético y del Debate</h3>
              <p className="text-base md:text-lg" style={{color:'var(--muted-color)'}}>
                Ser un espacio de diálogo y retroalimentación entre estudiantes y docentes, donde se promueva el debate ético y el intercambio de ideas. Además, asegurar la transparencia indicando el uso de inteligencia artificial en los trabajos.
              </p>
            </div>

            <div className="card" style={{borderColor:'var(--card-border)'}}>
              <div className="blob-pill mb-4" style={{background:'rgba(34,197,94,.15)', color:'var(--text-color)', width:'fit-content', fontSize:'1.25rem md:1.5rem', fontWeight:'bold'}}>
                03
              </div>
              <h3 className="title-md mb-3">Intervenciones Educativas Comunitarias</h3>
              <p className="text-base md:text-lg" style={{color:'var(--muted-color)'}}>
                Compartir los informes y resultados de las intervenciones educativas comunitarias, reforzando el compromiso social y el aprendizaje en contextos reales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grupos (acceso rápido) */}
  <section className="section" id="grupos">
        <div className="container">
          <div className="text-center space-y-3 mb-6 md:mb-10">
            <span className="badge badge-green">Grupos</span>
            <h2 className="title-lg">Accede a tus grupos</h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto px-4">Entra directamente al tablero de cada grupo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1,2,3,4,5].map((id) => (
              <Link key={id} href={`/grupo/${id}`} className="card" style={{borderColor:'var(--card-border)'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="title-md">Grupo {id}</h3>
                    <p className="text-base md:text-lg" style={{color:'var(--muted-color)'}}>Tablero y recursos</p>
                  </div>
                  <div className="blob-pill text-xl md:text-2xl" style={{background:'rgba(59,130,246,.15)', color:'var(--text-color)'}}>➡️</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Normas de Convivencia */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-3 mb-6 md:mb-10">
            <span className="badge badge-green">Comunidad</span>
            <h2 className="title-lg">Nuestras normas de convivencia</h2>
          </div>
          <div className="card max-w-4xl mx-auto" style={{borderColor:'var(--card-border)'}}>
            <ol className="space-y-2 md:space-y-3 list-decimal list-inside text-base md:text-lg" style={{color:'var(--text-color)'}}>
              <li>Respetar a todos los compañeros y visitantes del blog.</li>
              <li>Aportar con contenidos académicos que ayuden al aprendizaje de todos.</li>
              <li>Usar un lenguaje adecuado y relacionado con el tema que se está tratando.</li>
              <li>Compartir solo información confiable y bien fundamentada.</li>
              <li>Promover la participación y el trabajo en equipo a través de debates y foros.</li>
              <li>Evitar el spam y mantener las publicaciones centradas en temas académicos.</li>
              <li>No hacer comentarios ofensivos ni publicar imágenes que puedan incomodar a otros.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-3 mb-6 md:mb-10">
            <span className="badge badge-pink">Contáctanos</span>
            <h2 className="title-lg">CONTACTO</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Información de contacto */}
            <div className="card space-y-4 md:space-y-6" style={{borderColor:'var(--card-border)'}}>
              <div>
                <h3 className="title-md mb-2">Dirección</h3>
                <p className="text-base md:text-lg" style={{color:'var(--muted-color)'}}>
                  Av. Miguel Grau 755,<br />
                  Lima 15001
                </p>
              </div>
              <div>
                <h3 className="title-md mb-2">Email</h3>
                <p className="text-base md:text-lg break-all" style={{color:'var(--muted-color)'}}>
                  secciondiecisiete@gmail.com
                </p>
              </div>
              <div className="flex gap-3 md:gap-4 flex-wrap">
                <a href="#" className="blob-pill" style={{background:'rgba(59,130,246,.15)', color:'var(--text-color)', padding: '0.625rem', fontSize: '1.25rem'}} aria-label="Facebook">
                  📘
                </a>
                <a href="#" className="blob-pill" style={{background:'rgba(59,130,246,.15)', color:'var(--text-color)', padding: '0.625rem', fontSize: '1.25rem'}} aria-label="Twitter">
                  🐦
                </a>
                <a href="https://www.instagram.com/robux.17?igsh=bjZ3eWJsdTc5djU4" target="_blank" rel="noopener noreferrer" className="blob-pill" style={{background:'rgba(59,130,246,.15)', color:'var(--text-color)', padding: '0.625rem', fontSize: '1.25rem'}} aria-label="Instagram">
                  📷
                </a>
              </div>
            </div>

            {/* Formulario de contacto */}
            <div className="card" style={{borderColor:'var(--card-border)'}}>
              <h3 className="title-md mb-4 md:mb-6">También puedes contactarnos con este formulario:</h3>
              <form className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-base md:text-lg mb-2" style={{color:'var(--text-color)'}}>Nombre</label>
                    <input 
                      type="text" 
                      className="w-full px-3 md:px-4 py-2 rounded-lg border-2 text-sm md:text-base" 
                      style={{borderColor:'var(--card-border)', background:'var(--bg-secondary)', color:'var(--text-color)'}}
                    />
                  </div>
                  <div>
                    <label className="block text-base md:text-lg mb-2" style={{color:'var(--text-color)'}}>Apellido</label>
                    <input 
                      type="text" 
                      className="w-full px-3 md:px-4 py-2 rounded-lg border-2 text-sm md:text-base" 
                      style={{borderColor:'var(--card-border)', background:'var(--bg-secondary)', color:'var(--text-color)'}}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-base md:text-lg mb-2" style={{color:'var(--text-color)'}}>Email *</label>
                  <input 
                    type="email" 
                    className="w-full px-3 md:px-4 py-2 rounded-lg border-2 text-sm md:text-base" 
                    style={{borderColor:'var(--card-border)', background:'var(--bg-secondary)', color:'var(--text-color)'}}
                    required
                  />
                </div>
                <div>
                  <label className="block text-base md:text-lg mb-2" style={{color:'var(--text-color)'}}>Mensaje</label>
                  <textarea 
                    rows={4}
                    className="w-full px-3 md:px-4 py-2 rounded-lg border-2 text-sm md:text-base" 
                    style={{borderColor:'var(--card-border)', background:'var(--bg-secondary)', color:'var(--text-color)'}}
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full btn-primary text-sm md:text-base"
                  style={{background:'#D4ED31', color:'#000', fontWeight:'bold'}}
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default HomePage;