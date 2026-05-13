import type { NextConfig } from "next";

// When BUILD_TARGET=static the app builds as a fully static export
// (out/) suitable for S3 + CloudFront. In that mode mock /api/* routes
// are removed by scripts/build-static.sh before the build runs.
const isStatic = process.env.BUILD_TARGET === "static";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : undefined,
  // Static export does not support next/image optimization
  images: {
    unoptimized: true,
    remotePatterns: [
      { hostname: "picsum.photos" },
      { hostname: "*.amazonaws.com" },
      { hostname: "loremflickr.com" },
    ],
  },
  trailingSlash: isStatic,
};

export default nextConfig;
