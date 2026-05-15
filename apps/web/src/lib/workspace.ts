/**
 * Dummy workspace used while auth/multi-tenant context is not yet wired.
 * Matches the value used in Topbar.tsx so every feature reads from the
 * same workspace in local dev. Replace once auth lands.
 */
export const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Resolves the API base URL. Defaults to local NestJS dev server on 3001
 * — same fallback as Topbar.tsx.
 */
export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}
