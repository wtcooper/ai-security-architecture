import type { NextConfig } from "next";

/**
 * The app is fully static — no database, no runtime data fetching — so it exports to plain
 * files and is served from GitHub Pages.
 *
 * A project page lives under /<repo>, so the build needs a base path. It is supplied by the
 * deploy workflow and left empty locally, where the site is served from the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // Emit directories with index.html, which is what GitHub Pages serves for a bare path.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
