/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.3px' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.3px' }],
        base: ['1rem', { lineHeight: '1.6rem', letterSpacing: '-0.3px' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.3px' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.3px' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.5px' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.5px' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.5px' }],
        '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.5px' }],
      },
      colors: {
        primary: '#0066CC',
        secondary: '#F5F5F5',
        dark: '#0f172a',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      }
    },
  },
  plugins: [],
}
