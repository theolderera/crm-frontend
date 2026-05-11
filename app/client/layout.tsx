import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM — Идораи гурӯҳҳо",
  description: "Системаи қайди ҳузур ва идораи гурӯҳҳо ва талабагон.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
