import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fleetreq.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
  ]
}
