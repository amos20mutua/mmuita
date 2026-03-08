/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: '#061f18',
        panel: '#0f2f25',
        line: '#1d4e3d',
        brand: '#22c55e',
        accent: '#fbbf24'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.22)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
}
