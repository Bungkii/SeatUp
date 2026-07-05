import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
    emotion: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
