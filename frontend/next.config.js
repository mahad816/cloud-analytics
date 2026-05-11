/** @type {import('next').NextConfig} */
// In Docker, set INTERNAL_API_URL=http://backend:8000 at build time. Local dev: default targets host backend.
const internalApi =
  process.env.INTERNAL_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${internalApi}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
