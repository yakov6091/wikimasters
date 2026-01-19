import type { NextConfig } from "next";
import { dirname } from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL(`${process.env.BLOB_BASE_URL}/**`)]
  },
  turbopack: {
    root: dirname(__filename),
  }
};

export default nextConfig;
