/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Disable browser + CDN cache for instant UI update
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
        ],
      },
    ];
  },

  // Prevent old build reuse
  generateEtags: false,

  // Disable powered by header
  poweredByHeader: false,
};

export default nextConfig;