import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

import {
  AccentPicker,
  ACCENT_INIT_SCRIPT,
} from "@/components/accent-picker";
import { INTRO } from "@/content/site";
import { PaperBackground } from "@/components/paper-background";
import { SiteRail } from "@/components/site-rail";
import { SpecBox } from "@/components/spec/spec-box";
import { SpecProvider } from "@/components/spec/spec-context";
import { SpecOverlay } from "@/components/spec/spec-overlay";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const paperMono = localFont({
  src: "./fonts/PaperMono-Variable.woff2",
  variable: "--font-paper-mono",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: INTRO.name,
  description: INTRO.lead,
};

export const viewport: Viewport = {
  themeColor: "#fbf9f3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${inter.variable} ${paperMono.variable}`}
      // The accent script writes data-accent onto <html> before React
      // hydrates, so the server markup and the live DOM legitimately differ
      // on this one attribute. Without this, React reports it as a mismatch.
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        {/* Must run before first paint — see ACCENT_INIT_SCRIPT. */}
        <script dangerouslySetInnerHTML={{ __html: ACCENT_INIT_SCRIPT }} />
        <SpecProvider>
          <PaperBackground />

          <div className="shell relative z-10 pt-32 pb-24">
            <SpecBox
              label="nav · body/16 · Inter 400"
              className="w-full shrink-0 md:sticky md:top-32 md:h-fit md:w-[var(--layout-rail)]"
            >
              <SiteRail />
            </SpecBox>
            <main className="min-w-0 flex-1">{children}</main>
          </div>

          <AccentPicker />
          <SpecOverlay />
        </SpecProvider>
      </body>
    </html>
  );
}
