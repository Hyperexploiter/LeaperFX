/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'in': 'fadeIn 0.3s ease-in',
        'animate-in': 'fadeIn 0.3s ease-in',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-out'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      scale: {
        '102': '1.02',
        '105': '1.05'
      }
    },
  },
  plugins: [],
}
