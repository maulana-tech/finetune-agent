export const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}
