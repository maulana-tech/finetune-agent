module.exports = {
  apps: [
    {
      name: "web",
      script: "pnpm",
      args: "start --filter web",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "api",
      script: "node",
      args: "apps/api/dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "workers",
      script: "node",
      args: "apps/workers/dist/index.js",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
