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
        primary: { DEFAULT: '#6965BC', 50: '#F5F4FF', 100: '#EBE9FE', 500: '#6965BC', 600: '#5854A8', 700: '#484494' },
        sidebar: '#0f1117',
        surface: '#FFFFFF',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        ink: { DEFAULT: '#0F172A', secondary: '#475569', muted: '#94A3B8', disabled: '#CBD5E1' },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },

      spacing: { sidebar: '240px', topbar: '52px' },
    },

  },
  plugins: [],
}
export default config
