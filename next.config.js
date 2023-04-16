/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com',"user-images.githubusercontent.com"],
  },
}

module.exports = nextConfig
