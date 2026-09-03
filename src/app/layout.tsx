import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PlayerSheetProvider } from "@/features/squad/components/player-sheet/player-sheet-context";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * Two faces, both self-hosted under `public/fonts` and loaded through `next/font/local` — never
 * `next/font/google`, which fetches at build and dev time and 500s every page on a machine that
 * cannot reach fonts.gstatic.com (D-008). Latin subsets only; the variable files carry the
 * weights the app uses. The CSS variables they set are what `globals.css` puts at the front of
 * `--font-app-sans` and `--font-app-display`.
 */
const body = localFont({
  src: "../../public/fonts/instrument-sans-latin.woff2",
  variable: "--font-body",
  weight: "400 600",
  display: "swap",
});
const display = localFont({
  src: "../../public/fonts/archivo-latin.woff2",
  variable: "--font-display",
  weight: "500 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FPL Advisor",
    template: "%s · FPL Advisor",
  },
  description:
    "The week's Fantasy Premier League decisions for your team — captain, transfers, chips and lineup — with the projection behind each.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1015" },
  ],
  viewportFit: "cover",
};

/**
 * The shell is server-rendered: the header, the footer and every page inside them ship as HTML.
 * The one inline script stamps a stored theme choice on <html> before first paint, which is why
 * <html> suppresses the hydration warning for that attribute — the server cannot know the choice.
 *
 * The player rail's provider sits here rather than per page, so a player stays open across a tab
 * change on the same team and the rail is reachable from every route that renders a name.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${body.variable} ${display.variable}`}
      suppressHydrationWarning
    >
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
        <PlayerSheetProvider>
          <SiteHeader />
          <div id="main" className="flex flex-1 flex-col">
            {children}
          </div>
          <SiteFooter />
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </PlayerSheetProvider>
      </body>
    </html>
  );
}
