import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0F1B33',
          active: '#2F5597',
          text: '#C9D3E6',
        },
        primary: {
          DEFAULT: '#2F6DB5',
          hover: '#265A96',
        },
        app: {
          bg: '#F4F6FA',
        },
        card: {
          bg: '#FFFFFF',
          border: '#E3E8F0',
        },
        text: {
          primary: '#111827',
          secondary: '#5B6678',
        },
        status: {
          working: {
            bg: '#DFF3E5',
            text: '#2E7D4F',
          },
          'weekly-off': {
            bg: '#D9E6FA',
            text: '#2F5597',
          },
          leave: {
            bg: '#FBEBC0',
            text: '#8A5A00',
          },
          holiday: {
            bg: '#E8E3F3',
            text: '#5A4B81',
          },
          'comp-off': {
            bg: '#D8EEF0',
            text: '#1F6F78',
          },
        },
        error: {
          DEFAULT: '#D64545',
          bg: '#FBE4E4',
        },
        warning: {
          DEFAULT: '#B7791F',
          bg: '#FDF1D6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
