import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "picsum.photos" },
      { hostname: "*.amazonaws.com" },
      { hostname: "loremflickr.com" },
    ],
  },
};

export default nextConfig;
