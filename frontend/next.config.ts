import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * ============================================================
   * NEXT IMAGE CONFIGURATION
   * ============================================================
   */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  /*
   * ============================================================
   * VERCEL / PRODUCTION BUILD
   * ============================================================
   *
   * Allows the production build to continue even when
   * TypeScript or ESLint reports errors.
   *
   * NOTE:
   * These settings do NOT disable TypeScript/ESLint in your
   * editor or during development. They only prevent them from
   * blocking `next build`.
   */

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;