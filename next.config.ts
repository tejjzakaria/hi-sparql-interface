import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**': ['./data/*.ttl'],
  },
};

export default nextConfig;
