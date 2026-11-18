import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { GlassPanel } from "@/components/ui/glass-panel";
import { SITE } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label="Back to site">
        <Logo brand={SITE.brand} />
      </Link>
      <GlassPanel className="flex w-full max-w-md justify-center p-6 sm:p-8">
        <Suspense fallback={<div className="skeleton h-64 w-full max-w-sm" />}>
          <LoginForm />
        </Suspense>
      </GlassPanel>
      <p className="max-w-sm text-center text-xs text-muted">Public sign-up is disabled. The admin account is created in Supabase (see SETUP.md).</p>
    </div>
  );
}
