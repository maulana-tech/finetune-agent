'use client';

import { createContext, useContext, type ReactNode } from 'react';

const WorkspaceContext = createContext<string | null>(null);

export function WorkspaceProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={workspaceId}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceId(): string {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspaceId must be used within a WorkspaceProvider');
  }
  return ctx;
}
