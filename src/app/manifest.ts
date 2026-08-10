import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wall of Notes',
    short_name: 'Notes Wall',
    description: 'Leave a thought, a quote, or just say hi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#facc15',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
