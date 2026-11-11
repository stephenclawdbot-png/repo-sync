import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Send the page <title> with the first bytes on every page (no streamed metadata),
  // so screen readers always announce it on load.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
