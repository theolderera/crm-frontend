import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Student CRM — Системаи идораи донишҷӯён",
    short_name: "Student CRM",
    description: "Системаи қайди ҳузур ва идораи гурӯҳҳо",
    start_url: "/login",
    display: "standalone",
    background_color: "#f8f9fc",
    theme_color: "#4f46e5",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["education", "business", "productivity"],
    lang: "tg",
    dir: "ltr",
  };
}
