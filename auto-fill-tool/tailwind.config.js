/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './src/presentation/**/*.{ts,js}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#5568d3',
          light: '#7c8ff0',
        },
        secondary: '#764ba2',
        success: {
          DEFAULT: '#2ecc71',
          light: '#48d983',
        },
        danger: {
          DEFAULT: '#e74c3c',
          light: '#ed6456',
        },
        warning: '#f39c12',
        info: '#3498db',
        disabled: '#95a5a6',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-success': 'linear-gradient(135deg, #2ecc71 0%, #48d983 100%)',
        'gradient-danger': 'linear-gradient(135deg, #e74c3c 0%, #ed6456 100%)',
      },
      boxShadow: {
        primary: '0 4px 12px rgba(102, 126, 234, 0.4)',
        success: '0 4px 12px rgba(46, 204, 113, 0.4)',
        danger: '0 4px 12px rgba(231, 76, 60, 0.4)',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        modal: '9999',
        notification: '10000',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(400px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        indeterminate: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '0 0' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease',
        'fade-out': 'fadeOut 0.2s ease',
        shimmer: 'shimmer 2s infinite',
        indeterminate: 'indeterminate 1.5s infinite ease-in-out',
        'spin-slow': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
