import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Syncthing writes ~syncthing~*.tmp into .next; Turbopack persistence
  // treats every filename as a number and crashes with "invalid digit".
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
