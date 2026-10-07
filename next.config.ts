import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./lib/marketing-skills/*.md"],
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
