'use client';

import { useState, useRef } from 'react';
import { Bot, Send, Loader2, X, MessageSquare } from 'lucide-react';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-40"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const workspaceId = useWorkspaceId();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can answer questions about your CRM data. Try asking something like "show me coffee shops in Jakarta" or "how many leads have email addresses?"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch(`${apiUrl()}/assistant/chat?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[520px] bg-background border border-border shadow-xl flex flex-col z-40">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center hover:bg-accent"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-foreground text-background'
                  : 'bg-accent text-foreground border border-border'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 bg-accent border border-border text-xs flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask about your leads..."
          className="flex-1 px-2 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="w-8 h-8 bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
