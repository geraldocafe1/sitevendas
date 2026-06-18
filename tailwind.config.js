/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F172A',
          light: '#1E40AF',
        },
        accent: '#F59E0B',
        surface: '#F8FAFC',
        'surface-alt': '#FFFFFF',
        text: '#0F172A',
        'text-muted': '#64748B',
        border: '#E2E8F0',
        success: '#10B981',
        danger: '#EF4444'
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
