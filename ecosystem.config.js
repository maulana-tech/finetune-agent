/**
 * PM2 ecosystem for SumoPod (single container).
 *
 * Note: `apps/web` is deployed separately on Vercel and is intentionally
 * NOT included here. SumoPod only serves the NestJS API (port 3001) and
 * the BullMQ worker (no port, consumes from Upstash Redis).
 */
module.exports = {
  apps: [
    {
      name: "api",
      script: "apps/api/dist/main.js",
      interpreter: "tsx",
      node_args: "-r dotenv/config",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        DOTENV_CONFIG_PATH: "/home/ubuntu/app/.env"
      }
    },
    {
      name: "workers",
      script: "apps/workers/dist/index.js",
      interpreter: "tsx",
      node_args: "-r dotenv/config",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: "/home/ubuntu/app/.env"
      }
    }
  ]
};
