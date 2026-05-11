import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Дохил шавед",
  description:
    "Ба системаи Student CRM дохил шавед. Барои мониторинги ҳузури донишҷӯён, идораи гурӯҳҳо ва ҳисоботгирӣ.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Дохил шавед | Student CRM",
    description: "Ба системаи Student CRM дохил шавед.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Дохил шавед | Student CRM",
    description: "Ба системаи Student CRM дохил шавед.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
