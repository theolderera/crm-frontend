import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

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
    default: "Student CRM — Системаи идораи донишҷӯён",
    template: "%s | Student CRM",
  },
  description:
    "Системаи пешрафтаи қайди ҳузур ва идораи гурӯҳҳо барои муаллимон ва менторон. Нигоҳ доштани рекорди ҳузур, идораи гурӯҳҳо ва талабагон бо осонӣ.",
  keywords: [
    "CRM", "студент", "донишҷӯ", "ҳузур", "қайди ҳузур",
    "гурӯҳ", "ментор", "системаи идоракунӣ", "student management",
    "attendance tracking", "CRM Тоҷикистон",
  ],
  authors: [{ name: "Student CRM Team" }],
  creator: "Student CRM",
  publisher: "Student CRM",
  applicationName: "Student CRM",
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
    siteName: "Student CRM",
    title: "Student CRM — Системаи идораи донишҷӯён",
    description:
      "Системаи пешрафтаи қайди ҳузур ва идораи гурӯҳҳо барои муаллимон ва менторон.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Student CRM — Системаи идораи донишҷӯён",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student CRM — Системаи идораи донишҷӯён",
    description:
      "Системаи пешрафтаи қайди ҳузур ва идораи гурӯҳҳо барои муаллимон ва менторон.",
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
  name: "Student CRM",
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
    name: "Student CRM",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tg" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
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
        </ThemeProvider>
      </body>
    </html>
  );
}
