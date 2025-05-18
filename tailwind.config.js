/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Add other paths here if you have components elsewhere, e.g. './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Custom variables for theming (does not remove Tailwind's defaults)
        border: 'var(--border)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // You do NOT need to re-define gray, blue, etc. unless customizing
      },
      borderColor: {
        border: 'var(--border)',
      },
      outlineColor: {
        ring: 'var(--ring)',
      },
      backgroundColor: {
        background: 'var(--background)',
      },
      textColor: {
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Add more plugins here, e.g.:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};

module.exports = config;
