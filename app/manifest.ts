import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FleetReq - Fleet Management & Mileage Tracking',
    short_name: 'FleetReq',
    description: 'Professional fleet management and mileage tracking for contractors. Track fuel efficiency, maintenance schedules, and IRS-compliant tax deductions.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    scope: '/',
    orientation: 'portrait',
    categories: ['business', 'productivity', 'utilities'],
  }
}