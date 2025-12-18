import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local API uploads (dev)
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/Uploads/**",
      },

      // Production API uploads (https, any domain)
      // If you want to lock it down later, replace hostname with your API domain.
      {
        protocol: "https",
        hostname: "**",
        pathname: "/Uploads/**",
      },
    ],
  },
};

export default nextConfig;
