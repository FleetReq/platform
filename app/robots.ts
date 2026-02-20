import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fleetreq.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
