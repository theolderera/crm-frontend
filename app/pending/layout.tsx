import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Дар интизор",
  description: "Ҳисоби шумо дар ҳолати интизор аст.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function PendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
