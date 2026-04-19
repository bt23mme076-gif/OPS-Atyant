import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', 50: '#EFF6FF', 100: '#DBEAFE', 500: '#2563EB', 600: '#1D4ED8', 700: '#1E40AF' },
        surface: '#FFFFFF',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        ink: { DEFAULT: '#0F172A', secondary: '#475569', muted: '#94A3B8', disabled: '#CBD5E1' },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: { sidebar: '240px', topbar: '52px' },
    },
  },
  plugins: [],
}
export default config
