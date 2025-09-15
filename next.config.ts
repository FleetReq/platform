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
  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    bundleAnalyzer: {
      enabled: true,
      openAnalyzer: true,
    }
  }),
};

// Bundle analyzer wrapper
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({
      enabled: true,
    })
  : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
