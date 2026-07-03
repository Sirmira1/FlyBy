import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This repo has sibling lockfiles (mobile, backend, and a stray root one),
  // so we pin the Turbopack workspace root to this app to avoid mis-inference.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
