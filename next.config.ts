import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de la landing: Unsplash (licencia de uso comercial gratuito).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
