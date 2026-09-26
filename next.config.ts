import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [],
  },
  // Suppress specific warnings that don't affect functionality
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
