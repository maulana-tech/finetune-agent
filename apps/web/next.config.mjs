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
          '**/dist/**',
          '**/.cache/**',
        ],
      },
    },
  },
};

export default nextConfig;
