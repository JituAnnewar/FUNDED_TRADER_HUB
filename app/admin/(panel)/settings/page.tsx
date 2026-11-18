import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/header";
import { MfaSetup, SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin/auth";
import { DEFAULT_SETTINGS } from "@/lib/data/public";
import type { SiteSettings } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("site_settings").select("*").eq("singleton", true).maybeSingle();
  const settings = { ...DEFAULT_SETTINGS, ...((data ?? {}) as Partial<SiteSettings>) } as SiteSettings;
  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeader title="Site settings" description="Changes show on the public site within seconds." />
      <SettingsForm settings={settings} />
      <MfaSetup />
    </div>
  );
}
