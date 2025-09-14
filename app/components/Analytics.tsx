'use client'

import Script from 'next/script'

interface AnalyticsProps {
  gaId?: string
  plausibleDomain?: string
}

export default function Analytics({ gaId, plausibleDomain }: AnalyticsProps) {
  const isProduction = process.env.NODE_ENV === 'production'

  // Prefer Google Analytics if GA ID is provided
  const shouldLoadGA = gaId && isProduction

  if (shouldLoadGA) {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>
      </>
    )
  }

  // Fallback to Plausible if domain is provided and no GA
  if (plausibleDomain && isProduction) {
    return (
      <>
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </>
    )
  }

  return null
}

// Alternative: Privacy-focused Plausible Analytics
interface PlausibleProps {
  domain?: string
}

export function PlausibleAnalytics({ domain }: PlausibleProps) {
  const shouldLoadPlausible = domain && process.env.NODE_ENV === 'production'

  if (!shouldLoadPlausible) {
    return null
  }

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  )
}

// Event tracking helper
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties)
  }
}

// Page view tracking for SPA navigation
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_title: title || document.title,
      page_location: url,
    })
  }
}

// TypeScript declarations
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}