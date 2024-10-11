import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    "name": "Giyoun's blog",
    "short_name": "Giyoun's blog",
    "description": "Giyoun's blog",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#ffffff",
    "background_color": "#ffffff",
    "icons": [
      {
        "src": "/images/splash-img.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      }
    ]
  }
}
