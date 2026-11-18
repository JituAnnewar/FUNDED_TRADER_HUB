import type { MetadataRoute } from "next";
import { activeMonths } from "@/lib/analytics/recap";
import { getAccounts, getPayouts, getPosts, getStrategies, getTrades } from "@/lib/data/public";
import { SITE } from "@/lib/site";

const STATIC = ["", "/performance", "/accounts", "/payouts", "/journal", "/strategies", "/tools", "/firms", "/toolkit", "/insights", "/about", "/contact", "/disclaimer", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [accounts, strategies, posts, trades, payouts] = await Promise.all([getAccounts(), getStrategies(), getPosts(), getTrades(), getPayouts()]);
  const base = SITE.url.replace(/\/$/, "");
  return [
    ...STATIC.map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 })),
    ...accounts.map((a) => ({ url: `${base}/accounts/${a.id}`, lastModified: a.updated_at, priority: 0.6 })),
    ...strategies.map((s) => ({ url: `${base}/strategies/${s.slug}`, lastModified: s.updated_at, priority: 0.6 })),
    ...posts.filter((p) => p.published_at).map((p) => ({ url: `${base}/insights/${p.slug}`, lastModified: p.updated_at, priority: 0.6 })),
    ...activeMonths(trades, payouts).map((m) => ({ url: `${base}/recap/${m}`, priority: 0.5 })),
    ...trades.slice(0, 500).map((t) => ({ url: `${base}/journal/${t.id}`, lastModified: t.updated_at, priority: 0.3 })),
  ];
}
