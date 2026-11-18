/**
 * Static site defaults. Overridden at runtime by the `site_settings` row,
 * which the owner edits in /admin/settings.
 */
import type { Socials } from "@/lib/types";

export type SocialId = keyof Socials;

export interface SocialLink {
  id: SocialId;
  label: string;
  url: string | null;
}

export const SITE = {
  /** Placeholder brand name (brief left it blank). Editable in admin. */
  brand: "JEETU",
  trader: "JEETU",
  tagline: "LESS IS MORE",
  description: "Funded prop firm trader. Forex and gold. A public, live record of accounts, trades and payouts.",
  markets: ["Forex", "Gold"],
  timeZone: "Asia/Kolkata",
  baseCurrency: "USD" as const,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://funded-trader-hub.vercel.app",
};

export const SOCIAL_LABELS: Record<SocialId, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  discord: "Discord",
};

/** Defaults used until the owner sets links in admin. */
export const SOCIALS: SocialLink[] = [
  { id: "whatsapp", label: "WhatsApp", url: "https://wa.me/918329896591" },
  { id: "telegram", label: "Telegram", url: null },
  { id: "instagram", label: "Instagram", url: null },
  { id: "x", label: "X", url: null },
  { id: "youtube", label: "YouTube", url: null },
  { id: "discord", label: "Discord", url: null },
];

export function socialLinks(socials: Socials): SocialLink[] {
  return (Object.keys(SOCIAL_LABELS) as SocialId[])
    .map((id) => ({ id, label: SOCIAL_LABELS[id], url: socials[id] || null }))
    .filter((s) => s.url);
}

export interface NavItem {
  href: string;
  label: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/performance", label: "Performance" },
  { href: "/accounts", label: "Accounts" },
  { href: "/payouts", label: "Payouts" },
  { href: "/journal", label: "Journal" },
  { href: "/strategies", label: "Strategies" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/tools", label: "Tools" },
  { href: "/firms", label: "Firms" },
  { href: "/toolkit", label: "Toolkit" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

export const CONTACT_NAV: NavItem = { href: "/contact", label: "Contact" };

export const LEGAL_NAV: NavItem[] = [
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Privacy" },
];

export const RISK_NOTE =
  "Results shown are for education and journaling only. Most prop firm accounts trade simulated capital. Past performance does not guarantee future results.";
