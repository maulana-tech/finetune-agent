import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { db, scrapeSchedules, type NewScrapeSchedule } from '@repo/db';
import { JobsService } from '../jobs/jobs.service';

export interface CreateScheduleDto {
  workspaceId: string;
  category: string;
  query: string;
  limitPerRun?: number;
  intervalMinutes?: number;
}

export interface UpdateScheduleDto {
  category?: string;
  query?: string;
  limitPerRun?: number;
  intervalMinutes?: number;
  isActive?: boolean;
}

@Injectable()
export class ScrapeSchedulesService {
  constructor(private readonly jobsService: JobsService) {}

  async list(workspaceId: string) {
    return db
      .select()
      .from(scrapeSchedules)
      .where(eq(scrapeSchedules.workspaceId, workspaceId))
      .orderBy(desc(scrapeSchedules.createdAt));
  }

  async create(dto: CreateScheduleDto) {
    const value: NewScrapeSchedule = {
      workspaceId: dto.workspaceId,
      category: dto.category,
      query: dto.query,
      limitPerRun: dto.limitPerRun ?? 30,
      intervalMinutes: dto.intervalMinutes ?? 720,
      isActive: true,
    };
    const [row] = await db.insert(scrapeSchedules).values(value).returning();
    return row;
  }

  async update(id: string, workspaceId: string, dto: UpdateScheduleDto) {
    const [row] = await db
      .update(scrapeSchedules)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(scrapeSchedules.id, id), eq(scrapeSchedules.workspaceId, workspaceId)))
      .returning();
    if (!row) throw new NotFoundException(`Schedule ${id} not found`);
    return row;
  }

  async delete(id: string, workspaceId: string) {
    const result = await db
      .delete(scrapeSchedules)
      .where(and(eq(scrapeSchedules.id, id), eq(scrapeSchedules.workspaceId, workspaceId)))
      .returning();
    if (result.length === 0) throw new NotFoundException(`Schedule ${id} not found`);
    return { deleted: true };
  }

  async runNow(id: string, workspaceId: string) {
    const [schedule] = await db
      .select()
      .from(scrapeSchedules)
      .where(and(eq(scrapeSchedules.id, id), eq(scrapeSchedules.workspaceId, workspaceId)))
      .limit(1);

    if (!schedule) throw new NotFoundException(`Schedule ${id} not found`);

    const { jobId } = await this.jobsService.queueScrape({
      workspaceId,
      query: schedule.query,
      limit: schedule.limitPerRun,
      scheduleId: schedule.id,
    });

    return { queued: true, jobId };
  }
}
