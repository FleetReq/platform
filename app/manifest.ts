import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FleetReq - Fleet Management & Mileage Tracking',
    short_name: 'FleetReq',
    description: 'Professional fleet management and mileage tracking for contractors. Track fuel efficiency, maintenance schedules, and IRS-compliant tax deductions.',
    start_url: '/dashboard/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      // PNG icons are required by Chrome for the PWA install prompt
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      // SVG fallback for browsers that support it
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    scope: '/',
    orientation: 'portrait',
    categories: ['business', 'productivity', 'utilities'],
  }
}