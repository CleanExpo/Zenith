import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Add other paths here if you have components elsewhere, e.g. './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      // You can extend the default Tailwind theme here
      // For example, adding custom colors, fonts, etc.
      // colors: {
      //   'brand-primary': '#123456',
      // },
    },
  },
  plugins: [
    // require('tailwindcss-animate'), // Temporarily commented out for testing
    // You can add Tailwind CSS plugins here
    // For example, require('@tailwindcss/forms') or require('@tailwindcss/typography')
  ],
};
export default config;
