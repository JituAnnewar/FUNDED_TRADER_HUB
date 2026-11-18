import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/header";
import { MessageList } from "@/components/admin/messages";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { param, type SearchParams } from "@/lib/analytics/filter";
import { requireAdmin } from "@/lib/admin/auth";
import type { ContactMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

const TABS = [
  { key: "inbox", label: "Inbox" },
  { key: "replied", label: "Replied" },
  { key: "archived", label: "Archived" },
];
const PER = 25;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin();
  const tab = TABS.some((t) => t.key === param(sp, "tab")) ? param(sp, "tab")! : "inbox";
  const page = Math.max(1, Number(param(sp, "page") ?? 1) || 1);
  let q = sb
    .from("contact_messages")
    .select("id,created_at,updated_at,is_demo,name,email,category,subject,message,status", { count: "exact" });
  q = tab === "inbox" ? q.in("status", ["new", "read"]) : q.eq("status", tab);
  const { data, count } = await q.order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  const messages = (data ?? []) as Omit<ContactMessage, "ip_hash" | "user_agent">[];

  return (
    <>
      <AdminHeader title="Messages" description="Messages sent through the contact form." />
      <div className="border-line mb-4 inline-flex gap-1 rounded-xl border p-1" role="tablist">
        {TABS.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            href={t.key === "inbox" ? "/admin/messages" : `/admin/messages?tab=${t.key}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm",
              tab === t.key ? "bg-[image:var(--grad-button)] text-white" : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {messages.length ? (
        <MessageList messages={messages} />
      ) : (
        <EmptyState title="Nothing here" body="New messages from the contact form will appear here." />
      )}
      <Pagination
        page={page}
        pages={Math.max(1, Math.ceil((count ?? 0) / PER))}
        basePath="/admin/messages"
        params={{ tab: tab === "inbox" ? undefined : tab }}
      />
    </>
  );
}
