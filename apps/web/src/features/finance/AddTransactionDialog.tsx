'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { DEV_WORKSPACE_ID, apiUrl } from '@/lib/workspace';

type TxType = 'income' | 'expense' | 'invoice';

const INCOME_CATEGORIES = ['Sales Revenue', 'Service Fee', 'Other Income'];
const EXPENSE_CATEGORIES = [
  'Raw Materials',
  'Payroll',
  'Rent',
  'Utilities',
  'Marketing',
  'Tax',
  'Other Expense',
];
const INVOICE_CATEGORIES = ['Customer Invoice', 'Pending Receivable'];

function categoriesFor(type: TxType): string[] {
  if (type === 'income') return INCOME_CATEGORIES;
  if (type === 'expense') return EXPENSE_CATEGORIES;
  return INVOICE_CATEGORIES;
}

export function AddTransactionButton({
  variant = 'primary',
}: {
  variant?: 'primary' | 'link-only';
}) {
  const [open, setOpen] = useState(false);

  if (variant === 'link-only') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Add Transaction →
        </button>
        {open && <AddTransactionDialog onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Transaction
      </button>
      {open && <AddTransactionDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function AddTransactionDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TxType>('income');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const onTypeChange = (next: TxType) => {
    setType(next);
    setCategory(categoriesFor(next)[0]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl()}/finance/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: DEV_WORKSPACE_ID,
            type,
            category,
            description: description || undefined,
            amount: amt,
            currency: 'IDR',
            txDate,
            notes: notes || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  };

  return (
    <Modal onClose={onClose} title="Add Transaction">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {(['income', 'expense', 'invoice'] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => onTypeChange(t)}
              className={`h-10 border border-border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
          >
            {categoriesFor(type).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-[1fr_140px] gap-2">
          <Field label="Amount (IDR)">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
              required
              className="w-full h-10 border border-border bg-background px-3 text-sm font-mono focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              required
              className="w-full h-10 border border-border bg-background px-3 text-sm font-mono focus:outline-none focus:border-primary"
            />
          </Field>
        </div>

        <Field label="Description">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="optional"
            className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="optional"
            rows={2}
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </Field>

        {error && (
          <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save Transaction
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================
   Shared field + modal primitives
   ============================================================ */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Modal({
  onClose,
  title,
  children,
  size = 'md',
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg';
}) {
  const widthCls = size === 'lg' ? 'max-w-[640px]' : 'max-w-[480px]';
  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthCls} max-h-[90vh] overflow-auto bg-background border border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-bold tracking-tight">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
