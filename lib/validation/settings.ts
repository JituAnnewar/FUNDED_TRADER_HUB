import { z } from "zod";

const optUrl = z.preprocess((v) => (v === "" ? null : v), z.url("Use a full link starting with https://").max(500).nullable());
const optText = (max: number) => z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable());

export const SECTION_KEYS = ["payouts", "accounts", "journal", "strategies", "toolkit", "tools", "insights", "goals"] as const;

export const settingsSchema = z.object({
  brand_name: z.string().trim().min(1, "Enter a brand name.").max(40),
  trader_name: z.string().trim().min(1, "Enter your name.").max(40),
  tagline: z.string().trim().max(80),
  hero_copy: optText(400),
  about_text: optText(10_000),
  avatar_url: optText(1000),
  socials: z.object({
    instagram: optUrl,
    x: optUrl,
    youtube: optUrl,
    telegram: optUrl,
    discord: optUrl,
    whatsapp: optUrl,
  }),
  sections: z.object(Object.fromEntries(SECTION_KEYS.map((k) => [k, z.boolean()])) as Record<(typeof SECTION_KEYS)[number], z.ZodBoolean>),
  show_open_positions_publicly: z.boolean(),
  usd_to_inr_rate: z.coerce.number().min(1, "Enter a rate above 1.").max(1000),
  disclaimer_text: optText(5000),
  seo_title: optText(70),
  seo_description: optText(200),
  show_tradingview_widgets: z.boolean(),
});

export type SettingsInput = z.input<typeof settingsSchema>;
