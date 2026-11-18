"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { Resend } from "resend";
import { publicClient } from "@/lib/supabase/clients";
import { contactSchema, type ContactInput, type ContactResult } from "@/lib/validation/contact";

// In-memory fallback limiter (per server instance) used when the database is not configured.
const memory = new Map<string, number[]>();

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "funded-trader-hub";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function sendContactMessage(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof ContactInput;
      fieldErrors[k] ??= issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;
  // Honeypot filled: pretend success so bots learn nothing.
  if (data.website) return { ok: true };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  const ua = h.get("user-agent") ?? "";
  const ipHash = hashIp(ip);

  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return { ok: false, error: "The spam check failed. Please refresh the page and try again." };
  }

  const sb = publicClient();
  let saved = false;
  if (sb) {
    const { data: status, error } = await sb.rpc("submit_contact_message", {
      p_name: data.name,
      p_email: data.email,
      p_category: data.category,
      p_subject: data.subject,
      p_message: data.message,
      p_ip_hash: ipHash,
      p_user_agent: ua,
    });
    if (error) {
      console.error("[contact] save failed:", error.message);
      return { ok: false, error: "Your message could not be sent right now. Please try again in a few minutes." };
    }
    if (status === "rate_limited") return { ok: false, error: "You have sent several messages in a short time. Please wait 10 minutes and try again." };
    saved = true;
  } else {
    const now = Date.now();
    const recent = (memory.get(ipHash) ?? []).filter((t) => now - t < 10 * 60_000);
    if (recent.length >= 3) return { ok: false, error: "You have sent several messages in a short time. Please wait 10 minutes and try again." };
    memory.set(ipHash, [...recent, now]);
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  let emailed = false;
  if (key && to) {
    try {
      const resend = new Resend(key);
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Website <onboarding@resend.dev>",
        to,
        replyTo: data.email,
        subject: `[${data.category}] ${data.subject}`,
        text: `From: ${data.name} <${data.email}>\nCategory: ${data.category}\n\n${data.message}`,
      });
      emailed = !error;
      if (error) console.error("[contact] email failed:", error.message);
    } catch (e) {
      console.error("[contact] email failed:", e instanceof Error ? e.message : e);
    }
  }

  if (!saved && !emailed) {
    return { ok: false, error: "The contact form is not set up yet. Please reach out on WhatsApp for now." };
  }
  return { ok: true };
}
