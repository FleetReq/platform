import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { Navigation } from "./components/navigation";
import Analytics from "./components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fleetreq.vercel.app'),
  title: {
    default: "FleetReq - Fleet Management & Mileage Tracking",
    template: "%s | FleetReq"
  },
  description: "Professional fleet management and mileage tracking for contractors. Track fuel efficiency, maintenance schedules, and IRS-compliant tax deductions. Save $8,000+ on taxes annually.",
  keywords: [
    "fleet management",
    "mileage tracking",
    "vehicle maintenance",
    "fuel tracking",
    "tax deduction",
    "IRS mileage",
    "contractor tools",
    "business mileage",
    "MPG tracking",
    "vehicle records",
    "fleet tracking",
    "maintenance tracking"
  ],
  authors: [{ name: "FleetReq", url: "https://fleetreq.vercel.app" }],
  creator: "FleetReq",
  publisher: "FleetReq",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fleetreq.vercel.app",
    title: "FleetReq - Fleet Management & Mileage Tracking",
    description: "Professional fleet management and mileage tracking for contractors. Track fuel efficiency, maintenance schedules, and IRS-compliant tax deductions.",
    siteName: "FleetReq",
  },
  twitter: {
    card: "summary_large_image",
    title: "FleetReq - Fleet Management & Mileage Tracking",
    description: "Professional fleet management and mileage tracking for contractors. Track fuel efficiency, maintenance schedules, and IRS-compliant tax deductions.",
  },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('resume-theme') || 'system';
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var currentTheme = theme === 'system' ? systemTheme : theme;
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(currentTheme);
                  document.documentElement.style.colorScheme = currentTheme;
                } catch (e) {
                  document.documentElement.classList.add('system');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white min-h-screen`}
      >
        <ThemeProvider defaultTheme="system" storageKey="resume-theme">
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>

          {/* Professional footer */}
          <footer className="border-t border-gray-200/60 dark:border-gray-700/40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-elegant">
                    <span className="text-sm font-bold text-white">FR</span>
                  </div>
                  <span className="text-lg font-bold text-gradient-primary">FleetReq</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Fleet Management & Mileage Tracking for Contractors
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  © 2025 FleetReq. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
        <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'FleetReq',
              applicationCategory: 'BusinessApplication',
              description: 'Professional fleet management and mileage tracking for contractors. Track fuel efficiency, maintenance schedules, and IRS-compliant tax deductions.',
              url: 'https://fleetreq.vercel.app',
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: 'USD',
                lowPrice: '0',
                highPrice: '12',
                priceSpecification: [
                  {
                    '@type': 'UnitPriceSpecification',
                    price: '0',
                    priceCurrency: 'USD',
                    name: 'Free'
                  },
                  {
                    '@type': 'UnitPriceSpecification',
                    price: '4',
                    priceCurrency: 'USD',
                    name: 'Personal'
                  },
                  {
                    '@type': 'UnitPriceSpecification',
                    price: '12',
                    priceCurrency: 'USD',
                    name: 'Business'
                  }
                ]
              }
            })
          }}
        />
      </body>
    </html>
  );
}
