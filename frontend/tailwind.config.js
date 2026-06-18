import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Safelist grid column classes for dynamic sections
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-6',
    'grid-cols-8',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'md:grid-cols-4',
    'md:grid-cols-6',
    'md:grid-cols-8',
    'lg:grid-cols-2',
    'lg:grid-cols-3',
    'lg:grid-cols-4',
    'lg:grid-cols-6',
    'lg:grid-cols-8',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A54B31', // Authentic Terracotta Red
          dark: '#8B0000',
        },
        'village-red': '#A54B31',
        'village-orange': '#FF9933',
        'village-green': '#2E7D32',
        'village-cream': '#FFF9F0',
        'village-umber': '#3E2723',
        'village-mustard': '#E1AD01',
        cream: '#FFF9F0',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
