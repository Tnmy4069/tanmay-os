import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Tanmay OS",
    short_name: "Tanmay OS",
    description: "Personal operating system for Tanmay",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0a10",
    theme_color: "#0b0a10",
    lang: "en",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Today", short_name: "Today", url: "/today" },
      { name: "Tasks", short_name: "Tasks", url: "/tasks" },
      { name: "Job Hunt", short_name: "Jobs", url: "/career/jobs" },
    ],
  };
}