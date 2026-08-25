import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Syncthing writes ~syncthing~*.tmp into .next; Turbopack persistence
  // treats every filename as a number and crashes with "invalid digit".
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
