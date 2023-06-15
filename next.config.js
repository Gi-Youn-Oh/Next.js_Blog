/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["img.shields.io","user-images.githubusercontent.com","github.com"],
  },
}

module.exports = nextConfig
