/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary navy palette (from light.html)
        primary: '#001736',
        'primary-container': '#002b5b',
        'primary-fixed': '#d6e3ff',
        'primary-fixed-dim': '#a9c7ff',
        'on-primary': '#ffffff',
        // Secondary
        secondary: '#515f74',
        'secondary-container': '#d5e3fc',
        'on-secondary-container': '#57657a',
        // Tertiary teal
        tertiary: '#001b18',
        'tertiary-fixed': '#89f5e7',
        'tertiary-fixed-dim': '#6bd8cb',
        'on-tertiary-container': '#2ca397',
        // Surface
        surface: '#f9f9ff',
        'surface-dim': '#cfdaf2',
        'surface-bright': '#f9f9ff',
        'surface-container': '#e7eeff',
        'surface-container-low': '#f0f3ff',
        'surface-container-high': '#dee8ff',
        'surface-container-highest': '#d8e3fb',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#111c2d',
        'on-surface-variant': '#43474f',
        // Misc
        outline: '#747780',
        'outline-variant': '#c4c6d0',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'inverse-surface': '#263143',
        'inverse-primary': '#a9c7ff',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,23,54,0.08), 0 1px 2px -1px rgba(0,23,54,0.05)',
        'card-hover': '0 4px 12px 0 rgba(0,23,54,0.12)',
      },
    },
  },
  plugins: [],
};
