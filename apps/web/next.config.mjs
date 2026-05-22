/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg', 'drizzle-orm'],
  experimental: {
    fileWatcher: {
      watchOptions: {
        ignored: [
          '**/.git/**',
          '**/node_modules/**',
          '**/.next/**',
          '**/.pnpm/**',
        ],
      },
    },
  },
};

export default nextConfig;
