import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FPL Advisor",
    template: "%s · FPL Advisor",
  },
  description:
    "Data-driven Fantasy Premier League manager: projections, transfers and captaincy with the reasoning behind each call.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1015" },
  ],
  viewportFit: "cover",
};

/**
 * No `next/font/google` here on purpose. Next fetches Google Fonts at build and dev time, and a
 * machine that cannot reach fonts.gstatic.com gets a 500 on every page — the app becomes
 * unbuildable offline. The font stack is defined in globals.css. See decisions.md D-008; if a
 * custom face is wanted later, self-host it in `public/` rather than reintroducing the fetch.
 *
 * The shell is server-rendered: the header, the footer and every page inside them ship as HTML.
 * The one inline script stamps a stored theme choice on <html> before first paint, which is why
 * <html> suppresses the hydration warning for that attribute — the server cannot know the choice.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="canvas-glow pb-nav flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-accent-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
