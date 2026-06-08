import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";
import Script from "next/script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hozir CRM — Системаи идораи донишҷӯён ва давомот",
    template: "%s | Hozir CRM",
  },
  description:
    "Системаи пешрафтаи қайди ҳузур ва идораи гурӯҳҳо барои муаллимон ва менторон. Нигоҳ доштани рекорди ҳузур, идораи гурӯҳҳо ва талабагон бо осонӣ.",
  keywords: [
    "CRM", "студент", "донишҷӯ", "ҳузур", "қайди ҳузур",
    "гурӯҳ", "ментор", "системаи идоракунӣ", "student management",
    "attendance tracking", "CRM Тоҷикистон",
  ],
  authors: [{ name: "Hozir Team" }],
  creator: "Hozir CRM",
  publisher: "Hozir CRM",
  applicationName: "Hozir CRM",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "tg_TJ",
    url: siteUrl,
    siteName: "Hozir CRM",
    title: "Hozir CRM — Системаи идораи донишҷӯён ва давомот",
    description:
      "Дар системаи Hozir CRM гурӯҳҳо, давомот ва рейтингҳоро осон назорат кунед.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Hozir CRM — Системаи идораи донишҷӯён ва давомот",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hozir CRM — Системаи идораи донишҷӯён ва давомот",
    description:
      "Дар системаи Hozir CRM гурӯҳҳо ва давомотро осон назорат кунед.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "education",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Hozir CRM",
  description:
    "Системаи пешрафтаи қайди ҳузур ва идораи гурӯҳҳо барои муаллимон ва менторон",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  inLanguage: "tg",
  isAccessibleForFree: true,
  browserRequirements: "JavaScript",
  author: {
    "@type": "Organization",
    name: "Hozir Team",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tg" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "500",
                  },
                }}
              />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
