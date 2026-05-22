import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['192.168.56.1','172.20.10.4','wasting-dismantle-slept.ngrok-free.dev',],
};

export default nextConfig;