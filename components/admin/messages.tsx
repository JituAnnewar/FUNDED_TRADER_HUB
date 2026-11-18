"use client";

import { Archive, CheckCheck, Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm";
import { Button } from "@/components/ui/button";
import { deleteMessage, setMessageStatus } from "@/lib/admin/site-actions";
import { formatDateTimeIST } from "@/lib/time";
import type { ContactMessage, MessageStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MessageList({ messages }: { messages: Omit<ContactMessage, "ip_hash" | "user_agent">[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [list, setOptimistic] = useOptimistic(messages, (s, p: { id: string; status: MessageStatus }) => s.map((m) => (m.id === p.id ? { ...m, status: p.status } : m)));

  const setStatus = (id: string, status: MessageStatus) =>
    start(async () => {
      setOptimistic({ id, status });
      const res = await setMessageStatus(id, status);
      if (!res.ok) toast.error(res.error);
      router.refresh();
    });

  return (
    <ul className="space-y-2">
      {list.map((m) => (
        <li key={m.id}>
          <details
            className="glass group overflow-hidden"
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open && m.status === "new") setStatus(m.id, "read");
            }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              <span className={cn("size-2 shrink-0 rounded-full", m.status === "new" ? "bg-accent shadow-[0_0_8px_var(--c-accent)]" : "bg-transparent")} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", m.status === "new" && "font-semibold")}>
                  {m.subject} <span className="font-normal text-muted">· {m.name}</span>
                </p>
                <p className="num text-xs text-muted">
                  {formatDateTimeIST(new Date(m.created_at))} · {m.category} · {m.status}
                </p>
              </div>
            </summary>
            <div className="border-t border-line p-4">
              <p className="mb-3 text-sm text-muted">
                From {m.name} &lt;{m.email}&gt;
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} onClick={() => setStatus(m.id, "replied")}>
                    <Mail aria-hidden="true" /> Reply by email
                  </a>
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setStatus(m.id, "replied")}>
                  <CheckCheck aria-hidden="true" /> Mark replied
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setStatus(m.id, m.status === "archived" ? "read" : "archived")}>
                  <Archive aria-hidden="true" /> {m.status === "archived" ? "Unarchive" : "Archive"}
                </Button>
                <ConfirmButton
                  title="Delete this message?"
                  body="This cannot be undone."
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    const res = await deleteMessage(m.id);
                    if (!res.ok) toast.error(res.error);
                    router.refresh();
                  }}
                >
                  <Trash2 aria-hidden="true" /> Delete
                </ConfirmButton>
              </div>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
