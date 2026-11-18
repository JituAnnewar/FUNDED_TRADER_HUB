import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/admin/auth";
import { SITE } from "@/lib/site";

async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

function Loading() {
  return (
    <div className="space-y-4" aria-label="Loading">
      <div className="skeleton h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="skeleton h-72" />
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const idle = Number(process.env.ADMIN_IDLE_TIMEOUT_MINUTES ?? 30) || 30;
  return (
    <AdminShell brand={SITE.brand} idleMinutes={idle}>
      <Suspense fallback={<Loading />}>
        <Gate>{children}</Gate>
      </Suspense>
    </AdminShell>
  );
}
