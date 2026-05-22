'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';
import { Modal } from './AddTransactionDialog';

interface ImportResult {
  imported: number;
  skipped: number;
  totalRows: number;
  errors: { row: number; reason: string }[];
}

export function ImportTransactionsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Import CSV
      </button>
      {open && <ImportTransactionsDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function ImportTransactionsDialog({ onClose }: { onClose: () => void }) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onPickFile = (f: File | null) => {
    setError(null);
    setResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!/\.csv$/i.test(f.name) && f.type !== 'text/csv') {
      setError('File harus berekstensi .csv');
      setFile(null);
      return;
    }
    setFile(f);
  };

  const onSubmit = () => {
    if (!file) return;
    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('workspaceId', workspaceId);
        fd.append('file', file);
        const res = await fetch(`${apiUrl()}/finance/transactions/import`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        const data: ImportResult = await res.json();
        setResult(data);
        if (data.imported > 0) {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  };

  return (
    <Modal onClose={onClose} title="Import Transactions from CSV" size="lg">
      <div className="flex flex-col gap-4">
        {/* Schema hint */}
        <div className="border border-border bg-accent/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
          <div className="font-bold text-foreground mb-1 uppercase tracking-widest text-[10px]">
            Expected CSV format
          </div>
          <div className="font-mono text-[10.5px] leading-relaxed">
            <div>
              <span className="text-foreground">date,type,category,amount,description,notes</span>
            </div>
            <div>2026-03-15,income,Sales Revenue,8500000,Weekly walk-in,</div>
            <div>2026-03-18,expense,Raw Materials,3200000,Beans + milk,</div>
            <div>2026-03-22,invoice,Customer Invoice,5000000,B2B catering,</div>
          </div>
          <div className="mt-2">
            <span className="text-foreground font-bold">type</span> must be <code>income</code>, <code>expense</code>, or <code>invoice</code>.{' '}
            <span className="text-foreground font-bold">date</span> accepts <code>yyyy-mm-dd</code> or <code>dd/mm/yyyy</code>.{' '}
            <span className="text-foreground font-bold">amount</span> accepts Indonesian or US number formats. Column names are case-insensitive; common aliases (tanggal, jenis, kategori, jumlah) are accepted.
          </div>
        </div>

        {/* Dropzone */}
        {!result && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onPickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors cursor-pointer p-8 ${
              dragOver
                ? 'border-primary bg-accent'
                : file
                ? 'border-primary bg-accent/30'
                : 'border-border hover:border-foreground hover:bg-accent/20'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-sm font-bold">{file.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-sm font-bold">Drop CSV here or click to browse</div>
                <div className="text-[11px] text-muted-foreground">Max ~5 MB recommended</div>
              </>
            )}
          </label>
        )}

        {/* Result */}
        {result && (
          <div className="border border-border bg-background p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {result.skipped === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <div className="text-sm font-bold">Import sukses</div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-foreground" />
                  <div className="text-sm font-bold">Import selesai dengan peringatan</div>
                </>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <ResultStat label="Imported" value={result.imported} tone="positive" />
              <ResultStat label="Skipped" value={result.skipped} tone={result.skipped > 0 ? 'negative' : 'neutral'} />
              <ResultStat label="Total Rows" value={result.totalRows} tone="neutral" />
            </div>
            {result.errors.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Errors (first {result.errors.length})
                </div>
                <div className="max-h-[160px] overflow-auto border border-border bg-accent/10 text-[11px] font-mono">
                  {result.errors.map((e, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 border-b border-border last:border-b-0 flex gap-3"
                    >
                      <span className="text-muted-foreground shrink-0">row {e.row}</span>
                      <span className="text-destructive">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={pending || !file}
              className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'positive' | 'negative' | 'neutral';
}) {
  const valueColor =
    tone === 'positive'
      ? 'text-primary'
      : tone === 'negative'
      ? 'text-destructive'
      : 'text-foreground';
  return (
    <div className="border border-border p-3">
      <div className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}
