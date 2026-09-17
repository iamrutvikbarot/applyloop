import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  turbopack: {},
  webpack: (config, { isServer }) => {
    // pdfjs-dist references the 'canvas' module which only exists in Node.js
    // Externalize it on the server to prevent build errors
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("canvas");
    }
    return config;
  },
};

export default nextConfig;

