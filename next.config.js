/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable API routes
  experimental: {
    serverComponentsExternalPackages: ['@vercel/postgres'],
  },
  // Configure allowed image sources using remotePatterns instead of domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.stockscores.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;