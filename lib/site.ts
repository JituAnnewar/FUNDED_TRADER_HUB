/**
 * Static site defaults. From Phase 2 these are overridden by the `site_settings` row,
 * which the owner edits in /admin/settings.
 */

export interface SocialLink {
  id: "instagram" | "x" | "youtube" | "telegram" | "discord" | "whatsapp";
  label: string;
  url: string | null;
}

export const SITE = {
  /** Placeholder brand name (brief left it blank). Editable in admin from Phase 7. */
  brand: "JEETU",
  trader: "JEETU",
  tagline: "LESS IS MORE",
  description:
    "Funded prop firm trader. Forex and gold. A public, live record of accounts, trades and payouts.",
  markets: ["Forex", "Gold"],
  timeZone: "Asia/Kolkata",
  baseCurrency: "USD" as const,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/** Links with a null url are hidden until set in admin. */
export const SOCIALS: SocialLink[] = [
  { id: "whatsapp", label: "WhatsApp", url: "https://wa.me/918329896591" },
  { id: "telegram", label: "Telegram", url: null },
  { id: "instagram", label: "Instagram", url: null },
  { id: "x", label: "X", url: null },
  { id: "youtube", label: "YouTube", url: null },
  { id: "discord", label: "Discord", url: null },
];

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
  { href: "/tools", label: "Tools" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/firms", label: "Firms" },
  { href: "/toolkit", label: "Toolkit" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const LEGAL_NAV: NavItem[] = [
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Privacy" },
];

export const RISK_NOTE =
  "Results shown are for education and journaling only. Most prop firm accounts trade simulated capital. Past performance does not guarantee future results.";
