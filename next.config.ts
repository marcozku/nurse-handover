import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["ndhnursehandover.up.railway.app"],
    },
  },
};

export default nextConfig;
