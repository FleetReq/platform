import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { Navigation } from "./components/navigation";
import Analytics from "./components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://brucetruong.com'),
  title: {
    default: "Bruce Truong - Site Reliability Engineer | Cloud Infrastructure Expert",
    template: "%s | Bruce Truong"
  },
  description: "Site Reliability Engineer specializing in cloud migration, infrastructure automation, and high-availability systems. Successfully migrated 60+ billion documents to production at Apex Fintech Solutions.",
  keywords: [
    "Site Reliability Engineer",
    "SRE",
    "Cloud Migration",
    "Infrastructure Engineer",
    "DevOps",
    "Kubernetes",
    "MongoDB",
    "GCP",
    "Terraform",
    "Go",
    "Python",
    "System Architecture",
    "High Availability",
    "Bruce Truong",
    "Portland Oregon",
    "Software Engineer"
  ],
  authors: [{ name: "Bruce Truong", url: "https://brucetruong.com" }],
  creator: "Bruce Truong",
  publisher: "Bruce Truong",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://brucetruong.com",
    title: "Bruce Truong - Site Reliability Engineer | Cloud Infrastructure Expert",
    description: "Site Reliability Engineer specializing in cloud migration, infrastructure automation, and high-availability systems. Successfully migrated 60+ billion documents to production.",
    siteName: "Bruce Truong Portfolio",
    images: [
      {
        url: "/images/profile.jpg",
        width: 1200,
        height: 630,
        alt: "Bruce Truong - Site Reliability Engineer"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bruce Truong - Site Reliability Engineer | Cloud Infrastructure Expert",
    description: "Site Reliability Engineer specializing in cloud migration, infrastructure automation, and high-availability systems.",
    images: ["/images/profile.jpg"],
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
  // verification: {
  //   google: 'your-google-verification-code', // Add your Google Search Console verification code here
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white min-h-screen`}
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
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-elegant">
                    <span className="text-sm font-bold text-white">BT</span>
                  </div>
                  <span className="text-lg font-bold text-gradient-primary">Bruce Truong</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Site Reliability Engineer • Building scalable systems with confidence
                </p>
                <div className="flex justify-center space-x-6 mb-6">
                  <a href="mailto:careers@brucetruong.com" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                    <span className="sr-only">Email</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/in/brucentruong/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="https://github.com/DeeAhTee" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                    <span className="sr-only">GitHub</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  © 2025 Bruce Truong. All rights reserved.
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
              '@type': 'Person',
              name: 'Bruce Truong',
              jobTitle: 'Site Reliability Engineer',
              description: 'Site Reliability Engineer specializing in cloud migration, infrastructure automation, and high-availability systems.',
              url: 'https://brucetruong.com',
              sameAs: [
                'https://www.linkedin.com/in/brucentruong/',
                'https://github.com/DeeAhTee'
              ],
              worksFor: {
                '@type': 'Organization',
                name: 'Apex Fintech Solutions'
              },
              alumniOf: {
                '@type': 'Organization',
                name: 'Portland State University'
              }
            })
          }}
        />
      </body>
    </html>
  );
}
