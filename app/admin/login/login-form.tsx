"use client";

import { Loader2, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signIn, verifyMfa } from "./actions";

const field = "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm outline-none focus-visible:border-accent";

const REASONS: Record<string, string> = {
  idle: "You were signed out after a period of inactivity.",
  forbidden: "That account does not have admin access.",
  setup: "Supabase is not connected yet. Follow SETUP.md, then come back here.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/admin") ? params.get("next")! : "/admin";
  const reason = params.get("reason");
  const [step, setStep] = useState<"password" | "mfa">(params.get("step") === "mfa" ? "mfa" : "password");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await signIn({ email: String(f.get("email") ?? ""), password: String(f.get("password") ?? "") });
      if (!res.ok) return setError(res.error);
      if (res.mfa) return setStep("mfa");
      router.replace(next);
      router.refresh();
    });
  }

  function onCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s/g, "");
    setError(null);
    start(async () => {
      const res = await verifyMfa(code);
      if (!res.ok) return setError(res.error);
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl border border-line bg-white/[0.03] text-accent">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Admin sign in</h1>
          <p className="text-xs text-muted">{step === "mfa" ? "Two-factor verification" : "Owner access only"}</p>
        </div>
      </div>
      {reason && REASONS[reason] && step === "password" && <p className="mb-4 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber">{REASONS[reason]}</p>}

      {step === "password" ? (
        <form onSubmit={onPassword} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm">Email</span>
            <input name="email" type="email" autoComplete="username" required className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm">Password</span>
            <input name="password" type="password" autoComplete="current-password" required className={field} />
          </label>
          {error && <p className="text-sm text-loss" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />} Sign in
          </Button>
        </form>
      ) : (
        <form onSubmit={onCode} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm">6-digit code from your authenticator app</span>
            <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus className={`${field} num text-center text-lg tracking-[0.4em]`} />
          </label>
          {error && <p className="text-sm text-loss" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />} Verify
          </Button>
        </form>
      )}
    </div>
  );
}
