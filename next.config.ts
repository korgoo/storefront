import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/**
 * Allow product/asset images served by the configured Spree backend. Spree
 * returns Active Storage URLs on its own host (which may differ from
 * SPREE_API_URL's — e.g. store URL vs API URL, http vs https, with or without a
 * port), so we allow the SPREE_API_URL hostname over both protocols and any
 * port rather than hardcoding specific hosts. Set SPREE_IMAGES_URL when images
 * are served from a different host than the API — e.g. spree.sh puts images
 * behind a CDN (console.spree.sh) — and it takes precedence over SPREE_API_URL.
 * The pathname stays scoped to Active Storage. Falls back to `localhost` when
 * neither variable is set (dev).
 */
function spreeImagePatterns(): RemotePattern[] {
  const raw = (
    process.env.SPREE_IMAGES_URL || process.env.SPREE_API_URL
  )?.trim();
  let hostname = "localhost";
  if (raw) {
    try {
      hostname = new URL(raw).hostname;
    } catch {
      // Malformed URL — keep the localhost fallback.
    }
  }
  const pathname = "/rails/active_storage/**";
  return [
    { protocol: "http", hostname, pathname },
    { protocol: "https", hostname, pathname },
  ];
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Set only in local dev (frontend/vite.config.ts proxies `/store` to this
  // app on that assumption). Left unset in production so store.korgoo.kg
  // serves from `/` — the nginx vhost's `/_next/static/` location block is
  // written for that, and changing it would break asset URLs.
  basePath: process.env.NEXT_BASE_PATH || undefined,
  allowedDevOrigins: ["shop.lvh.me", "*.trycloudflare.com", "192.168.33.13"],
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN || "",
  },
  transpilePackages: ["@spree/sdk"],
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
    ],
  },
  turbopack: {
    root: __dirname,
  },
  // `src/proxy.ts` normally redirects the bare site root to
  // `/{country}/{locale}` (see HAS_COUNTRY_LOCALE there) — but with `basePath`
  // set, that redirect doesn't fire for the exact basePath root: any path
  // with a segment after it (`/store/x`) still redirects correctly, only the
  // literal `/store` 404s. Cover that one case with a static redirect here,
  // gated on NEXT_BASE_PATH so production — which never sets it, and where
  // the proxy already handles "/" fine — is unaffected.
  ...(process.env.NEXT_BASE_PATH
    ? {
        async redirects() {
          const country = (
            process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us"
          ).toLowerCase();
          const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";
          return [
            {
              source: "/",
              destination: `/${country}/${locale}`,
              permanent: false,
            },
          ];
        },
      }
    : {}),
  cacheComponents: true,
  cacheLife: {
    tenMinutes: {
      stale: 300, // 5 minutes client stale window
      revalidate: 600, // 10 minutes until background revalidation
      expire: 3600, // 1 hour max before recompute on idle entries
    },
  },
  images: {
    qualities: [25, 50, 75, 85, 100],
    dangerouslyAllowLocalIP: true, // Allow localhost images in development
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Derived from SPREE_IMAGES_URL (if set) or SPREE_API_URL.
      ...spreeImagePatterns(),
      // Hosted demo / tunnel backends whose image host differs from SPREE_API_URL.
    ],
  },
};

const configWithIntl = withNextIntl(nextConfig);

export default process.env.SENTRY_DSN
  ? withSentryConfig(configWithIntl, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Automatically delete source maps after uploading to Sentry
      // so they are not served publicly
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },

      // Disables the Sentry SDK build-time telemetry
      telemetry: false,
    })
  : configWithIntl;
