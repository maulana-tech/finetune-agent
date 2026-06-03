'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Quietly refreshes the page every 4 seconds while active jobs exist.
// Unmounts (and stops) once the server renders no active jobs.
export function ScrapePageRefresher() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
