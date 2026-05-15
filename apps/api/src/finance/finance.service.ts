import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import Papa from 'papaparse';
import {
  db,
  transactions,
  simulations,
  agentLogs,
  type NewTransaction,
  type SimulationScenarioParams,
} from '@repo/db';
import { JobsService } from '../jobs/jobs.service';

export interface CreateTransactionDto {
  workspaceId: string;
  type: 'income' | 'expense' | 'invoice';
  category: string;
  description?: string;
  amount: number;
  currency?: string;
  txDate: string; // yyyy-mm-dd
  notes?: string;
}

export interface CreateSimulationDto {
  workspaceId: string;
  title: string;
  scenarioParams: SimulationScenarioParams;
  forecastMonths: 1 | 2 | 3 | 6;
  dataSeedMonths?: number; // default 6
}

@Injectable()
export class FinanceService {
  constructor(private readonly jobsService: JobsService) {}

  // ============ Transactions ============

  async createTransaction(dto: CreateTransactionDto) {
    const value: NewTransaction = {
      workspaceId: dto.workspaceId,
      type: dto.type,
      category: dto.category,
      description: dto.description ?? null,
      amount: dto.amount.toString(),
      currency: dto.currency ?? 'IDR',
      txDate: dto.txDate,
      notes: dto.notes ?? null,
    };
    const [row] = await db.insert(transactions).values(value).returning();
    return row;
  }

  async listTransactions(workspaceId: string) {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.workspaceId, workspaceId))
      .orderBy(desc(transactions.txDate), desc(transactions.createdAt));
  }

  async deleteTransaction(id: string, workspaceId: string) {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.workspaceId, workspaceId)))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return { deleted: true };
  }

  /**
   * Bulk import transactions from a CSV string.
   *
   * Accepts a flexible CSV header schema — columns are matched case-insensitively
   * and several common aliases are supported (e.g. `date` / `tx_date` / `transaction_date`).
   *
   * Required columns: date, type, category, amount.
   * Optional columns: description, notes, currency.
   *
   * Returns a summary so the UI can surface partial-import results to the user.
   */
  async importTransactionsFromCsv(workspaceId: string, csvText: string) {
    if (!csvText || !csvText.trim()) {
      throw new BadRequestException('Empty CSV');
    }

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      throw new BadRequestException(
        `CSV parse failed: ${parsed.errors.map((e) => e.message).join('; ')}`,
      );
    }

    const validRows: NewTransaction[] = [];
    const errors: { row: number; reason: string }[] = [];

    parsed.data.forEach((raw, i) => {
      const rowNum = i + 2; // header is row 1
      try {
        validRows.push(coerceCsvRow(raw, workspaceId));
      } catch (err) {
        errors.push({
          row: rowNum,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    });

    let imported = 0;
    if (validRows.length > 0) {
      // Bulk insert in chunks to avoid hitting parameter limits on very large CSVs.
      const CHUNK = 500;
      for (let i = 0; i < validRows.length; i += CHUNK) {
        const chunk = validRows.slice(i, i + CHUNK);
        await db.insert(transactions).values(chunk);
        imported += chunk.length;
      }
    }

    return {
      imported,
      skipped: errors.length,
      totalRows: parsed.data.length,
      errors: errors.slice(0, 50), // cap to avoid bloating response
    };
  }

  // ============ Simulations ============

  /**
   * Creates a 'pending' simulation row, then enqueues a worker job. Worker
   * will flip the row to 'running' → 'completed' / 'failed' as it executes
   * the multi-agent pipeline.
   */
  async createSimulation(dto: CreateSimulationDto) {
    const [row] = await db
      .insert(simulations)
      .values({
        workspaceId: dto.workspaceId,
        title: dto.title,
        executionId: crypto.randomUUID(),
        scenarioParams: dto.scenarioParams,
        forecastMonths: dto.forecastMonths,
        dataSeedMonths: dto.dataSeedMonths ?? 6,
        status: 'pending',
      })
      .returning();

    const { jobId } = await this.jobsService.queueFinanceSimulation({
      simulationId: row.id,
      workspaceId: row.workspaceId,
    });

    return { simulation: row, jobId };
  }

  async listSimulations(workspaceId: string) {
    return db
      .select()
      .from(simulations)
      .where(eq(simulations.workspaceId, workspaceId))
      .orderBy(desc(simulations.createdAt));
  }

  async getSimulation(id: string, workspaceId: string) {
    const [sim] = await db
      .select()
      .from(simulations)
      .where(and(eq(simulations.id, id), eq(simulations.workspaceId, workspaceId)))
      .limit(1);

    if (!sim) {
      throw new NotFoundException(`Simulation ${id} not found`);
    }

    // Include per-agent reasoning trace for transparency
    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.simulationId, id))
      .orderBy(agentLogs.stepNumber, agentLogs.createdAt);

    return { simulation: sim, agentLogs: logs };
  }
}

/* =============================================================
   CSV helpers
   ============================================================= */

const COLUMN_ALIASES: Record<keyof Pick<NewTransaction, 'type' | 'category' | 'description' | 'notes' | 'currency'>
  | 'date' | 'amount', string[]> = {
  date: ['date', 'tx_date', 'transaction_date', 'tanggal'],
  type: ['type', 'jenis'],
  category: ['category', 'kategori'],
  amount: ['amount', 'jumlah', 'nilai', 'total'],
  description: ['description', 'desc', 'deskripsi', 'keterangan'],
  notes: ['notes', 'note', 'catatan'],
  currency: ['currency', 'curr', 'mata_uang'],
};

function pick(row: Record<string, string>, aliases: string[]): string | undefined {
  for (const a of aliases) {
    const v = row[a];
    if (v !== undefined && v !== null && v.toString().trim() !== '') {
      return v.toString().trim();
    }
  }
  return undefined;
}

function coerceCsvRow(raw: Record<string, string>, workspaceId: string): NewTransaction {
  const dateRaw = pick(raw, COLUMN_ALIASES.date);
  const typeRaw = pick(raw, COLUMN_ALIASES.type);
  const categoryRaw = pick(raw, COLUMN_ALIASES.category);
  const amountRaw = pick(raw, COLUMN_ALIASES.amount);

  if (!dateRaw) throw new Error('missing date column');
  if (!typeRaw) throw new Error('missing type column');
  if (!categoryRaw) throw new Error('missing category column');
  if (!amountRaw) throw new Error('missing amount column');

  const type = typeRaw.toLowerCase();
  if (type !== 'income' && type !== 'expense' && type !== 'invoice') {
    throw new Error(`invalid type "${typeRaw}" — must be income | expense | invoice`);
  }

  // Accept Indonesian (1.234.567,89) and US (1,234,567.89) number formats — strip thousands
  // separators by removing all chars that aren't digit, dot, comma, or minus, then normalising.
  const cleaned = amountRaw.replace(/[^0-9.,\-]/g, '');
  const normalised = cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
    ? cleaned.replace(/\./g, '').replace(',', '.') // Indonesian → US
    : cleaned.replace(/,/g, ''); // US → strip thousands commas
  const num = Number(normalised);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`invalid amount "${amountRaw}"`);
  }

  // Date — accept yyyy-mm-dd, dd/mm/yyyy, dd-mm-yyyy
  const isoDate = normaliseDate(dateRaw);
  if (!isoDate) {
    throw new Error(`invalid date "${dateRaw}" — expected yyyy-mm-dd or dd/mm/yyyy`);
  }

  return {
    workspaceId,
    type,
    category: categoryRaw,
    description: pick(raw, COLUMN_ALIASES.description) ?? null,
    amount: num.toString(),
    currency: pick(raw, COLUMN_ALIASES.currency) ?? 'IDR',
    txDate: isoDate,
    notes: pick(raw, COLUMN_ALIASES.notes) ?? null,
  };
}

function normaliseDate(s: string): string | null {
  const trimmed = s.trim();
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // dd/mm/yyyy or dd-mm-yyyy
  const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}
