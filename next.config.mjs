import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://api.fontshare.com; font-src 'self' https://cdn.fontshare.com https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev; connect-src 'self' https://api.elevarescribe.com https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev https://*.ingest.sentry.io; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
