import './globals.css';
import { ReactNode } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Providers from '../components/Providers';
import PWABanner from '../components/PWABanner';

export const metadata = {
  title: 'Robux: Red de Orientación en Bienestar y Unidades de Experiencia',
  description: 'Robux: Red de Orientación en Bienestar y Unidades de Experiencia. Colaboración, proyectos y bienestar en una sola plataforma.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  title: 'Robux: Red de Orientación en Bienestar y Unidades de Experiencia'
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: '/icons/apple-touch-icon.png'
  }
};

export function generateViewport() {
  return {
    themeColor: '#7c3aed',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth dark">
      <head>
        {/* Set initial theme early to avoid white flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = stored ? stored === 'dark' : prefersDark;
    const root = document.documentElement;
    if (useDark) root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();`,
          }}
        />
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col transition-colors duration-300">
        <Providers>
          <Navbar />
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="animate-fade-in-up">
              {children}
            </div>
          </main>
          <Footer />
          <PWABanner />
        </Providers>
      </body>
    </html>
  );
}
