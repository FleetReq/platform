import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export to enable API routes
  trailingSlash: true,
  images: {
    // Keep unoptimized for static assets, but enable optimization for dynamic content
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Performance optimizations
  compress: true,

  // Enable Turbopack (Next.js 16 default bundler)
  // Turbopack handles optimization automatically - no webpack config needed
  turbopack: {},

};

export default nextConfig;
