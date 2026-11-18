"use server";

import { z } from "zod";
import { sessionClient } from "@/lib/supabase/clients";

const loginSchema = z.object({
  email: z.email("Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginResult = { ok: true; mfa: boolean } | { ok: false; error: string };

export async function signIn(input: { email: string; password: string }): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const sb = await sessionClient();
  if (!sb) return { ok: false, error: "Supabase is not configured yet. See SETUP.md." };
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "Email or password is incorrect." };
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) {
    await sb.auth.signOut();
    return { ok: false, error: "This account does not have admin access." };
  }
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  return { ok: true, mfa: Boolean(aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") };
}

export async function verifyMfa(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code from your authenticator app." };
  const sb = await sessionClient();
  if (!sb) return { ok: false, error: "Supabase is not configured." };
  const { data: factors } = await sb.auth.mfa.listFactors();
  const totp = factors?.totp.find((f) => f.status === "verified");
  if (!totp) return { ok: false, error: "No authenticator is set up for this account." };
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: totp.id, code });
  if (error) return { ok: false, error: "That code did not work. Check your authenticator app and try again." };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = await sessionClient();
  await sb?.auth.signOut();
}
