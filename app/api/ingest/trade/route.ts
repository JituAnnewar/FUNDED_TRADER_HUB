import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { TAGS } from "@/lib/data/tags";
import { verifySignature } from "@/lib/ingest/verify";
import { incomingTradeSchema, insertTrades } from "@/lib/import/server";
import { serviceClient } from "@/lib/supabase/clients";

const bodySchema = z.union([
  z.object({ account_id: z.uuid(), trades: z.array(incomingTradeSchema).min(1).max(500) }),
  incomingTradeSchema.extend({ account_id: z.uuid() }),
]);

/**
 * POST /api/ingest/trade — push closed trades from an EA, webhook or sync service.
 * Auth: X-Timestamp (Unix seconds) + X-Signature: sha256=HMAC_SHA256(INGEST_SECRET, `${timestamp}.${rawBody}`).
 * Duplicate ticket IDs (per account) are ignored, so retries are safe. See SETUP.md.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return NextResponse.json({ error: "Ingest is disabled. Set INGEST_SECRET to enable it." }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: "Body too large." }, { status: 413 });

  const v = verifySignature({ secret, timestamp: request.headers.get("x-timestamp"), signature: request.headers.get("x-signature"), body: raw });
  if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 401 });

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues.slice(0, 10).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 422 });

  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  const accountId = parsed.data.account_id;
  const { data: acc } = await sb.from("accounts").select("id").eq("id", accountId).maybeSingle();
  if (!acc) return NextResponse.json({ error: "Unknown account_id." }, { status: 404 });

  const trades = "trades" in parsed.data ? parsed.data.trades : [parsed.data];
  try {
    const res = await insertTrades(sb, accountId, trades, { is_public: true });
    revalidateTag(TAGS.trades, "max");
    revalidateTag(TAGS.accounts, "max");
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Insert failed." }, { status: 500 });
  }
}
