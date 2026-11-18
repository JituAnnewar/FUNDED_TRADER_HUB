import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { LOADER_SCRIPT } from "@/components/motion/loader";
import { SITE } from "@/lib/site";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.brand} | Funded prop firm trader`,
    template: `%s | ${SITE.brand}`,
  },
  description: SITE.description,
  applicationName: SITE.brand,
  openGraph: {
    type: "website",
    siteName: SITE.brand,
    title: `${SITE.brand} | Funded prop firm trader`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#05070A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Marks repeat visits before first paint so the loader is skipped. */}
        <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />
      </head>
      <body className="bg-terminal">{children}</body>
    </html>
  );
}
