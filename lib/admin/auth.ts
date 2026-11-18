import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/clients";

export interface AdminContext {
  sb: SupabaseClient;
  user: User;
}

/**
 * Returns the signed-in admin or redirects. Checks, in order:
 * Supabase configured → signed in → MFA satisfied (when the user has a TOTP factor) → listed in `admins`.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const sb = await sessionClient();
  if (!sb) redirect("/admin/login?reason=setup");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/admin/login?step=mfa");

  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) redirect("/admin/login?reason=forbidden");
  return { sb, user };
}

/** Same checks for Server Actions: throws instead of redirecting. */
export async function adminAction(): Promise<AdminContext> {
  const sb = await sessionClient();
  if (!sb) throw new Error("Supabase is not configured.");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Your session has ended. Please sign in again.");
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") throw new Error("Two-factor verification required.");
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) throw new Error("This account is not an admin.");
  return { sb, user };
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fail(e: unknown): { ok: false; error: string } {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}
