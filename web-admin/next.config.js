/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // API proxy ke backend
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/:path*`,
      },
    ];
  },

  // Keamanan header
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              "connect-src 'self' http://localhost:* http://127.0.0.1:* https:",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Optimasi gambar dari MinIO
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: process.env.MINIO_ENDPOINT ?? 'localhost',
        port: process.env.MINIO_PORT ?? '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.buruansae.bandung.go.id',
        pathname: '/**',
      },
    ],
  },

  // Variabel lingkungan publik
  env: {
    NEXT_PUBLIC_APP_NAME: 'Buruan Sae 2.0 Admin',
    NEXT_PUBLIC_APP_VERSION: '2.0.0',
  },

  // Output standalone untuk Docker
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};

module.exports = nextConfig;
