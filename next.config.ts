import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sits bottom-left, exactly where the spec readout goes.
  devIndicators: false,
  // This project lives under ~/Desktop, which has its own stray package-lock.
  // Pin the root so Turbopack stops walking up and warning about it.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
