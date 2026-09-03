import type { NextConfig } from "next";

/**
 * The routes the app shipped under before plan 032 (`/squad/…`) redirect to the board (`/team/…`),
 * so a remembered link or a bookmark still lands somewhere. Permanent: the old shape is gone.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/squad/recommended", destination: "/team/recommended", permanent: true },
      { source: "/squad/build", destination: "/build", permanent: true },
      { source: "/squad/:managerId(\\d+)", destination: "/team/:managerId", permanent: true },
    ];
  },
};

export default nextConfig;
