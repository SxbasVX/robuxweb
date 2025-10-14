import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.08)'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      }
    }
  },
  plugins: []
} satisfies Config
