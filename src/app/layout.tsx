import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPL Manager",
  description:
    "Data-driven Fantasy Premier League manager: projections, transfers and captaincy with the reasoning behind each call.",
};

/**
 * No `next/font/google` here on purpose. Next fetches Google Fonts at build and dev time, and a
 * machine that cannot reach fonts.gstatic.com gets a 500 on every page — the app becomes
 * unbuildable offline. The font stack is defined in globals.css. See decisions.md D-008; if a
 * custom face is wanted later, self-host it in `public/` rather than reintroducing the fetch.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
