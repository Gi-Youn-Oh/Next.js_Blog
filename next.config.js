/** @type {import('next').NextConfig} */

const runtimeCaching = require('next-pwa/cache');
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching,
})

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

module.exports = withPWA(nextConfig);
