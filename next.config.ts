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

  // Optimize webpack for bundle size
  webpack: (config, { dev, isServer }) => {
    // Optimize production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },

};

export default nextConfig;
