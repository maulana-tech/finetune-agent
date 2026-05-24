/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg', 'drizzle-orm'],
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://43.129.54.139:3001/:path*',
      },
    ];
  },
};

export default nextConfig;
