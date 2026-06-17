import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**': ['./Hybrid-Intelligence-Ontology/**/*.ttl'],
  },
};

export default nextConfig;
