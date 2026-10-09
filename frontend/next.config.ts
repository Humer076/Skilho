import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: process.cwd().replace(/[\\/]frontend$/, ''),
};

export default nextConfig;
