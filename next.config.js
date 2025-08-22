/** @type {import('next').NextConfig} */

const withPWAInit = require("next-pwa");
const isDev = process.env.NODE_ENV !== "production";

const withPWA = withPWAInit({
  dest: 'public',
  disable: isDev,

  exclude: [
    // add buildExcludes here
    ({ asset, compilation }) => {
      if (
          asset.name.startsWith("server/") ||
          asset.name.match(/^((app-|^)build-manifest\.json|react-loadable-manifest\.json)$/)
      ) {
        return true;
      }
      if (isDev && !asset.name.startsWith("static/runtime/")) {
        return true;
      }
      return false;
    }
  ],
});

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
