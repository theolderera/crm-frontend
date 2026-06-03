import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Дохил шавед",
  description:
    "Ба системаи Hozir CRM дохил шавед. Барои мониторинги ҳузури донишҷӯён, идораи гурӯҳҳо ва ҳисоботгирӣ.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Дохил шавед | Hozir CRM",
    description: "Ба системаи Hozir CRM дохил шавед.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Дохил шавед | Hozir CRM",
    description: "Ба системаи Hozir CRM дохил шавед.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
