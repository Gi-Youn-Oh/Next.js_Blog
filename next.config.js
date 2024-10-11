/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
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
