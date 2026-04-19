/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Lora', 'serif'],
        editorial: ['Lora', 'serif'],
      },
      colors: {
        brand: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#111827', // Blackish for brand instead of neon blue
          600: '#000000',
          900: '#000000',
        },
        dark: {
          bg: '#121212', // Charcoal
          card: '#1e1e1e',
          border: '#333333'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
