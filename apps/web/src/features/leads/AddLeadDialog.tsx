'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';

export function AddLeadButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-7 px-2 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-1"
      >
        <Plus className="w-3 h-3" />
        Add
      </button>
      {open && <AddLeadDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export function AddLeadDialog({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial?: {
    id?: string;
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    category?: string;
    emails?: string[];
    lat?: number;
    lng?: number;
    mapsUrl?: string;
  };
}) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editing = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [emails, setEmails] = useState(initial?.emails?.join(', ') ?? '');
  const [lat, setLat] = useState(initial?.lat?.toString() ?? '');
  const [lng, setLng] = useState(initial?.lng?.toString() ?? '');
  const [mapsUrl, setMapsUrl] = useState(initial?.mapsUrl ?? '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          name: name.trim(),
        };
        if (address.trim()) body.address = address.trim();
        if (phone.trim()) body.phone = phone.trim();
        if (website.trim()) body.website = website.trim();
        if (category.trim()) body.category = category.trim();
        if (emails.trim()) body.emails = emails.split(',').map((e) => e.trim()).filter(Boolean);
        if (lat.trim()) body.lat = parseFloat(lat);
        if (lng.trim()) body.lng = parseFloat(lng);
        if (mapsUrl.trim()) body.mapsUrl = mapsUrl.trim();

        const url = editing
          ? `${apiUrl()}/leads/${initial!.id}?workspaceId=${workspaceId}`
          : `${apiUrl()}/leads?workspaceId=${workspaceId}`;

        const res = await fetch(url, {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `HTTP ${res.status}`);
        }

        onClose();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] max-h-[90vh] overflow-auto bg-background border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-bold tracking-tight">{editing ? 'Edit Lead' : 'Add Lead'}</div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Emails (comma-separated)</label>
            <input
              type="text"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Google Maps URL</label>
            <input
              type="text"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending && <Loader2 className="w-3 h-3 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Lead'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 py-2 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
