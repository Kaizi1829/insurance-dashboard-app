import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#2563eb',
          700: '#1d4ed8',
          900: '#0f172a'
        },
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626'
      },
      boxShadow: {
        panel: '0 8px 24px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
