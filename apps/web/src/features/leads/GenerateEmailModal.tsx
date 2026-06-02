'use client';

import { useState } from 'react';
import { X, Loader2, Copy, Check, RefreshCw, Send } from 'lucide-react';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';

export function GenerateEmailButton({
  leadId,
  leadEmail,
  onGenerated,
}: {
  leadId: string;
  leadEmail?: string | null;
  onGenerated: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors"
      >
        Generate Outreach Draft
      </button>
      {open && <GenerateEmailModal leadId={leadId} leadEmail={leadEmail} onClose={() => setOpen(false)} onGenerated={onGenerated} />}
    </>
  );
}

function GenerateEmailModal({
  leadId,
  leadEmail,
  onClose,
  onGenerated,
}: {
  leadId: string;
  leadEmail?: string | null;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const workspaceId = useWorkspaceId();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl()}/leads/${leadId}/email?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmail(data);
      onGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!email) return;
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    if (!email || !leadEmail) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl()}/leads/${leadId}/send-email?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: leadEmail,
          subject: email.subject,
          body: email.body,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(errorData.message || 'Failed to send email');
      }
      setSent(true);
      onGenerated();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] max-h-[90vh] overflow-auto bg-background border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-bold tracking-tight">Cold Email Draft</div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {!email && !loading && (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground mb-4">
                Generate a personalized cold email for this lead based on their profile and your business context.
              </p>
              <button
                onClick={generate}
                className="px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Generate Email
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs text-muted-foreground">Generating email...</span>
            </div>
          )}

          {error && (
            <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs">{error}</div>
          )}

          {email && (
            <>
              {leadEmail && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">To</label>
                  <div className="px-3 py-2 border border-border bg-accent/20 text-xs font-medium">{leadEmail}</div>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Subject</label>
                <div className="px-3 py-2 border border-border bg-accent/20 text-xs font-medium">{email.subject}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Body</label>
                <div className="px-3 py-2 border border-border bg-accent/20 text-xs whitespace-pre-wrap min-h-[120px]">{email.body}</div>
              </div>
              {sent && (
                <div className="p-3 border border-green-200 bg-green-50 text-green-700 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Email sent successfully!
                </div>
              )}
              <div className="flex gap-2">
                {leadEmail && (
                  <button
                    onClick={sendEmail}
                    disabled={sending || sent}
                    className="flex-1 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sending...
                      </>
                    ) : sent ? (
                      <>
                        <Check className="w-3 h-3" />
                        Sent
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Send Email
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-2 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={generate}
                  disabled={loading}
                  className="flex-1 py-2 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
