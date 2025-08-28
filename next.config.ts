import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "img.shields.io",
      },
      {
        protocol: 'https',
        hostname: "user-images.githubusercontent.com",
      },
      {
        protocol: 'https',
        hostname: "github.com",
      }
    ],
  }
}

export default nextConfig;
