import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { Navigation } from "./components/navigation";

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
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
      >
        <ThemeProvider defaultTheme="system" storageKey="resume-theme">
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
