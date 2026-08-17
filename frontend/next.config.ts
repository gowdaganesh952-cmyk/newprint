import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,
};

export default nextConfig;