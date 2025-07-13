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
  // Add environment variables
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://stockdashboard.ddnsfree.com',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://stockdashboard.ddnsfree.com/api',
  },
};

module.exports = nextConfig;