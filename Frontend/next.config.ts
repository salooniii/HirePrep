import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.5"],
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.1.5:3000"],
    },
  },
};

export default nextConfig;