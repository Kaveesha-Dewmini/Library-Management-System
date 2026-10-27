/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F5',
        ink: {
          DEFAULT: '#1A2238',
          blue: '#1E3A5F',
          dark: '#0F1420',
          card: '#161C2C'
        },
        amber: {
          brand: '#E09F3E',
          hover: '#C88B32'
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
