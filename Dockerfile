FROM node:22-slim AS base

# Install system dependencies for Node, Python, and Playwright
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    curl wget gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm pm2

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps

# Install node dependencies
RUN pnpm install

# Setup Python virtual environment and dependencies for workers
RUN cd apps/workers && \
    python3 -m venv .venv && \
    .venv/bin/pip install -r requirements.txt

# Install Playwright browsers (if needed by scrapling/playwright inside python)
# RUN npx playwright install --with-deps chromium

# Build all applications via Turborepo
RUN pnpm build

# Copy ecosystem config
COPY ecosystem.config.js ./

# Expose Web and API ports
EXPOSE 3000 3001

# Start all processes using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
