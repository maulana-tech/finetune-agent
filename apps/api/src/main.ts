import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Builds the CORS allow-list:
 * - Always allows localhost ports used in dev (web=3000, api=3001, alt=3002)
 * - Adds every comma-separated entry from ALLOWED_ORIGINS env var
 * - In dev, also accepts any *.vercel.app preview when ALLOW_VERCEL_PREVIEWS=true
 *
 * Example:
 *   ALLOWED_ORIGINS=https://my-app.vercel.app,https://my-app-staging.vercel.app
 */
function buildCorsOrigin() {
  const defaults = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];
  const fromEnv = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedList = [...defaults, ...fromEnv];
  const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Same-origin / curl / server-to-server requests have no Origin header — allow.
    if (!origin) return callback(null, true);
    if (allowedList.includes(origin)) return callback(null, true);
    if (allowVercelPreviews && /^https:\/\/.+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin not allowed: ${origin}`), false);
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: buildCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
