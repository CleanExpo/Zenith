/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // Corrected from 'tailwindcss'
    'autoprefixer': {},
  },
};

export default config;
