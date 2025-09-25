/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'thinkingincapital.wpcomstaging.com',
      },
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
    ],
  },
};

export default nextConfig;