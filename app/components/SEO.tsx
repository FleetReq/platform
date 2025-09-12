import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

export function generateSEO({
  title = "Bruce Truong - Site Reliability Engineer",
  description = "Site Reliability Engineer with expertise in Kubernetes, Go development, and infrastructure automation. Specializing in scalable systems and team leadership.",
  image = "/images/og-image.jpg",
  url = "https://brucetruong.com",
  type = "website"
}: SEOProps = {}): Metadata {
  return {
    title,
    description,
    keywords: [
      "Site Reliability Engineer",
      "SRE",
      "Kubernetes",
      "Go",
      "Python",
      "Infrastructure",
      "DevOps",
      "MongoDB",
      "Terraform",
      "GCP",
      "Bruce Truong",
      "Portland"
    ],
    authors: [{ name: "Bruce Truong" }],
    creator: "Bruce Truong",
    publisher: "Bruce Truong",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: type as 'website' | 'article',
      locale: 'en_US',
      url,
      title,
      description,
      siteName: "Bruce Truong - Portfolio",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@brucetruong', // Update with your actual Twitter handle if you have one
    },
    alternates: {
      canonical: url,
    },
    verification: {
      google: 'your-google-verification-code', // Add when you get one
    }
  }
}

export const defaultSEO = generateSEO()