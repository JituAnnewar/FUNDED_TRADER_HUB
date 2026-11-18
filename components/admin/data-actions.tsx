"use client";

import { FlaskConical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm";
import { loadDemo, removeDemoData } from "@/lib/admin/site-actions";

export function DemoDataControls({ hasDemo }: { hasDemo: boolean }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      {hasDemo ? (
        <ConfirmButton
          title="Remove all demo data?"
          body="Every row marked as demo (sample firms, accounts, trades, payouts and so on) will be deleted. Your own data is not touched. This cannot be undone."
          confirmLabel="Remove demo data"
          variant="secondary"
          size="md"
          className="border-loss/40 text-loss"
          onConfirm={async () => {
            const res = await removeDemoData();
            if (!res.ok) toast.error(res.error);
            else toast.success(res.message ?? "Removed.");
            router.refresh();
          }}
        >
          <Trash2 aria-hidden="true" /> Remove all demo data
        </ConfirmButton>
      ) : (
        <ConfirmButton
          title="Load demo data?"
          body="Adds sample firms, accounts, about 150 trades, payouts and journal entries, all marked as demo. A Demo banner will show on the public site until you remove them."
          confirmLabel="Load demo data"
          variant="secondary"
          size="md"
          className=""
          onConfirm={async () => {
            const res = await loadDemo();
            if (!res.ok) toast.error(res.error);
            else toast.success(res.message ?? "Loaded.");
            router.refresh();
          }}
        >
          <FlaskConical aria-hidden="true" /> Load demo data
        </ConfirmButton>
      )}
    </div>
  );
}
