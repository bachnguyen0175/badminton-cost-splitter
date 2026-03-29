/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FDFCF8',
        foreground: '#2C2C24',
        primary: {
          DEFAULT: '#5D7052',
          foreground: '#F3F4F1',
        },
        secondary: {
          DEFAULT: '#C18C5D',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#E6DCCD',
          foreground: '#4A4A40',
        },
        muted: {
          DEFAULT: '#F0EBE5',
          foreground: '#78786C',
        },
        border: '#DED8CF',
        destructive: {
          DEFAULT: '#A85448',
        },
      },
      fontFamily: {
        heading: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        organic: '60% 40% 30% 70% / 60% 30% 70% 40%',
        'card-1': '2rem 2rem 2rem 4rem',
        'card-2': '2rem 4rem 2rem 2rem',
        'card-3': '4rem 2rem 2rem 2rem',
        'card-4': '2rem 2rem 4rem 2rem',
        'card-5': '3rem 2rem 3rem 2rem',
        'card-6': '2rem 3rem 2rem 3rem',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(93,112,82,0.15)',
        float: '0 10px 40px -10px rgba(193,140,93,0.2)',
        'soft-hover': '0 20px 40px -10px rgba(93,112,82,0.15)',
      },
      keyframes: {
        'blob-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-15px, 15px) scale(0.95)' },
        },
        'blob-drift-reverse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-20px, 25px) scale(0.95)' },
          '66%': { transform: 'translate(25px, -10px) scale(1.05)' },
        },
      },
      animation: {
        'blob-drift': 'blob-drift 20s ease-in-out infinite',
        'blob-drift-reverse': 'blob-drift-reverse 25s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
