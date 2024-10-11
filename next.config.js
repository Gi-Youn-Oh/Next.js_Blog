/** @type {import('next').NextConfig} */

const nextConfig = {
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

module.exports = nextConfig;
