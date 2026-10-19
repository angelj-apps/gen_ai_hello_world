import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR when opening the app via http://127.0.0.1:3000
  // (Next treats that as cross-origin from localhost).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
