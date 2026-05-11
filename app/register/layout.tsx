import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Қайд шавед",
  description:
    "Дар системаи Student CRM ҳисоби нав созед ва ба мониторинги ҳузури донишҷӯён дастрасӣ пайдо кунед.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Қайд шавед | Student CRM",
    description: "Дар системаи Student CRM ҳисоби нав созед.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Қайд шавед | Student CRM",
    description: "Дар системаи Student CRM ҳисоби нав созед.",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
