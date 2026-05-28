import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.displayName,
    short_name: "ŞHG",
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#050914",
    theme_color: "#050914",
    orientation: "portrait",
    categories: ["education", "social", "productivity"],
    lang: "tr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Ana Akış",
        short_name: "Akış",
        description: "Okulda olup bitenleri aç.",
        url: "/",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Etkinlikler",
        short_name: "Etkinlik",
        description: "Yaklaşan etkinlikleri gör.",
        url: "/events",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Bildirimler",
        short_name: "Bildirim",
        description: "Yeni hareketleri kontrol et.",
        url: "/notifications",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
