/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['uqfgdezadpkiadugufbs.supabase.co'],
    unoptimized: false,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Ensure CSS is properly extracted and loaded
  webpack: (config) => {
    // Optimize CSS loading
    const oneOfRule = config.module.rules.find(
      (rule) => typeof rule.oneOf === 'object'
    );

    if (oneOfRule) {
      const cssRule = oneOfRule.oneOf.find(
        (rule) => rule.test && rule.test.toString().includes('css')
      );

      if (cssRule) {
        cssRule.sideEffects = true;
      }
    }

    return config;
  },
};

export default nextConfig;
