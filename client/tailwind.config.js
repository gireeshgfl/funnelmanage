// ===============================================================================
// GoFreeLab Proprietary
// -------------------------------------------------------------------------------
// Project Name    : Eduvocate
// File Name       : tailwind.config.js
// -------------------------------------------------------------------------------
// Copyright (c) 2025 GoFreeLab. All rights reserved.
// ===============================================================================

module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {screens: {
    'xs': '375px',   // Extra small devices (phones)
    'sm': '640px',   // Small devices (tablets)
    'md': '768px',   // Medium devices (laptops)
    'lg': '1024px',  // Large devices (desktops)
    'xl': '1280px',  // Extra large devices
    '2xl': '1536px', // Larger screens
    'mobile-break': '750px', // Custom breakpoint for role switcher
  },
    
    extend: {
      fontFamily: {
        sans: ['Inter', 'Open Sans', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      colors: {
        // Light mode colors
        primary: {
          50: '#f0f5ff',
          100: '#dbe6ff',
          200: '#b8ccff',
          300: '#8aaaff',
          400: '#5c88ff',
          500: '#2e66ff',
          600: '#2859e6',
          700: '#224dcc',
          800: '#1c41b3',
          900: '#163599',
        },
        secondary: {
          50: '#f3f7ff',
          100: '#e0eaff',
          200: '#c1d3ff',
          300: '#9ab8ff',
          400: '#739dff',
          500: '#5282ff',
          600: '#4a73e6',
          700: '#4164cc',
          800: '#3955b3',
          900: '#304699',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Status colors
        green: {
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        yellow: {
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        blue: {
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        red: {
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Dark mode colors (inverted)
        dark: {
          primary: {
            50: '#3b0764',
            100: '#581c87',
            200: '#6b21a8',
            300: '#86198f',
            400: '#a529b7',
            500: '#c084fc',
            600: '#d8b4fe',
            700: '#e9d5ff',
            800: '#f3e8ff',
            900: '#f9f5ff',
          },
          gray: {
            50: '#111827',
            100: '#1f2937',
            200: '#374151',
            300: '#4b5563',
            400: '#6b7280',
            500: '#9ca3af',
            600: '#d1d5db',
            700: '#e5e7eb',
            800: '#f3f4f6',
            900: '#f9fafb',
          },
          green: {
            900: '#d1fae5',
            800: '#a7f3d0',
            700: '#6ee7b7',
            600: '#34d399',
            500: '#10b981',
            400: '#059669',
            300: '#047857',
            200: '#065f46',
            100: '#064e3b',
          },
          yellow: {
            900: '#fef3c7',
            800: '#fde68a',
            700: '#fcd34d',
            600: '#fbbf24',
            500: '#f59e0b',
            400: '#d97706',
            300: '#b45309',
            200: '#92400e',
            100: '#78350f',
          },
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm-dark': '0 1px 2px 0 rgba(255, 255, 255, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'DEFAULT-dark': '0 1px 3px 0 rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(255, 255, 255, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'md-dark': '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'lg-dark': '0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'xl-dark': '0 20px 25px -5px rgba(255, 255, 255, 0.1), 0 10px 10px -5px rgba(255, 255, 255, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '2xl-dark': '0 25px 50px -12px rgba(255, 255, 255, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.5)',
        'focus-dark': '0 0 0 3px rgba(37, 99, 235, 0.5)',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      maxWidth: {
        '7xl': '80rem',
        '8xl': '90rem',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Course card specific extensions
      extend: {
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'spin-slow': 'spin 2s linear infinite',
          'card-hover': 'cardHover 0.2s ease-out forwards',
        },
        keyframes: {
          cardHover: {
            '0%': { transform: 'translateY(0)', boxShadow: 'var(--tw-shadow-md)' },
            '100%': { transform: 'translateY(-4px)', boxShadow: 'var(--tw-shadow-lg)' },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    // Custom plugin for course cards
    function ({ addComponents, theme }) {
      addComponents({
        '.course-card': {
          backgroundColor: theme('colors.white'),
          borderColor: theme('colors.gray.200'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.DEFAULT'),
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.lg'),
            transform: 'translateY(-4px)',
          },
          '@media (prefers-color-scheme: dark)': {
            backgroundColor: theme('colors.dark.800'),
            borderColor: theme('colors.dark.700'),
            boxShadow: theme('boxShadow.DEFAULT-dark'),
            '&:hover': {
              boxShadow: theme('boxShadow.lg-dark'),
            },
          },
        },
        '.course-status-published': {
          backgroundColor: theme('colors.green.100'),
          color: theme('colors.green.800'),
          '@media (prefers-color-scheme: dark)': {
            backgroundColor: theme('colors.dark.green.900'),
            color: theme('colors.dark.green.100'),
          },
        },
        '.course-status-draft': {
          backgroundColor: theme('colors.yellow.100'),
          color: theme('colors.yellow.800'),
          '@media (prefers-color-scheme: dark)': {
            backgroundColor: theme('colors.dark.yellow.900'),
            color: theme('colors.dark.yellow.100'),
          },
        },
        '.progress-bar': {
          backgroundColor: theme('colors.gray.200'),
          '@media (prefers-color-scheme: dark)': {
            backgroundColor: theme('colors.dark.gray.700'),
          },
        },
        '.progress-fill': {
          backgroundColor: theme('colors.blue.600'),
          '@media (prefers-color-scheme: dark)': {
            backgroundColor: theme('colors.blue.400'),
          },
        },
      });
    },
  ],
};