import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    "name": "Giyoun's blog",
    "short_name": "Giyoun's blog",
    "description": "Giyoun's blog",
    "start_url": "/",
    "display": "standalone",
    "icons": [
      {
        "src": "/favicon.ico",
        "sizes": "any",
        "type": "image/x-icon"
      }
    ]
  }
}
