/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // --- PERMANENT QUALITY GUARDRAIL ---
  // Enforces strict code standards during the Docker build phase
  eslint: {
    ignoreDuringBuilds: false, 
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nominatim.openstreetmap.org' },
      { protocol: 'https', hostname: 'tile.openstreetmap.org' },
    ],
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Added a fallback value ('http://localhost:4000') so Next.js never sees an 'undefined' string
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
