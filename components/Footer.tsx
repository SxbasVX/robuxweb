export default function Footer() {
  return (
    <footer className="footer-zonecraft mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Logo y branding estilo ZoneCraft */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <h3 className="text-2xl font-bold text-white">
              ROBUX
            </h3>
          </div>
          
          <p className="text-base text-white/80 mb-8 max-w-lg mx-auto">
            Página Oficial de ROBUX : Desarrollado por{' '}
            <a 
              href="mailto:contact@sxbas.dev" 
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 hover:underline"
            >
              Sxbas
            </a>
          </p>
          
          {/* Enlaces eliminados para lanzamiento limpio */}
          
          {/* Línea divisoria ZoneCraft */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} ROBUX. Red de Orientación en Bienestar y Unidades de Experiencia.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
