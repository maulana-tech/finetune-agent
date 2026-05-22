import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, workspaces } from '@repo/db';

@Injectable()
export class WorkspacesService {
  async update(id: string, dto: { businessContext?: string }) {
    const [workspace] = await db
      .update(workspaces)
      .set({ businessContext: dto.businessContext, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }
}
